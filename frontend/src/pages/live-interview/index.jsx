// frontend/src/pages/live-interview/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Real-Time Photorealistic AI Interviewer — Google Meet UI
//
// ROOT CAUSE FIX: D-ID WebRTC `ontrack` was firing when `avatarVideoRef`
// was still null (video element not yet mounted). Fixed by:
//   1. Always keeping <video ref={avatarVideoRef}> in the DOM (never conditional)
//   2. Storing the MediaStream in didRemoteStreamRef as backup
//   3. Moving setupDIDWebRTC() INSIDE socket.on("connect") — after phase="active"
//   4. useEffect reconnects stored stream when video element finally mounts
//
// Pipeline:
//   SpeechRecognition → Socket.io → Gemini AI (multi-turn)
//   → ElevenLabs TTS audio → D-ID WebRTC lip-sync → photorealistic avatar
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";

// ─── D-ID proxy helpers (keys stay on backend) ────────────────────────────────
const didApi = {
    create: () =>
        fetch(`${BACKEND_URL}/api/avatar/stream/create`, { method: "POST" }).then((r) => r.json()),
    sdp: (id, answer, session_id) =>
        fetch(`${BACKEND_URL}/api/avatar/stream/${id}/sdp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answer, session_id }),
        }).then((r) => r.json()),
    ice: (id, candidate, sdpMid, sdpMLineIndex, session_id) =>
        fetch(`${BACKEND_URL}/api/avatar/stream/${id}/ice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidate, sdpMid, sdpMLineIndex, session_id }),
        }).then((r) => r.json()),
    talk: (id, session_id, text, audioUrl) =>
        fetch(`${BACKEND_URL}/api/avatar/stream/${id}/talk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id, text, audio_url: audioUrl }),
        }).then(async (r) => {
            const data = await r.json();
            // CRITICAL: throw on HTTP errors so triggerDIDTalk falls back to browser TTS
            if (!r.ok) throw new Error(data?.message || `D-ID talk HTTP ${r.status}`);
            return data;
        }),
    close: (id, session_id) =>
        fetch(`${BACKEND_URL}/api/avatar/stream/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id }),
        }).catch(() => {}),
};

const ROLES = [
    "Software Engineer", "Frontend Engineer", "Backend Engineer",
    "Full Stack Developer", "Data Scientist", "DevOps Engineer",
    "Product Manager", "UI/UX Designer", "QA Engineer", "System Design Architect",
];

// ─── Browser TTS helpers ──────────────────────────────────────────────────────
const pickVoice = () => {
    const v = window.speechSynthesis.getVoices();
    if (!v.length) return null;
    const score = (x) => {
        const n = x.name.toLowerCase(), l = x.lang.toLowerCase();
        if (l.startsWith("en-in") && x.localService) return 10;
        if (l.startsWith("en-in")) return 9;
        if (n.includes("priya") || n.includes("meera")) return 8;
        if (n.includes("india") && l.startsWith("en")) return 7;
        if (l.startsWith("en") && (n.includes("female") || n.includes("zira") || n.includes("aria") || n.includes("jenny") || n.includes("sonia"))) return 6;
        if (l.startsWith("en-gb")) return 5;
        if (l.startsWith("en")) return 4;
        return 0;
    };
    return v.sort((a, b) => score(b) - score(a))[0] || v[0];
};

const speak = (text, { onStart, onEnd } = {}) => {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang || "en-IN";
    u.rate = 0.92; u.pitch = 1.1; u.volume = 1;
    u.onstart = () => onStart?.();
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    const go = () => { window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); };
    if (!window.speechSynthesis.getVoices().length) {
        window.speechSynthesis.onvoiceschanged = () => { go(); window.speechSynthesis.onvoiceschanged = null; };
    } else { go(); }
};

// ─── Micro-animation components ───────────────────────────────────────────────
const SpeakWave = () => (
    <span style={{ display: "inline-flex", gap: 2, alignItems: "center" }}>
        {[0,1,2,3,4].map((i) => (
            <span key={i} style={{ width: 3, height: 14, borderRadius: 2, background: "#10b981", display: "inline-block", animation: `wavePulse 0.7s ease-in-out ${i*0.1}s infinite` }} />
        ))}
    </span>
);
const ThinkDots = () => (
    <span style={{ display: "inline-flex", gap: 4 }}>
        {[0,1,2].map((i) => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", display: "inline-block", animation: `dotBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
        ))}
    </span>
);
const ListenPulse = () => (
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "livePulse 0.8s ease-in-out infinite" }} />
);

