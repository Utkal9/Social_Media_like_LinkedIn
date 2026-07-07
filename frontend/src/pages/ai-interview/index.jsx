"use client";
import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import Head from "next/head";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const BACKEND_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";

const ROLES = [
    "Software Engineer",
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Developer",
    "Data Scientist",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Product Manager",
    "Cloud Architect",
    "Mobile Developer",
];

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------
export default function AIInterviewPage() {
    const auth = useSelector((state) => state.auth);
    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // ── Socket ──────────────────────────────────────────────────────────────
    const socketRef = useRef(null);

    // ── Session state ────────────────────────────────────────────────────────
    const [phase, setPhase] = useState("idle"); // idle | connecting | active | ended
    const [selectedRole, setSelectedRole] = useState(ROLES[0]);
    const [messages, setMessages] = useState([]); // { role, text, ts }
    const [isThinking, setIsThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [turnCount, setTurnCount] = useState(0);
    const [liveTranscript, setLiveTranscript] = useState("");
    const [error, setError] = useState("");
    const [audioLevel, setAudioLevel] = useState(0);
    const [sessionEnded, setSessionEnded] = useState(false);

    // ── Refs ─────────────────────────────────────────────────────────────────
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);
    const messagesEndRef = useRef(null);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const micStreamRef = useRef(null);
    const animFrameRef = useRef(null);

    // ── Auto-scroll ──────────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    // ── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            disconnectAll();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Build SpeechRecognition ──────────────────────────────────────────────
    const buildRecognition = useCallback(() => {
        if (typeof window === "undefined") return null;
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.maxAlternatives = 1;

        rec.onresult = (event) => {
            let interim = "";
            let final = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript + " ";
                } else {
                    interim += transcript;
                }
            }
            setLiveTranscript(interim || final);
            if (final.trim()) {
                sendAnswer(final.trim());
            }
        };

        rec.onerror = (e) => {
            console.warn("[SpeechRec] Error:", e.error);
            if (e.error !== "no-speech") {
                setError(`Microphone error: ${e.error}. Please try again.`);
            }
            setIsListening(false);
            setLiveTranscript("");
        };

        rec.onend = () => {
            setIsListening(false);
            setLiveTranscript("");
        };

        return rec;
    }, []); // eslint-disable-line

    // ── Audio level visualiser ───────────────────────────────────────────────
    const startAudioVisualization = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            micStreamRef.current = stream;

            const audioCtx = new (window.AudioContext ||
                window.webkitAudioContext)();
            audioCtxRef.current = audioCtx;

            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const tick = () => {
                analyser.getByteFrequencyData(dataArray);
                const avg =
                    dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setAudioLevel(Math.min(avg / 128, 1));
                animFrameRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch {
            console.warn("[AudioViz] Microphone not available.");
        }
    };

    const stopAudioVisualization = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((t) => t.stop());
            micStreamRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
            audioCtxRef.current = null;
        }
        setAudioLevel(0);
    };

    // ── Text-to-Speech ───────────────────────────────────────────────────────
    const speak = useCallback(
        (text, onEnd) => {
            if (typeof window === "undefined" || !window.speechSynthesis)
                return;
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1.05;
            utterance.volume = 1;

            // Prefer a natural female voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferred =
                voices.find(
                    (v) =>
                        v.name.includes("Samantha") ||
                        v.name.includes("Karen") ||
                        v.name.includes("Google UK English Female") ||
                        v.name.includes("Microsoft Zira")
                ) || voices[0];
            if (preferred) utterance.voice = preferred;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
                setIsSpeaking(false);
                onEnd && onEnd();
            };
            utterance.onerror = () => {
                setIsSpeaking(false);
                onEnd && onEnd();
            };

            window.speechSynthesis.speak(utterance);
        },
        []
    );

    // ── Send answer via Socket ────────────────────────────────────────────────
    const sendAnswer = useCallback(
        (text) => {
            if (!socketRef.current || !text.trim()) return;
            setMessages((prev) => [
                ...prev,
                { role: "user", text, ts: Date.now() },
            ]);
            socketRef.current.emit("ai-interview:answer", { text });
            setLiveTranscript("");
        },
        []
    );

    // ── Start listening ───────────────────────────────────────────────────────
    const startListening = useCallback(() => {
        if (isListening || isSpeaking || isThinking) return;

        const rec = buildRecognition();
        if (!rec) {
            setError(
                "Speech Recognition is not supported in your browser. Please use Chrome or Edge."
            );
            return;
        }
        recognitionRef.current = rec;
        setError("");
        setIsListening(true);
        rec.start();
        startAudioVisualization();
    }, [isListening, isSpeaking, isThinking, buildRecognition]); // eslint-disable-line

    // ── Stop listening ────────────────────────────────────────────────────────
    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
        stopAudioVisualization();
    }, []);

    // ── Start session ─────────────────────────────────────────────────────────
    const startSession = useCallback(() => {
        setPhase("connecting");
        setMessages([]);
        setError("");
        setSessionEnded(false);
        setTurnCount(0);

        const socket = io(BACKEND_URL, {
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setPhase("active");
            socket.emit("ai-interview:start", {
                token,
                role: selectedRole,
            });
        });

        socket.on("ai-interview:response", ({ text, isGreeting }) => {
            setIsThinking(false);
            setMessages((prev) => [
                ...prev,
                { role: "ai", text, ts: Date.now(), isGreeting },
            ]);
            // Read response aloud
            speak(text, () => {
                if (!sessionEnded) {
                    // Slight delay before auto-listening
                    setTimeout(() => startListening(), 600);
                }
            });
        });

        socket.on("ai-interview:thinking", (val) => {
            setIsThinking(val);
        });

        socket.on("ai-interview:error", ({ message }) => {
            setError(message);
            setIsThinking(false);
        });

        socket.on("ai-interview:session-end", ({ message }) => {
            setSessionEnded(true);
            setPhase("ended");
            setIsListening(false);
            stopAudioVisualization();
            window.speechSynthesis?.cancel();
            setMessages((prev) => [
                ...prev,
                { role: "system", text: message, ts: Date.now() },
            ]);
        });

        socket.on("disconnect", () => {
            if (!sessionEnded) {
                setError("Connection lost. Please restart the session.");
                setPhase("idle");
            }
        });

        socket.on("connect_error", () => {
            setError("Cannot connect to server. Make sure the backend is running.");
            setPhase("idle");
        });
    }, [token, selectedRole, speak, startListening, sessionEnded]); // eslint-disable-line

    // ── End session ───────────────────────────────────────────────────────────
    const disconnectAll = useCallback(() => {
        recognitionRef.current?.abort();
        window.speechSynthesis?.cancel();
        stopAudioVisualization();
        socketRef.current?.emit("ai-interview:end");
        socketRef.current?.disconnect();
        socketRef.current = null;
        setPhase("idle");
        setIsListening(false);
        setIsSpeaking(false);
        setIsThinking(false);
        setLiveTranscript("");
        setSessionEnded(false);
    }, []); // eslint-disable-line

    // ── Pulse size for AI orb based on audio level ────────────────────────────
    const orbScale = isSpeaking
        ? 1 + audioLevel * 0.35
        : isListening
        ? 1 + audioLevel * 0.25
        : 1;

    const orbColor = isSpeaking
        ? "#6366f1"
        : isListening
        ? "#10b981"
        : isThinking
        ? "#f59e0b"
        : "#334155";

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <Head>
                <title>AI Interview Practice — LinkUps</title>
                <meta
                    name="description"
                    content="Practice technical interviews with ARIA, your AI-powered voice interviewer on LinkUps."
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@500;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* ── Root Shell ───────────────────────────────────────────────── */}
            <div className="ai-interview-root">
                {/* Ambient background blobs */}
                <div className="blob blob-1" />
                <div className="blob blob-2" />
                <div className="blob blob-3" />

                {/* ── IDLE / SETUP SCREEN ─────────────────────────────────── */}
                {phase === "idle" && (
                    <div className="setup-panel glass-card">
                        <div className="setup-header">
                            <div className="aria-logo-static">
                                <span className="aria-glyph">⬡</span>
                            </div>
                            <h1 className="setup-title">
                                AI Mock <span className="gradient-text">Interview</span>
                            </h1>
                            <p className="setup-subtitle">
                                Practice with ARIA — your strict, adaptive AI interviewer.
                                Real questions. Real pressure. Real growth.
                            </p>
                        </div>

                        <div className="setup-body">
                            <label className="setup-label" htmlFor="role-select">
                                Select Target Role
                            </label>
                            <select
                                id="role-select"
                                className="role-select"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>

                            <div className="feature-chips">
                                {[
                                    { icon: "🎙️", label: "Voice Input" },
                                    { icon: "🔊", label: "AI Voice Output" },
                                    { icon: "🧠", label: "Gemini Powered" },
                                    { icon: "📊", label: "Real-time Feedback" },
                                ].map((f) => (
                                    <span key={f.label} className="chip">
                                        {f.icon} {f.label}
                                    </span>
                                ))}
                            </div>

                            {error && (
                                <div className="error-banner" role="alert">
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                id="start-interview-btn"
                                className="btn-primary btn-lg"
                                onClick={startSession}
                            >
                                <span className="btn-icon">▶</span>
                                Start Interview
                            </button>
                        </div>
                    </div>
                )}

                {/* ── CONNECTING ──────────────────────────────────────────── */}
                {phase === "connecting" && (
                    <div className="connecting-screen">
                        <div className="spinner-ring" />
                        <p className="connecting-text">Connecting to ARIA...</p>
                    </div>
                )}

                {/* ── ACTIVE INTERVIEW SCREEN ─────────────────────────────── */}
                {(phase === "active" || phase === "ended") && (
                    <div className="interview-layout">
                        {/* ── Left Panel — AI Interviewer ─────────────────── */}
                        <div className="panel-left glass-card">
                            <div className="interviewer-header">
                                <span className="live-badge">
                                    {phase === "ended" ? "⬛ SESSION ENDED" : "🔴 LIVE"}
                                </span>
                                <span className="turn-badge">
                                    Turn {turnCount}/10
                                </span>
                            </div>

                            {/* Orb */}
                            <div className="orb-container">
                                <div
                                    className="orb-outer"
                                    style={{
                                        transform: `scale(${orbScale})`,
                                        boxShadow: `0 0 60px ${orbColor}55, 0 0 120px ${orbColor}22`,
                                    }}
                                >
                                    <div
                                        className="orb-inner"
                                        style={{ background: `radial-gradient(circle at 35% 35%, ${orbColor}cc, #0f172a)` }}
                                    >
                                        <span className="orb-glyph">⬡</span>
                                    </div>
                                </div>

                                {/* Audio ring visualizer */}
                                {(isSpeaking || isListening) && (
                                    <div
                                        className="audio-ring"
                                        style={{
                                            opacity: audioLevel * 0.8 + 0.2,
                                            transform: `scale(${1 + audioLevel * 0.5})`,
                                            borderColor: orbColor,
                                        }}
                                    />
                                )}
                            </div>

                            <h2 className="aria-name">ARIA</h2>
                            <p className="aria-title">Senior Technical Interviewer</p>

                            <div className="status-row">
                                <StatusDot
                                    active={isSpeaking}
                                    color="#6366f1"
                                    label="Speaking"
                                />
                                <StatusDot
                                    active={isThinking}
                                    color="#f59e0b"
                                    label="Thinking"
                                />
                                <StatusDot
                                    active={isListening}
                                    color="#10b981"
                                    label="Listening"
                                />
                            </div>

                            {/* Role pill */}
                            <div className="role-pill">{selectedRole}</div>

                            {/* Controls */}
                            {phase === "active" && (
                                <div className="controls">
                                    <button
                                        id="mic-toggle-btn"
                                        className={`btn-mic ${isListening ? "btn-mic-active" : ""}`}
                                        onClick={isListening ? stopListening : startListening}
                                        disabled={isThinking || isSpeaking}
                                        title={isListening ? "Stop Listening" : "Start Speaking"}
                                    >
                                        {isListening ? "⏹ Stop" : "🎙 Speak"}
                                    </button>

                                    <button
                                        id="end-session-btn"
                                        className="btn-end"
                                        onClick={disconnectAll}
                                        title="End Interview"
                                    >
                                        ✕ End Session
                                    </button>
                                </div>
                            )}

                            {phase === "ended" && (
                                <button
                                    id="new-session-btn"
                                    className="btn-primary"
                                    onClick={() => {
                                        setMessages([]);
                                        setPhase("idle");
                                    }}
                                >
                                    Start New Session
                                </button>
                            )}
                        </div>

                        {/* ── Right Panel — Transcript ─────────────────────── */}
                        <div className="panel-right glass-card">
                            <div className="transcript-header">
                                <h3 className="transcript-title">
                                    Interview Transcript
                                </h3>
                                <span className="model-badge">✦ Gemini</span>
                            </div>

                            <div className="transcript-body">
                                {messages.length === 0 && !isThinking && (
                                    <div className="transcript-empty">
                                        <div className="empty-orb">⬡</div>
                                        <p>
                                            ARIA is preparing your interview...
                                        </p>
                                    </div>
                                )}

                                {messages.map((msg, i) => (
                                    <MessageBubble key={i} msg={msg} />
                                ))}

                                {isThinking && <ThinkingIndicator />}

                                {/* Live transcript preview */}
                                {isListening && liveTranscript && (
                                    <div className="live-transcript-preview">
                                        <span className="live-dot" />
                                        <em>{liveTranscript}</em>
                                    </div>
                                )}

                                {error && (
                                    <div className="error-banner" role="alert">
                                        ⚠️ {error}
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Mic hint bar */}
                            {phase === "active" && (
                                <div className="mic-hint">
                                    {isListening ? (
                                        <>
                                            <MicLevelBar level={audioLevel} />
                                            <span>Listening — speak your answer</span>
                                        </>
                                    ) : isSpeaking ? (
                                        <span>🔊 ARIA is speaking — please wait...</span>
                                    ) : isThinking ? (
                                        <span>🧠 ARIA is formulating a response...</span>
                                    ) : (
                                        <span>
                                            Press <strong>🎙 Speak</strong> when you're ready to answer
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Global Styles ──────────────────────────────────────────────── */}
            <style>{`
                /* ── Reset & Root ── */
                .ai-interview-root {
                    min-height: 100vh;
                    background: #020817;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                    font-family: 'Inter', sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                /* ── Ambient background blobs ── */
                .blob {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.18;
                    pointer-events: none;
                    animation: blobFloat 14s ease-in-out infinite alternate;
                }
                .blob-1 { width: 520px; height: 520px; background: #6366f1; top: -10%; left: -10%; }
                .blob-2 { width: 400px; height: 400px; background: #0ea5e9; bottom: -5%; right: -5%; animation-delay: -6s; }
                .blob-3 { width: 300px; height: 300px; background: #10b981; top: 50%; right: 25%; animation-delay: -3s; }

                @keyframes blobFloat {
                    from { transform: translate(0, 0) scale(1); }
                    to   { transform: translate(30px, 20px) scale(1.08); }
                }

                /* ── Glass Card ── */
                .glass-card {
                    background: rgba(15, 23, 42, 0.75);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-radius: 1.5rem;
                    box-shadow: 0 0 80px rgba(99, 102, 241, 0.08),
                                0 25px 50px rgba(0,0,0,0.5);
                }

                /* ── SETUP PANEL ── */
                .setup-panel {
                    width: 100%;
                    max-width: 520px;
                    padding: 3rem 2.5rem;
                    text-align: center;
                    position: relative;
                    z-index: 10;
                    animation: fadeUp 0.5s ease-out;
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .setup-header { margin-bottom: 2rem; }

                .aria-logo-static {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 72px;
                    height: 72px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #6366f1, #0f172a);
                    box-shadow: 0 0 40px rgba(99,102,241,0.5);
                    margin-bottom: 1.25rem;
                }
                .aria-glyph {
                    font-size: 2rem;
                    color: #c7d2fe;
                    animation: ariaGlyphSpin 8s linear infinite;
                }
                @keyframes ariaGlyphSpin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }

                .setup-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #f1f5f9;
                    font-family: 'Orbitron', sans-serif;
                    letter-spacing: 0.02em;
                    margin: 0 0 0.75rem;
                }
                .gradient-text {
                    background: linear-gradient(90deg, #818cf8, #34d399);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .setup-subtitle {
                    color: #94a3b8;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    max-width: 380px;
                    margin: 0 auto;
                }

                .setup-body { display: flex; flex-direction: column; gap: 1.25rem; }

                .setup-label {
                    display: block;
                    text-align: left;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    margin-bottom: -0.75rem;
                }
                .role-select {
                    width: 100%;
                    padding: 0.8rem 1rem;
                    background: rgba(30, 41, 59, 0.9);
                    border: 1px solid rgba(99, 102, 241, 0.35);
                    border-radius: 0.75rem;
                    color: #e2e8f0;
                    font-size: 0.95rem;
                    font-family: 'Inter', sans-serif;
                    cursor: pointer;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .role-select:focus { border-color: #6366f1; }

                .feature-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    justify-content: center;
                }
                .chip {
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    color: #a5b4fc;
                    border-radius: 999px;
                    padding: 0.35rem 0.9rem;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                /* ── Buttons ── */
                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.6rem;
                    padding: 0.85rem 2rem;
                    background: linear-gradient(135deg, #6366f1, #4f46e5);
                    color: #fff;
                    border: none;
                    border-radius: 0.875rem;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.15s, box-shadow 0.15s;
                    box-shadow: 0 0 30px rgba(99,102,241,0.4);
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 0 40px rgba(99,102,241,0.6);
                }
                .btn-lg { padding: 1rem 2.5rem; font-size: 1.05rem; }
                .btn-icon { font-size: 0.85rem; }

                /* ── Connecting ── */
                .connecting-screen {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                    z-index: 10;
                }
                .spinner-ring {
                    width: 70px;
                    height: 70px;
                    border: 3px solid rgba(99,102,241,0.2);
                    border-top-color: #6366f1;
                    border-radius: 50%;
                    animation: spin 0.85s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .connecting-text { color: #94a3b8; font-size: 1rem; }

                /* ── Interview Layout ── */
                .interview-layout {
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    gap: 1.25rem;
                    width: 100%;
                    max-width: 1100px;
                    height: min(85vh, 780px);
                    z-index: 10;
                    animation: fadeUp 0.4s ease-out;
                }
                @media (max-width: 768px) {
                    .interview-layout {
                        grid-template-columns: 1fr;
                        height: auto;
                    }
                }

                /* ── Left Panel ── */
                .panel-left {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1.75rem 1.5rem;
                    gap: 0.75rem;
                    overflow: hidden;
                }

                .interviewer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }
                .live-badge {
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    color: #f87171;
                    background: rgba(239,68,68,0.12);
                    border: 1px solid rgba(239,68,68,0.3);
                    padding: 0.25rem 0.65rem;
                    border-radius: 999px;
                }
                .turn-badge {
                    font-size: 0.75rem;
                    color: #64748b;
                    font-family: monospace;
                }

                /* ── Orb ── */
                .orb-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0.5rem 0;
                }
                .orb-outer {
                    width: 130px;
                    height: 130px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .orb-inner {
                    width: 110px;
                    height: 110px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .orb-glyph {
                    font-size: 2.5rem;
                    color: rgba(199, 210, 254, 0.9);
                    animation: orbSpin 12s linear infinite;
                }
                @keyframes orbSpin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                .audio-ring {
                    position: absolute;
                    width: 148px;
                    height: 148px;
                    border-radius: 50%;
                    border: 2px solid;
                    transition: transform 0.1s ease, opacity 0.1s ease;
                    pointer-events: none;
                }

                .aria-name {
                    font-family: 'Orbitron', sans-serif;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #e2e8f0;
                    margin: 0;
                    letter-spacing: 0.08em;
                }
                .aria-title {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin: 0;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }

                /* ── Status Dots ── */
                .status-row {
                    display: flex;
                    gap: 0.75rem;
                    margin: 0.25rem 0;
                }
                .status-dot-wrap {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #1e293b;
                    transition: background 0.3s, box-shadow 0.3s;
                }
                .status-dot.active {
                    animation: dotPulse 1s infinite;
                }
                @keyframes dotPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.25); }
                }
                .status-label {
                    font-size: 0.7rem;
                    color: #475569;
                    font-weight: 500;
                }
                .status-label.active { color: #94a3b8; }

                .role-pill {
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99,102,241,0.25);
                    color: #a5b4fc;
                    border-radius: 999px;
                    padding: 0.3rem 0.9rem;
                    font-size: 0.78rem;
                    font-weight: 500;
                    text-align: center;
                }

                /* ── Mic Controls ── */
                .controls {
                    display: flex;
                    flex-direction: column;
                    gap: 0.65rem;
                    width: 100%;
                    margin-top: auto;
                }
                .btn-mic {
                    width: 100%;
                    padding: 0.85rem;
                    background: rgba(16, 185, 129, 0.12);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 0.875rem;
                    color: #34d399;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.15s;
                    font-family: 'Inter', sans-serif;
                }
                .btn-mic:hover:not(:disabled) {
                    background: rgba(16, 185, 129, 0.22);
                    transform: translateY(-1px);
                }
                .btn-mic:disabled { opacity: 0.4; cursor: not-allowed; }
                .btn-mic-active {
                    background: rgba(16, 185, 129, 0.25) !important;
                    border-color: #10b981 !important;
                    box-shadow: 0 0 20px rgba(16,185,129,0.3);
                    animation: micPulse 1.5s infinite;
                }
                @keyframes micPulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.3); }
                    50% { box-shadow: 0 0 35px rgba(16,185,129,0.6); }
                }
                .btn-end {
                    width: 100%;
                    padding: 0.7rem;
                    background: transparent;
                    border: 1px solid rgba(239,68,68,0.3);
                    border-radius: 0.875rem;
                    color: #f87171;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                    font-family: 'Inter', sans-serif;
                }
                .btn-end:hover {
                    background: rgba(239,68,68,0.1);
                }

                /* ── Right Panel — Transcript ── */
                .panel-right {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .transcript-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.25rem 1.5rem 1rem;
                    border-bottom: 1px solid rgba(99,102,241,0.12);
                    flex-shrink: 0;
                }
                .transcript-title {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #cbd5e1;
                    margin: 0;
                }
                .model-badge {
                    font-size: 0.72rem;
                    color: #818cf8;
                    background: rgba(99,102,241,0.1);
                    border: 1px solid rgba(99,102,241,0.2);
                    padding: 0.2rem 0.6rem;
                    border-radius: 999px;
                }

                .transcript-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.25rem 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(99,102,241,0.3) transparent;
                }
                .transcript-body::-webkit-scrollbar { width: 4px; }
                .transcript-body::-webkit-scrollbar-track { background: transparent; }
                .transcript-body::-webkit-scrollbar-thumb {
                    background: rgba(99,102,241,0.3);
                    border-radius: 2px;
                }

                .transcript-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    height: 100%;
                    color: #334155;
                }
                .empty-orb {
                    font-size: 3rem;
                    animation: ariaGlyphSpin 10s linear infinite;
                    opacity: 0.4;
                }

                /* ── Message Bubbles ── */
                .msg-bubble {
                    display: flex;
                    gap: 0.75rem;
                    animation: fadeUp 0.3s ease-out;
                }
                .msg-bubble.user { flex-direction: row-reverse; }
                .msg-bubble.system { justify-content: center; }

                .msg-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    font-weight: 700;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .msg-avatar.ai { background: rgba(99,102,241,0.2); color: #818cf8; }
                .msg-avatar.user { background: rgba(16,185,129,0.2); color: #34d399; }

                .msg-content { max-width: 75%; }

                .msg-name {
                    font-size: 0.7rem;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    margin-bottom: 0.3rem;
                }
                .msg-name.ai { color: #818cf8; }
                .msg-name.user { color: #34d399; text-align: right; }

                .msg-text {
                    padding: 0.75rem 1rem;
                    border-radius: 1rem;
                    font-size: 0.9rem;
                    line-height: 1.6;
                }
                .msg-text.ai {
                    background: rgba(99,102,241,0.1);
                    border: 1px solid rgba(99,102,241,0.15);
                    color: #cbd5e1;
                    border-top-left-radius: 0.25rem;
                }
                .msg-text.user {
                    background: rgba(16,185,129,0.1);
                    border: 1px solid rgba(16,185,129,0.15);
                    color: #d1fae5;
                    border-top-right-radius: 0.25rem;
                }
                .msg-text.system {
                    background: rgba(248,113,113,0.08);
                    border: 1px solid rgba(248,113,113,0.15);
                    color: #fca5a5;
                    border-radius: 0.75rem;
                    font-size: 0.85rem;
                    text-align: center;
                    padding: 0.6rem 1.25rem;
                }

                .msg-time {
                    font-size: 0.65rem;
                    color: #475569;
                    margin-top: 0.25rem;
                    display: block;
                }
                .msg-bubble.user .msg-time { text-align: right; }

                /* ── Thinking Indicator ── */
                .thinking-wrap {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #64748b;
                    font-size: 0.82rem;
                }
                .thinking-dots { display: flex; gap: 3px; }
                .thinking-dots span {
                    display: block;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #6366f1;
                    animation: dotBounce 1.2s infinite;
                }
                .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
                .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes dotBounce {
                    0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }

                /* ── Live transcript preview ── */
                .live-transcript-preview {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1rem;
                    background: rgba(16,185,129,0.06);
                    border: 1px dashed rgba(16,185,129,0.25);
                    border-radius: 0.75rem;
                    color: #6ee7b7;
                    font-size: 0.85rem;
                    font-style: italic;
                }
                .live-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #10b981;
                    animation: dotPulse 0.8s infinite;
                    flex-shrink: 0;
                }

                /* ── Mic hint bar ── */
                .mic-hint {
                    padding: 0.9rem 1.5rem;
                    border-top: 1px solid rgba(99,102,241,0.1);
                    color: #64748b;
                    font-size: 0.82rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-shrink: 0;
                    min-height: 48px;
                }
                .mic-hint strong { color: #94a3b8; }

                /* ── Mic level bar ── */
                .mic-level-bar-wrap {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    height: 20px;
                }
                .mic-level-bar-segment {
                    width: 3px;
                    border-radius: 2px;
                    background: #10b981;
                    transition: height 0.05s ease;
                    min-height: 3px;
                }

                /* ── Error banner ── */
                .error-banner {
                    background: rgba(239,68,68,0.08);
                    border: 1px solid rgba(239,68,68,0.25);
                    color: #fca5a5;
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    font-size: 0.85rem;
                    line-height: 1.5;
                }
            `}</style>
        </>
    );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function StatusDot({ active, color, label }) {
    return (
        <div className="status-dot-wrap">
            <div
                className={`status-dot ${active ? "active" : ""}`}
                style={active ? { background: color, boxShadow: `0 0 8px ${color}` } : {}}
            />
            <span className={`status-label ${active ? "active" : ""}`}>
                {label}
            </span>
        </div>
    );
}

function MessageBubble({ msg }) {
    const { role, text, ts } = msg;
    const time = new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (role === "system") {
        return (
            <div className="msg-bubble system">
                <div className="msg-text system">{text}</div>
            </div>
        );
    }

    const isUser = role === "user";

    return (
        <div className={`msg-bubble ${isUser ? "user" : "ai"}`}>
            {!isUser && (
                <div className="msg-avatar ai">⬡</div>
            )}
            <div className="msg-content">
                <p className={`msg-name ${isUser ? "user" : "ai"}`}>
                    {isUser ? "You" : "ARIA"}
                </p>
                <div className={`msg-text ${isUser ? "user" : "ai"}`}>{text}</div>
                <span className="msg-time">{time}</span>
            </div>
            {isUser && (
                <div className="msg-avatar user">U</div>
            )}
        </div>
    );
}

function ThinkingIndicator() {
    return (
        <div className="thinking-wrap">
            <div className="msg-avatar ai">⬡</div>
            <div className="thinking-dots">
                <span />
                <span />
                <span />
            </div>
            <span>ARIA is thinking...</span>
        </div>
    );
}

function MicLevelBar({ level }) {
    const segments = 8;
    const filled = Math.round(level * segments);
    return (
        <div className="mic-level-bar-wrap" aria-hidden="true">
            {Array.from({ length: segments }, (_, i) => (
                <div
                    key={i}
                    className="mic-level-bar-segment"
                    style={{
                        height: i < filled ? `${8 + i * 2}px` : "4px",
                        opacity: i < filled ? 1 : 0.25,
                    }}
                />
            ))}
        </div>
    );
}

// ── Layout: no default layout wrapper (full-page experience) ─────────────────
AIInterviewPage.getLayout = (page) => page;