// ─── CSS Animated Avatar (fallback) ──────────────────────────────────────────
const PriyaAvatar = ({ state }) => {
    const col = state === "speaking" ? "#10b981" : state === "listening" ? "#ef4444" : state === "thinking" ? "#a78bfa" : "#6366f1";
    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ position: "absolute", inset: -12, borderRadius: "50%", border: `3px solid ${col}`, opacity: state === "idle" ? 0.2 : 0.7, animation: state !== "idle" ? "ringPulse 0.8s ease-in-out infinite" : "none", transition: "all 0.4s" }} />
            {state === "speaking" && <div style={{ position: "absolute", inset: -28, borderRadius: "50%", border: `2px solid #10b981`, opacity: 0.3, animation: "ringPulse 0.7s ease-in-out 0.2s infinite" }} />}
            <div style={{
                width: 280, height: 320, borderRadius: "50% 50% 45% 45% / 50% 50% 45% 45%",
                overflow: "hidden", border: `3px solid ${col}`,
                boxShadow: `0 0 60px ${col}55, 0 0 20px ${col}33`,
                transition: "border-color 0.4s, box-shadow 0.6s",
                animation: state === "speaking" ? "speakBob 0.6s ease-in-out infinite" : state === "thinking" ? "thinkTilt 2s ease-in-out infinite" : "breathe 4s ease-in-out infinite",
            }}>
                <img src="/priya-avatar.png" alt="Priya" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: state === "thinking" ? "brightness(0.9) saturate(0.8)" : "brightness(1)", transition: "filter 0.5s" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)", pointerEvents: "none" }} />
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${col}44`, borderRadius: 999, padding: "6px 16px", transition: "border-color 0.4s" }}>
                {state === "speaking"  && <><SpeakWave /><span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#10b981" }}>Priya is speaking</span></>}
                {state === "thinking"  && <><ThinkDots /><span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#a78bfa" }}>Priya is thinking...</span></>}
                {state === "listening" && <><ListenPulse /><span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#ef4444" }}>Listening...</span></>}
                {state === "idle"      && <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>Priya · AI Interviewer</span>}
            </div>
        </div>
    );
};

// ─── Transcript bubble ────────────────────────────────────────────────────────
const Bubble = ({ msg }) => {
    const isUser = msg.role === "user";
    if (msg.role === "system") return (
        <div style={{ textAlign: "center", color: "#475569", fontSize: "0.78rem", fontStyle: "italic", padding: "4px 0" }}>{msg.text}</div>
    );
    return (
        <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `2px solid ${isUser ? "#6366f1" : "#10b981"}` }}>
                {isUser
                    ? <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}>Y</div>
                    : <img src="/priya-avatar.png" alt="Priya" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                }
            </div>
            <div style={{ maxWidth: "82%", background: isUser ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${isUser ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "9px 13px" }}>
                <p style={{ margin: 0, fontSize: "0.865rem", lineHeight: 1.6, color: "#cbd5e1" }}>{msg.text}</p>
                <span style={{ fontSize: "0.65rem", color: "#475569", display: "block", marginTop: 3 }}>
                    {isUser ? "You" : "Priya"} · {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function LiveInterviewPage() {
    const auth  = useSelector((s) => s.auth);
    const token = typeof window !== "undefined" ? (auth?.token || localStorage.getItem("token")) : null;

    const [phase,          setPhase]          = useState("setup");
    const [selectedRole,   setSelectedRole]   = useState(ROLES[0]);
    const [avatarState,    setAvatarState]    = useState("idle");
    const [messages,       setMessages]       = useState([]);
    const [liveTranscript, setLiveTranscript] = useState("");
    const [turnCount,      setTurnCount]      = useState(0);
    const [elapsedTime,    setElapsedTime]    = useState(0);
    const [error,          setError]          = useState("");
    const [isConnecting,   setIsConnecting]   = useState(false);
    const [isCamOff,       setIsCamOff]       = useState(false);
    const [isMicMuted,     setIsMicMuted]     = useState(false);
    const [isTranscriptOpen, setIsTranscriptOpen] = useState(true);
    // "off" | "connecting" | "live" | "failed"
    const [didStatus,      setDidStatus]      = useState("off");

    // DOM refs
    const socketRef         = useRef(null);
    const recognitionRef    = useRef(null);
    const userVideoRef      = useRef(null);
    const avatarVideoRef    = useRef(null);   // ← ALWAYS in DOM, never conditional
    const userStreamRef     = useRef(null);
    const messagesEndRef    = useRef(null);
    const timerRef          = useRef(null);

    // Closure-safe value refs
    const phaseRef          = useRef("setup");
    const isMicMutedRef     = useRef(false);
    const avatarStateRef    = useRef("idle");
    const didStatusRef      = useRef("off");
    const didStreamIdRef    = useRef(null);
    const didSessionIdRef   = useRef(null);
    const peerConnectionRef = useRef(null);
    const didSpeakTimerRef  = useRef(null);

    // ── FIX: store the D-ID MediaStream so we can attach it when video mounts ──
    const didRemoteStreamRef = useRef(null);

    // ── Pending speak: stores { text, audioUrl } if D-ID hasn't connected yet ──
    // Cleared + triggered the moment D-ID status flips to "live"
    const pendingSpeakRef = useRef(null);

    // Sync refs
    useEffect(() => { phaseRef.current       = phase; },       [phase]);
    useEffect(() => { isMicMutedRef.current  = isMicMuted; },  [isMicMuted]);
    useEffect(() => { avatarStateRef.current = avatarState; }, [avatarState]);
    useEffect(() => { didStatusRef.current   = didStatus; },   [didStatus]);

    // ── FIX: when phase changes to "active" ALL video elements mount ──────────
    //   1. Attach D-ID stream if it arrived early
    //   2. Re-attach user camera (startCamera runs before active phase renders)
    useEffect(() => {
        if (phase !== "active") return;

        // Re-attach user webcam — userVideoRef is null during setup phase
        if (userStreamRef.current && userVideoRef.current) {
            userVideoRef.current.srcObject = userStreamRef.current;
            console.log("[Cam] User camera attached to video element ✅");
        }

        // Attach D-ID stream if ontrack fired before mount
        if (didRemoteStreamRef.current && avatarVideoRef.current) {
            avatarVideoRef.current.srcObject = didRemoteStreamRef.current;
            avatarVideoRef.current.play().catch(() => {});
            setDidStatus("live");
        }
    }, [phase]);

    // ── KEY FIX: the moment D-ID goes "live", immediately fire any pending speech ──
    // Event-driven — no polling. Greeting stored in pendingSpeakRef fires instantly
    // the moment the WebRTC stream is ready, regardless of how long it took.
    useEffect(() => {
        if (didStatus === "live" && pendingSpeakRef.current) {
            const pending = pendingSpeakRef.current;
            pendingSpeakRef.current = null;
            console.log("[D-ID] Now live — firing queued speech immediately ✅");
            setTimeout(() => triggerDIDTalk(pending.text, pending.audioUrl), 500);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [didStatus]);

    // Auto-scroll transcript
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, avatarState]);

    // Cleanup on unmount
    useEffect(() => () => { doCleanup(); }, []);

    // ─── TIMER ────────────────────────────────────────────────────────────────
    const startTimer = () => { timerRef.current = setInterval(() => setElapsedTime((p) => p + 1), 1000); };
    const stopTimer  = () => clearInterval(timerRef.current);
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    // ─── D-ID cleanup ─────────────────────────────────────────────────────────
    const cleanupDID = useCallback(() => {
        clearTimeout(didSpeakTimerRef.current);
        if (didStreamIdRef.current && didSessionIdRef.current) {
            didApi.close(didStreamIdRef.current, didSessionIdRef.current);
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        didStreamIdRef.current  = null;
        didSessionIdRef.current = null;
        didRemoteStreamRef.current = null;
        if (avatarVideoRef.current) avatarVideoRef.current.srcObject = null;
        setDidStatus("off");
    }, []);

    // ─── Full cleanup ─────────────────────────────────────────────────────────
    const doCleanup = useCallback(() => {
        stopTimer();
        window.speechSynthesis?.cancel();
        recognitionRef.current?.abort();
        userStreamRef.current?.getTracks().forEach((t) => t.stop());
        userStreamRef.current = null;
        cleanupDID();
        if (socketRef.current) {
            socketRef.current.emit("avatar:end");
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setAvatarState("idle");
        setLiveTranscript("");
    }, [cleanupDID]);

    // ─── User webcam ──────────────────────────────────────────────────────────
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
                audio: false,
            });
            userStreamRef.current = stream;
            if (userVideoRef.current) userVideoRef.current.srcObject = stream;
        } catch (_) {}
    };

    // ─── Browser TTS fallback ─────────────────────────────────────────────────
    const priyaSpeaksBrowserTTS = useCallback((text, afterFn) => {
        setAvatarState("speaking");
        speak(text, {
            onStart: () => setAvatarState("speaking"),
            onEnd: () => { setAvatarState("idle"); afterFn?.(); },
        });
    }, []);

    // ─── Speech recognition ───────────────────────────────────────────────────
    // Uses continuous mode + 2.5-second silence detection so the user can
    // speak in natural sentences with pauses — Priya only responds after they
    // stop speaking, not on every brief pause.
    const startListening = useCallback(() => {
        if (isMicMutedRef.current) return;
        if (avatarStateRef.current === "speaking" || avatarStateRef.current === "thinking") return;
        if (phaseRef.current !== "active") return;

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setError("SpeechRecognition not supported — use Chrome or Edge."); return; }

        const rec = new SR();
        rec.continuous     = true;  // keep mic open across natural pauses
        rec.interimResults = true;
        rec.lang           = "en-IN";
        recognitionRef.current = rec;

        let accumulatedFinal = ""; // builds up final text across multiple result events
        let silenceTimer     = null;
        const SILENCE_MS     = 2500; // wait 2.5s after last word before submitting

        const scheduleSubmit = () => {
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                const answer = accumulatedFinal.trim();
                if (answer && phaseRef.current === "active") {
                    submitAnswer(answer);
                } else {
                    // nothing said yet, keep waiting
                }
            }, SILENCE_MS);
        };

        rec.onresult = (event) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    accumulatedFinal += t + " ";
                } else {
                    interim = t;
                }
            }
            // Show live caption — accumulated finals + current interim
            setLiveTranscript((accumulatedFinal + interim).trim());

            // Restart silence timer on every word
            if (accumulatedFinal.trim() || interim.trim()) {
                scheduleSubmit();
            }
        };

        rec.onerror = (e) => {
            clearTimeout(silenceTimer);
            if (e.error === "no-speech") return; // ignore — just no input yet
            setAvatarState("idle");
            setLiveTranscript("");
        };

        rec.onend = () => {
            clearTimeout(silenceTimer);
            // If recognition auto-stops (browser timeout) but we're still listening,
            // submit what we have, or restart if nothing was said
            if (accumulatedFinal.trim() && phaseRef.current === "active") {
                submitAnswer(accumulatedFinal.trim());
            } else {
                setAvatarState((s) => s === "listening" ? "idle" : s);
                setLiveTranscript("");
            }
        };

        try { rec.start(); setAvatarState("listening"); } catch (_) {}
    }, []);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setAvatarState("idle");
        setLiveTranscript("");
    }, []);

    // ─── Submit answer ────────────────────────────────────────────────────────
    const submitAnswer = useCallback((text) => {
        if (!socketRef.current || !text.trim()) return;
        recognitionRef.current?.stop();
        setMessages((p) => [...p, { role: "user", text, ts: Date.now() }]);
        setLiveTranscript("");
        socketRef.current.emit("avatar:answer", { text });
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // D-ID WEBRTC SETUP
    // Called AFTER socket.on("connect") fires so phase="active" and
    // avatarVideoRef is guaranteed to be mounted in the DOM.
    // ─────────────────────────────────────────────────────────────────────────
    const setupDIDWebRTC = useCallback(async () => {
        setDidStatus("connecting");
        try {
            // Step 1: Create D-ID streaming session → get SDP offer + ICE servers
            const data = await didApi.create();
            if (!data?.id) throw new Error("D-ID stream creation failed — check DID_API_KEY");

            const { id, session_id, offer, ice_servers } = data;
            didStreamIdRef.current  = id;
            didSessionIdRef.current = session_id;

            // Step 2: Create RTCPeerConnection with D-ID's TURN/STUN servers
            const pc = new RTCPeerConnection({
                iceServers: ice_servers || [{ urls: "stun:stun.l.google.com:19302" }],
            });
            peerConnectionRef.current = pc;

            // Step 3: Handle incoming media stream from D-ID
            // This is the photorealistic avatar video + audio track
            pc.ontrack = (event) => {
                console.log("[D-ID] ontrack fired:", event.track.kind, "streams:", event.streams.length);
                if (!event.streams?.[0]) return;

                const stream = event.streams[0];
                // Always store the stream — video element may or may not be mounted yet
                didRemoteStreamRef.current = stream;

                if (avatarVideoRef.current) {
                    // Video element is mounted — attach immediately
                    avatarVideoRef.current.srcObject = stream;
                    avatarVideoRef.current.play().catch(() => {});
                    setDidStatus("live");
                    console.log("[D-ID] Stream attached to video element ✅");
                } else {
                    // Video element not yet mounted — useEffect will attach when it mounts
                    console.log("[D-ID] Stream stored in ref, waiting for video element mount...");
                    setDidStatus("live");
                }
            };

            // Step 4: Forward ICE candidates to D-ID via backend proxy
            pc.onicecandidate = async (event) => {
                if (!event.candidate) return;
                try {
                    await didApi.ice(
                        didStreamIdRef.current,
                        event.candidate.candidate,
                        event.candidate.sdpMid,
                        event.candidate.sdpMLineIndex,
                        didSessionIdRef.current
                    );
                } catch (e) { console.warn("[D-ID ICE]", e.message); }
            };

            // Connection state monitoring
            pc.onconnectionstatechange = () => {
                const s = pc.connectionState;
                console.log("[D-ID] Connection state:", s);
                if (s === "connected") {
                    console.log("[D-ID] WebRTC peer connected ✅");
                    // If ontrack hasn't fired yet it will shortly — state is ready
                }
                if (s === "failed" || s === "disconnected" || s === "closed") {
                    console.warn("[D-ID] Connection lost:", s);
                    setDidStatus("failed");
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log("[D-ID] ICE state:", pc.iceConnectionState);
            };

            // Step 5: Complete SDP negotiation
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await didApi.sdp(id, { type: answer.type, sdp: answer.sdp }, session_id);
            console.log("[D-ID] SDP handshake complete ✅");

        } catch (err) {
            console.warn("[D-ID] WebRTC setup failed — CSS avatar fallback:", err.message);
            setDidStatus("failed");
        }
    }, []);

    // ─── D-ID Talk ────────────────────────────────────────────────────────────
    // Sends Priya's text → D-ID lip-syncs using Microsoft TTS (local dev) or
    // pre-generated ElevenLabs audio (production with public URL).
    // If audioUrl exists, ALSO plays it in the browser for best audio quality.
    const triggerDIDTalk = useCallback(async (text, audioUrl) => {
        const id         = didStreamIdRef.current;
        const session_id = didSessionIdRef.current;
        if (!id || !session_id) return;

        // Estimate speaking duration (words per minute ≈ 120 for natural speech)
        const words = text.trim().split(/\s+/).length;
        const durationMs = Math.max(2500, (words / 120) * 60 * 1000 + 1500);

        // If we have a pre-generated ElevenLabs audio URL, play it directly in
        // the browser for crisp audio — D-ID handles the lip-sync track separately
        if (audioUrl) {
            try {
                const audio = new Audio(audioUrl);
                audio.play().catch(() => {}); // browser may block autoplay — silent fail OK
            } catch (_) {}
        }

        try {
            const result = await didApi.talk(id, session_id, text, audioUrl);
            console.log("[D-ID] Talk task accepted:", result?.status || "ok");

            // Auto-clear speaking state after estimated duration
            clearTimeout(didSpeakTimerRef.current);
            didSpeakTimerRef.current = setTimeout(() => {
                setAvatarState("idle");
                if (phaseRef.current === "active") setTimeout(startListening, 800);
            }, durationMs);

        } catch (err) {
            console.warn("[D-ID] Talk failed — browser TTS fallback:", err.message);
            priyaSpeaksBrowserTTS(text, () => {
                if (phaseRef.current === "active") setTimeout(startListening, 600);
            });
        }
    }, [priyaSpeaksBrowserTTS, startListening]);

    // ─────────────────────────────────────────────────────────────────────────
    // START SESSION
    // ─────────────────────────────────────────────────────────────────────────
    const startSession = async () => {
        setIsConnecting(true);
        setMessages([]);
        setError("");
        setTurnCount(0);
        setElapsedTime(0);
        setDidStatus("off");
        didRemoteStreamRef.current = null;

        await startCamera();

        const socket = io(BACKEND_URL, {
            transports: ["websocket", "polling"],
            reconnectionAttempts: 3,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            // 1. Activate the call UI — this mounts the <video ref={avatarVideoRef}>
            setPhase("active");
            phaseRef.current = "active";
            setIsConnecting(false);
            startTimer();

            // 2. Start Gemini interview session
            socket.emit("avatar:start", { token, role: selectedRole });

            // 3. ── KEY FIX: Start D-ID AFTER phase="active" so avatarVideoRef is mounted ──
            setupDIDWebRTC();
        });

        // Priya responds with text + optional pre-generated audio URL
        // RACE FIX: D-ID WebRTC can take 8-12 seconds to negotiate.
        // Strategy:
        //   1. Try D-ID for up to 15 seconds (75 x 200ms)
        //   2. While waiting, store as pendingSpeakRef
        //   3. The moment D-ID goes "live", pendingSpeakRef is triggered immediately
        //   4. Only after 15s total timeout fall back to CSS + browser TTS
        socket.on("avatar:response", ({ text, audioUrl, turnCount: tc }) => {
            setAvatarState("speaking");
            setTurnCount(tc || 0);
            setMessages((p) => [...p, { role: "avatar", text, ts: Date.now() }]);

            if (didStatusRef.current === "live") {
                // D-ID already live — speak immediately
                triggerDIDTalk(text, audioUrl || null);
                pendingSpeakRef.current = null;
            } else {
                // D-ID not yet live — store as pending, retry for up to 15 seconds
                pendingSpeakRef.current = { text, audioUrl: audioUrl || null };
                console.log("[D-ID] Queueing speech — waiting for D-ID to connect...");

                const speakWhenReady = (attemptsLeft = 75) => {
                    if (!pendingSpeakRef.current) return; // already played
                    if (didStatusRef.current === "live") {
                        const pending = pendingSpeakRef.current;
                        pendingSpeakRef.current = null;
                        triggerDIDTalk(pending.text, pending.audioUrl);
                    } else if (attemptsLeft > 0) {
                        setTimeout(() => speakWhenReady(attemptsLeft - 1), 200);
                    } else {
                        // 15 seconds expired — use CSS + browser TTS
                        const pending = pendingSpeakRef.current;
                        pendingSpeakRef.current = null;
                        if (pending) {
                            priyaSpeaksBrowserTTS(pending.text, () => {
                                if (phaseRef.current === "active") setTimeout(startListening, 600);
                            });
                        }
                    }
                };
                speakWhenReady();
            }
        });

        socket.on("avatar:thinking", (val) => {
            if (val) setAvatarState("thinking");
        });

        socket.on("avatar:error", ({ message }) => {
            setError(message);
            setAvatarState("idle");
        });

        socket.on("avatar:session-end", ({ message, totalTurns }) => {
            window.speechSynthesis?.cancel();
            setMessages((p) => [...p, { role: "system", text: message, ts: Date.now() }]);
            setTurnCount(totalTurns || 0);
            stopTimer();
            doCleanup();
            setPhase("ended");
        });

        socket.on("connect_error", () => {
            setError("Cannot reach the interview server. Is your backend running?");
            setIsConnecting(false);
            setPhase("setup");
        });
    };

    // ─── Controls ─────────────────────────────────────────────────────────────
    const endCall    = () => { doCleanup(); setPhase("ended"); };
    const toggleMic  = () => {
        if (avatarState === "listening") stopListening();
        isMicMutedRef.current = !isMicMutedRef.current;
        setIsMicMuted((p) => !p);
    };
    const toggleCamera = () => {
        userStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
        setIsCamOff((p) => !p);
    };
    const handleSpeak = () => {
        if (avatarState === "listening") stopListening();
        else startListening();
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            <Head>
                <title>Live AI Interview — Priya · LinkUps</title>
                <meta name="description" content="Photorealistic AI interview with Priya — powered by D-ID, Gemini AI, and ElevenLabs." />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            <div className="root">

                {/* ══════════════════ SETUP SCREEN ══════════════════ */}
                {(phase === "setup" || phase === "ended") && !isConnecting && (
                    <div className="setup-bg">
                        <div className="setup-card">

                            <div className="preview-col">
                                <div className="preview-face-wrap">
                                    <img src="/priya-avatar.png" alt="Priya" className="preview-face" />
                                    <div className="preview-badge">
                                        <span className="preview-dot" />
                                        AI Interview Ready
                                    </div>
                                </div>
                                <div className="tech-pills">
                                    {["D-ID Live Avatar", "Gemini AI", "ElevenLabs Voice", "WebRTC"].map((t) => (
                                        <span key={t} className="pill">{t}</span>
                                    ))}
                                </div>
                                <div className="avatar-info-box">
                                    <div className="avatar-info-row">🎭 <span>Photorealistic — blinks & expressions</span></div>
                                    <div className="avatar-info-row">🔊 <span>ElevenLabs natural voice</span></div>
                                    <div className="avatar-info-row">👄 <span>Perfect lip-sync via WebRTC</span></div>
                                    <div className="avatar-info-row">🧠 <span>Adaptive Gemini AI brain</span></div>
                                </div>
                            </div>

                            <div className="form-col">
                                <div className="form-eyebrow">Photorealistic · Real-time · Adaptive</div>
                                <h1 className="form-title">Interview with <span className="grad">Priya</span></h1>
                                <p className="form-sub">
                                    A live photorealistic AI interviewer powered by D-ID — she blinks, shows
                                    facial expressions, and lip-syncs perfectly to her voice. Gemini AI adapts
                                    every question based on exactly what you say.
                                </p>

                                <label className="field-label" htmlFor="role-sel">Target Role</label>
                                <select id="role-sel" className="role-sel" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>

                                {error && <div className="err-box">⚠️ {error}</div>}
                                {phase === "ended" && (
                                    <div className="ok-box">✅ Interview complete · {turnCount} questions answered</div>
                                )}

                                <button id="join-btn" className="join-btn" onClick={startSession}>
                                    <span>{phase === "ended" ? "🔄" : "📹"}</span>
                                    {phase === "ended" ? "Start New Interview" : "Join Interview with Priya"}
                                </button>
                                <p className="note">Allow camera & microphone access when prompted.</p>

                                <div className="how-it-works">
                                    <p className="how-title">How it works</p>
                                    <div className="how-step"><span className="step-num">1</span><span>D-ID renders Priya as a live photorealistic avatar via WebRTC</span></div>
                                    <div className="how-step"><span className="step-num">2</span><span>Click <strong>🎤 Speak</strong>, answer naturally with your voice</span></div>
                                    <div className="how-step"><span className="step-num">3</span><span>Gemini AI processes your answer and Priya lip-syncs her response</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════ CONNECTING ══════════════════ */}
                {isConnecting && (
                    <div className="connecting-overlay">
                        <div className="connecting-card">
                            <div className="spinner-ring" />
                            <p className="connecting-title">Connecting to Priya...</p>
                            <p className="connecting-sub">Initialising D-ID avatar · Gemini AI · WebRTC</p>
                        </div>
                    </div>
                )}

                {/* ══════════════════ ACTIVE CALL ══════════════════ */}
                {phase === "active" && (
                    <div className="call-layout">

                        {/* TOP BAR — Google Meet style */}
                        <div className="topbar">
                            <div className="topbar-left">
                                <div className="live-chip">
                                    <span className="live-dot-anim" style={{ background: avatarState === "speaking" ? "#10b981" : avatarState === "listening" ? "#ef4444" : "#6366f1" }} />
                                    <span className="live-label">Live Interview</span>
                                </div>
                                <span className="timer-badge">{fmt(elapsedTime)}</span>
                            </div>
                            <div className="topbar-center">
                                <span className="meeting-title">LinkUps · AI Interview with Priya</span>
                            </div>
                            <div className="topbar-right">
                                <div className="turn-chip">Q {turnCount}/10</div>
                                {didStatus === "live"       && <span className="mode-badge mode-live">● D-ID Live</span>}
                                {didStatus === "connecting" && <span className="mode-badge mode-conn">⏳ Connecting</span>}
                                <button className="tscript-toggle" onClick={() => setIsTranscriptOpen((p) => !p)}>
                                    {isTranscriptOpen ? "▶ Hide" : "◀ Chat"}
                                </button>
                            </div>
                        </div>

                        {/* BODY */}
                        <div className={`call-body ${isTranscriptOpen ? "call-body-split" : ""}`}>

                            {/* ── MAIN VIDEO STAGE ── */}
                            <div className="main-stage">
                                <div className="stage-inner">

                                    {/* D-ID WebRTC Video — ALWAYS in DOM, opacity-controlled
                                        NEVER use display:none: browsers stop streaming
                                        to invisible elements. GPU-composited via translateZ. */}
                                    <div className="did-video-container" style={{
                                        position: "relative",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        opacity: didStatus === "live" ? 1 : didStatus === "connecting" ? 0.12 : 0,
                                        pointerEvents: didStatus === "live" ? "auto" : "none",
                                        transition: "opacity 0.5s ease",
                                        willChange: "opacity",
                                    }}>
                                        <div className="did-glow-ring" style={{
                                            borderColor: avatarState === "speaking" ? "#10b981" : avatarState === "listening" ? "#ef4444" : "#6366f1",
                                            animation: (avatarState === "speaking" || avatarState === "listening") ? "glowPulse 0.8s ease-in-out infinite" : "breatheGlow 4s ease-in-out infinite",
                                        }}>
                                            <video
                                                ref={avatarVideoRef}
                                                autoPlay
                                                playsInline
                                                muted={false}
                                                className="did-video"
                                                style={{
                                                    background: "#0d0f14",
                                                    // GPU hardware decoding — avoids CPU compositing
                                                    transform: "translateZ(0)",
                                                    willChange: "transform",
                                                    backfaceVisibility: "hidden",
                                                    WebkitBackfaceVisibility: "hidden",
                                                }}
                                            />
                                        </div>

                                        <div className="did-status-bar">
                                            {avatarState === "speaking"  && <><SpeakWave /><span style={{ color: "#10b981", fontSize: "0.8rem", fontWeight: 600, marginLeft: 8 }}>Priya is speaking</span></>}
                                            {avatarState === "thinking"  && <><ThinkDots /><span style={{ color: "#a78bfa", fontSize: "0.8rem", fontWeight: 600, marginLeft: 8 }}>Priya is thinking...</span></>}
                                            {avatarState === "listening" && <><ListenPulse /><span style={{ color: "#ef4444", fontSize: "0.8rem", fontWeight: 600, marginLeft: 8 }}>Listening...</span></>}
                                            {avatarState === "idle"      && <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Priya · AI Senior Interviewer</span>}
                                        </div>
                                    </div>

                                    {/* ─── CSS Animated Avatar (Mode A — fallback) ─── */}
                                    {didStatus !== "live" && (
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                            {didStatus === "connecting" && (
                                                <div className="did-loading-hint">
                                                    <div className="loading-ring" />
                                                    <span>Connecting D-ID avatar...</span>
                                                </div>
                                            )}
                                            <PriyaAvatar state={avatarState} />
                                        </div>
                                    )}

                                    {/* User PiP — GPU-accelerated via translateZ */}
                                    <div className="pip-wrap">
                                        {isCamOff
                                            ? <div className="pip-off"><span>📷</span><span style={{ fontSize: "0.6rem", marginTop: 2 }}>Off</span></div>
                                            : <video
                                                ref={userVideoRef}
                                                className="pip-video"
                                                autoPlay
                                                playsInline
                                                muted
                                                style={{
                                                    transform: "translateZ(0)",
                                                    willChange: "transform",
                                                    backfaceVisibility: "hidden",
                                                    WebkitBackfaceVisibility: "hidden",
                                                }}
                                              />
                                        }
                                        <span className="pip-name">You</span>
                                    </div>

                                    {/* ── Live transcript overlay ── */}
                                    {avatarState === "listening" && liveTranscript && (
                                        <div className="live-transcript-overlay">
                                            <span className="live-red-dot" />
                                            <em style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{liveTranscript}</em>
                                        </div>
                                    )}

                                    {/* ── Click-to-speak prompt ── */}
                                    {avatarState === "idle" && messages.length > 0 && !isMicMuted && (
                                        <div className="speak-cta" onClick={handleSpeak}>
                                            <span>🎤</span>
                                            <span>Click to respond</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── TRANSCRIPT PANEL ── */}
                            {isTranscriptOpen && (
                                <div className="transcript-panel">
                                    <div className="tp-header">
                                        <span className="tp-title">Live Transcript</span>
                                        <span className="gemini-chip">✦ Gemini AI</span>
                                    </div>
                                    <div className="tp-scroll">
                                        {messages.length === 0 && (
                                            <div className="tp-empty">
                                                <div style={{ fontSize: "2rem" }}>🎙</div>
                                                <p>Priya will speak first — then it&apos;s your turn!</p>
                                            </div>
                                        )}
                                        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
                                        {avatarState === "thinking" && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: "#64748b", fontSize: "0.82rem" }}>
                                                <ThinkDots /> Priya is thinking...
                                            </div>
                                        )}
                                        {avatarState === "listening" && liveTranscript && (
                                            <div className="tp-live-row">
                                                <ListenPulse />
                                                <em style={{ color: "#94a3b8", fontSize: "0.85rem", marginLeft: 8 }}>{liveTranscript}</em>
                                            </div>
                                        )}
                                        {error && <div className="tp-error">⚠️ {error}</div>}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="tp-status">
                                        {avatarState === "speaking"  && <span className="status-chip chip-green"><span className="s-dot green-dot" />Priya is speaking</span>}
                                        {avatarState === "listening" && <span className="status-chip chip-red"><span className="s-dot red-dot" />Listening — speak clearly</span>}
                                        {avatarState === "thinking"  && <span className="status-chip chip-purple"><span className="s-dot purple-dot" />Processing your answer</span>}
                                        {avatarState === "idle" && phase === "active" && (
                                            <span className="status-chip chip-idle">Press <strong>🎤 Speak</strong> when ready</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ══ CONTROLS BAR — Google Meet style ══ */}
                        <div className="controls-bar">
                            <button id="mute-btn"
                                className={`ctrl-btn ${isMicMuted ? "btn-danger" : "btn-default"}`}
                                onClick={toggleMic}>
                                <span className="btn-icon">{isMicMuted ? "🔇" : "🎙"}</span>
                                <span className="btn-label">{isMicMuted ? "Unmute" : "Mute"}</span>
                            </button>

                            {/* Central SPEAK button */}
                            <button id="speak-btn"
                                className={`ctrl-btn btn-speak ${avatarState === "listening" ? "btn-speak-active" : ""}`}
                                onClick={handleSpeak}
                                disabled={avatarState === "thinking" || avatarState === "speaking" || isMicMuted}>
                                <span className="btn-icon">{avatarState === "listening" ? "⏹" : "🎤"}</span>
                                <span className="btn-label">{avatarState === "listening" ? "Stop" : "Speak"}</span>
                            </button>

                            <button id="cam-btn"
                                className={`ctrl-btn ${isCamOff ? "btn-danger" : "btn-default"}`}
                                onClick={toggleCamera}>
                                <span className="btn-icon">{isCamOff ? "📷" : "📸"}</span>
                                <span className="btn-label">{isCamOff ? "Cam Off" : "Camera"}</span>
                            </button>

                            <button id="transcript-btn"
                                className={`ctrl-btn ${isTranscriptOpen ? "btn-active" : "btn-default"}`}
                                onClick={() => setIsTranscriptOpen((p) => !p)}>
                                <span className="btn-icon">📋</span>
                                <span className="btn-label">Transcript</span>
                            </button>

                            <button id="end-btn" className="ctrl-btn btn-end" onClick={endCall}>
                                <span className="btn-icon">📵</span>
                                <span className="btn-label">End Call</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════ GLOBAL STYLES ══════════ */}
                <style>{`
                    @keyframes breathe     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.012)} }
                    @keyframes speakBob    { 0%,100%{transform:translateY(0) scale(1)} 25%{transform:translateY(-5px) scale(1.006)} 75%{transform:translateY(2px) scale(0.997)} }
                    @keyframes thinkTilt   { 0%,100%{transform:rotate(0deg)} 30%{transform:rotate(-1.5deg)} 70%{transform:rotate(1.5deg)} }
                    @keyframes ringPulse   { 0%,100%{opacity:0.35;transform:scale(1)} 50%{opacity:0.85;transform:scale(1.03)} }
                    @keyframes glowPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.0)} 50%{box-shadow:0 0 0 10px rgba(99,102,241,.15)} }
                    @keyframes breatheGlow { 0%,100%{box-shadow:0 0 40px rgba(99,102,241,.2),0 0 0 3px rgba(99,102,241,.15)} 50%{box-shadow:0 0 60px rgba(99,102,241,.35),0 0 0 3px rgba(99,102,241,.3)} }
                    @keyframes wavePulse   { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1.3)} }
                    @keyframes dotBounce   { 0%,80%,100%{transform:translateY(0);opacity:0.5} 40%{transform:translateY(-6px);opacity:1} }
                    @keyframes livePulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.3)} }
                    @keyframes spin        { to{transform:rotate(360deg)} }
                    @keyframes fadeUp      { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                    @keyframes spinRing    { to{transform:rotate(360deg)} }

                    *{box-sizing:border-box;margin:0;padding:0}
                    .root{font-family:'Inter',system-ui,sans-serif;background:#050a14;min-height:100vh;color:#e2e8f0}

                    /* ── SETUP ── */
                    .setup-bg{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem 1rem;
                        background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(99,102,241,.18) 0%,transparent 70%),
                                   radial-gradient(ellipse 60% 50% at 80% 100%,rgba(16,185,129,.1) 0%,transparent 60%),#050a14}
                    .setup-card{display:grid;grid-template-columns:300px 1fr;gap:3rem;max-width:900px;width:100%;
                        background:rgba(15,23,42,.92);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:3rem;
                        backdrop-filter:blur(24px);box-shadow:0 0 80px rgba(99,102,241,.12),0 40px 80px rgba(0,0,0,.6);
                        animation:fadeUp 0.5s ease}
                    @media(max-width:760px){.setup-card{grid-template-columns:1fr;gap:2rem;padding:2rem}}
                    .preview-col{display:flex;flex-direction:column;align-items:center;gap:1.5rem}
                    .preview-face-wrap{position:relative;width:200px;height:240px;border-radius:50% 50% 45% 45% / 50% 50% 45% 45%;
                        overflow:hidden;border:3px solid rgba(99,102,241,.5);box-shadow:0 0 60px rgba(99,102,241,.3)}
                    .preview-face{width:100%;height:100%;object-fit:cover;object-position:top}
                    .preview-badge{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);white-space:nowrap;
                        background:rgba(0,0,0,.72);border:1px solid rgba(16,185,129,.5);border-radius:999px;
                        padding:4px 12px;font-size:.7rem;font-weight:600;color:#10b981;display:flex;align-items:center;gap:6px}
                    .preview-dot{width:6px;height:6px;border-radius:50%;background:#10b981;animation:livePulse 1.5s ease-in-out infinite}
                    .tech-pills{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
                    .pill{font-size:.68rem;padding:4px 10px;border-radius:999px;background:rgba(99,102,241,.1);
                        border:1px solid rgba(99,102,241,.3);color:#a5b4fc;font-weight:500}
                    .avatar-info-box{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px;width:100%}
                    .avatar-info-row{display:flex;align-items:center;gap:8px;font-size:.78rem;color:#64748b;margin-bottom:6px}
                    .avatar-info-row:last-child{margin-bottom:0}
                    .form-col{display:flex;flex-direction:column;gap:1.2rem}
                    .form-eyebrow{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#a78bfa}
                    .form-title{font-size:2.4rem;font-weight:800;line-height:1.2;color:#f1f5f9}
                    .grad{background:linear-gradient(135deg,#6366f1,#a78bfa,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
                    .form-sub{color:#64748b;font-size:.9rem;line-height:1.65}
                    .field-label{font-size:.78rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
                    .role-sel{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
                        border-radius:12px;color:#e2e8f0;padding:12px 16px;font-size:.9rem;font-family:inherit;
                        outline:none;cursor:pointer;transition:border-color .2s}
                    .role-sel:focus{border-color:rgba(99,102,241,.5)}
                    .role-sel option{background:#0f172a}
                    .err-box{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:10px 14px;font-size:.85rem;color:#fca5a5}
                    .ok-box{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:10px;padding:10px 14px;font-size:.85rem;color:#6ee7b7}
                    .join-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:15px 24px;
                        border-radius:14px;border:none;cursor:pointer;font-size:1rem;font-weight:700;font-family:inherit;
                        background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                        box-shadow:0 0 30px rgba(99,102,241,.35);transition:all .2s}
                    .join-btn:hover{transform:translateY(-2px);box-shadow:0 0 50px rgba(99,102,241,.55)}
                    .note{font-size:.75rem;color:#334155;text-align:center}
                    .how-it-works{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px 16px}
                    .how-title{font-size:.8rem;font-weight:600;color:#64748b;margin-bottom:10px}
                    .how-step{display:flex;align-items:flex-start;gap:10px;font-size:.8rem;color:#64748b;margin-bottom:8px}
                    .how-step:last-child{margin-bottom:0}
                    .step-num{min-width:20px;height:20px;border-radius:50%;background:rgba(99,102,241,.2);border:1px solid rgba(99,102,241,.3);
                        color:#a5b4fc;font-size:.7rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}

                    /* ── CONNECTING ── */
                    .connecting-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,10,20,.96);z-index:50}
                    .connecting-card{text-align:center;background:rgba(15,23,42,.95);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:3rem 2.5rem;max-width:340px;width:90%}
                    .spinner-ring{width:52px;height:52px;border:3px solid rgba(99,102,241,.15);border-top-color:#6366f1;border-radius:50%;animation:spinRing .85s linear infinite;margin:0 auto 1.5rem}
                    .connecting-title{font-size:1.05rem;font-weight:700;color:#e2e8f0;margin-bottom:.4rem}
                    .connecting-sub{font-size:.8rem;color:#64748b}

                    /* ── CALL LAYOUT ── */
                    .call-layout{display:flex;flex-direction:column;height:100vh;overflow:hidden;background:#050a14}
                    .topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;
                        background:rgba(9,14,27,.97);border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;gap:12px;z-index:10}
                    .topbar-left,.topbar-right{display:flex;align-items:center;gap:10px;flex:1}
                    .topbar-right{justify-content:flex-end}
                    .topbar-center{flex:1;text-align:center}
                    .live-chip{display:flex;align-items:center;gap:7px;border:1px solid rgba(99,102,241,.3);border-radius:999px;padding:4px 12px;background:rgba(99,102,241,.06)}
                    .live-dot-anim{width:7px;height:7px;border-radius:50%;flex-shrink:0;animation:livePulse 1.5s ease-in-out infinite}
                    .live-label{color:#e2e8f0;font-size:.78rem;font-weight:600}
                    .timer-badge{font-size:.85rem;font-weight:600;color:#94a3b8;font-variant-numeric:tabular-nums;letter-spacing:.05em}
                    .meeting-title{font-size:.88rem;font-weight:600;color:#e2e8f0}
                    .turn-chip{background:rgba(255,255,255,.07);border-radius:8px;padding:4px 12px;font-size:.82rem;font-weight:700;color:#e2e8f0}
                    .tscript-toggle{font-size:.75rem;color:#64748b;cursor:pointer;background:none;border:none;padding:4px 8px;font-family:inherit;transition:color .2s}
                    .tscript-toggle:hover{color:#e2e8f0}
                    .mode-badge{font-size:.7rem;font-weight:600;padding:3px 10px;border-radius:999px;white-space:nowrap}
                    .mode-live{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);color:#6ee7b7}
                    .mode-conn{background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.2);color:#c4b5fd}
                    .mode-css{background:rgba(100,116,139,.1);border:1px solid rgba(100,116,139,.2);color:#64748b}

                    /* ── CALL BODY ── */
                    .call-body{display:grid;grid-template-columns:1fr;flex:1;overflow:hidden}
                    .call-body-split{grid-template-columns:1fr 340px}
                    @media(max-width:900px){.call-body-split{grid-template-columns:1fr}}

                    /* ── STAGE ── */
                    .main-stage{background:radial-gradient(ellipse at 50% 40%,rgba(99,102,241,.12) 0%,#050a14 70%);
                        display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
                    .stage-inner{display:flex;flex-direction:column;align-items:center;justify-content:center;
                        padding:2rem;position:relative;width:100%;height:100%}

                    /* ── D-ID VIDEO ── */
                    .did-video-container{animation:fadeUp 0.4s ease}
                    .did-glow-ring{border-radius:22px;transition:box-shadow 0.5s,border-color 0.4s;border:3px solid rgba(16,185,129,.3)}
                    .did-video{width:420px;height:500px;object-fit:cover;border-radius:18px;display:block;
                        box-shadow:0 30px 80px rgba(0,0,0,.6)}
                    @media(max-height:700px){.did-video{width:320px;height:380px}}
                    .did-status-bar{display:flex;align-items:center;margin-top:16px;padding:7px 18px;
                        background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:999px}

                    /* ── D-ID Connecting hint ── */
                    .did-loading-hint{display:flex;align-items:center;gap:10px;margin-bottom:20px;
                        font-size:.82rem;color:#64748b;background:rgba(99,102,241,.06);
                        border:1px solid rgba(99,102,241,.15);border-radius:999px;padding:6px 16px}
                    .loading-ring{width:16px;height:16px;border:2px solid rgba(99,102,241,.2);border-top-color:#6366f1;
                        border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0}

                    /* ── PiP ── */
                    .pip-wrap{position:absolute;bottom:20px;right:20px;width:160px;height:120px;border-radius:12px;overflow:hidden;
                        border:2px solid rgba(99,102,241,.5);box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:5;background:#0f172a}
                    .pip-video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
                    .pip-off{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#475569;font-size:1.2rem}
                    .pip-name{position:absolute;bottom:6px;left:8px;font-size:.65rem;color:rgba(255,255,255,.85);background:rgba(0,0,0,.55);padding:2px 6px;border-radius:4px}

                    /* ── Overlays ── */
                    .live-transcript-overlay{position:absolute;bottom:155px;left:50%;transform:translateX(-50%);
                        display:flex;align-items:center;gap:8px;white-space:nowrap;
                        background:rgba(15,23,42,.9);border:1px solid rgba(239,68,68,.3);border-radius:999px;padding:6px 16px}
                    .live-red-dot{width:7px;height:7px;border-radius:50%;background:#ef4444;flex-shrink:0;animation:livePulse .8s ease-in-out infinite}
                    .speak-cta{position:absolute;bottom:85px;left:50%;transform:translateX(-50%);
                        display:flex;align-items:center;gap:8px;cursor:pointer;
                        background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);
                        border-radius:999px;padding:8px 22px;font-size:.82rem;font-weight:600;color:#a5b4fc;
                        animation:fadeUp 0.4s ease;transition:all .2s}
                    .speak-cta:hover{background:rgba(99,102,241,.24);box-shadow:0 0 24px rgba(99,102,241,.3)}

                    /* ── TRANSCRIPT PANEL ── */
                    .transcript-panel{display:flex;flex-direction:column;background:rgba(9,14,27,.98);border-left:1px solid rgba(255,255,255,.06);overflow:hidden}
                    .tp-header{padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
                    .tp-title{font-size:.82rem;font-weight:700;color:#94a3b8}
                    .gemini-chip{font-size:.65rem;font-weight:600;color:#a78bfa;background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.2);border-radius:999px;padding:2px 8px}
                    .tp-scroll{flex:1;overflow-y:auto;padding:12px}
                    .tp-scroll::-webkit-scrollbar{width:3px}
                    .tp-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px}
                    .tp-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#334155;padding:2rem;text-align:center;gap:8px;font-size:.85rem}
                    .tp-live-row{display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(99,102,241,.05);border-radius:8px;margin-bottom:8px}
                    .tp-error{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:8px 12px;font-size:.8rem;color:#fca5a5;margin-top:8px}
                    .tp-status{padding:10px 12px;border-top:1px solid rgba(255,255,255,.05);flex-shrink:0}
                    .status-chip{display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:500;padding:6px 12px;border-radius:8px}
                    .chip-green{background:rgba(16,185,129,.08);color:#6ee7b7}
                    .chip-red{background:rgba(239,68,68,.08);color:#fca5a5}
                    .chip-purple{background:rgba(167,139,250,.08);color:#c4b5fd}
                    .chip-idle{background:rgba(255,255,255,.03);color:#64748b}
                    .s-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
                    .green-dot{background:#10b981;animation:livePulse 1.5s ease-in-out infinite}
                    .red-dot{background:#ef4444;animation:livePulse .8s ease-in-out infinite}
                    .purple-dot{background:#a78bfa;animation:livePulse 1.2s ease-in-out infinite}

                    /* ── CONTROLS BAR ── */
                    .controls-bar{display:flex;align-items:center;justify-content:center;gap:12px;padding:14px 20px;
                        background:rgba(9,14,27,.98);border-top:1px solid rgba(255,255,255,.06);flex-shrink:0}
                    .ctrl-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
                        width:68px;height:68px;border-radius:16px;border:none;cursor:pointer;font-family:inherit;transition:all .2s}
                    .ctrl-btn:disabled{opacity:.3;cursor:not-allowed;transform:none!important}
                    .ctrl-btn:hover:not(:disabled){transform:translateY(-2px)}
                    .btn-icon{font-size:1.4rem;line-height:1}
                    .btn-label{font-size:.6rem;font-weight:600;color:inherit;letter-spacing:.03em}
                    .btn-default{background:rgba(255,255,255,.07);color:#94a3b8}
                    .btn-default:hover:not(:disabled){background:rgba(255,255,255,.12);color:#e2e8f0}
                    .btn-active{background:rgba(99,102,241,.2);color:#a5b4fc;border:1px solid rgba(99,102,241,.3)}
                    .btn-danger{background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.2)}
                    .btn-speak{width:80px;height:80px;border-radius:50%;background:rgba(99,102,241,.15);color:#a5b4fc;
                        border:2px solid rgba(99,102,241,.4);box-shadow:0 0 20px rgba(99,102,241,.2)}
                    .btn-speak:hover:not(:disabled){background:rgba(99,102,241,.25);box-shadow:0 0 40px rgba(99,102,241,.4);transform:scale(1.05)}
                    .btn-speak-active{background:rgba(239,68,68,.15)!important;color:#fca5a5!important;
                        border-color:rgba(239,68,68,.5)!important;box-shadow:0 0 30px rgba(239,68,68,.3)!important;
                        animation:livePulse 1s ease-in-out infinite!important}
                    .btn-end{background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.3)}
                    .btn-end:hover:not(:disabled){background:rgba(239,68,68,.3)!important;transform:scale(1.05)!important}
                `}</style>
            </div>
        </>
    );
}

LiveInterviewPage.getLayout = (page) => page;
