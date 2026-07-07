// backend/controllers/avatar-interview.controller.js
// ─────────────────────────────────────────────────────────────────────────────
// Pipeline:
//   User Speech (SpeechRecognition / Deepgram)
//     → Socket.io  →  Gemini AI (multi-turn, context-aware)
//     → ElevenLabs TTS  →  D-ID WebRTC (photorealistic lip-sync avatar)
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import User from "../models/user.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── ENV VARS ─────────────────────────────────────────────────────────────────
const GEMINI_API_KEY       = process.env.GEMINI_API_KEY;
const ELEVENLABS_API_KEY   = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID  = process.env.ELEVENLABS_VOICE_ID || "pMsXgVXv3BLzUgSXRplE";
const DID_API_KEY          = process.env.DID_API_KEY;
const DID_PRESENTER_URL    = process.env.DID_PRESENTER_URL ||
    "https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/v1_image.jpeg";
const BACKEND_URL          = process.env.BACKEND_URL || "http://localhost:9090";

// ─── GEMINI MODEL PRIORITY LIST ───────────────────────────────────────────────
const GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
];

// ─── TEMP AUDIO DIR ──────────────────────────────────────────────────────────
const TEMP_AUDIO_DIR = path.join(__dirname, "../uploads/temp-avatar-audio");
if (!fs.existsSync(TEMP_AUDIO_DIR)) {
    fs.mkdirSync(TEMP_AUDIO_DIR, { recursive: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT  (exact spec from the architecture brief)
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert, empathetic HR recruiter and Senior Technical Interviewer. You are conducting a live 1-on-1 video interview with a candidate. You have a warm, professional, and engaging personality.

Your Rules:

NEVER read a script. Ask one question, then wait for the user to answer.

Listen and Adapt: Carefully analyze the candidate's answer. If they give a vague answer, ask a probing counter-question (e.g., 'Can you explain exactly how you optimized that database?').

Be Conversational: React to their answers like a real human. Say things like, 'That is a great approach,' or 'I see, that sounds challenging.'

Keep it concise: Since you are speaking out loud via a video avatar, keep your responses and questions short and natural (under 3 sentences per turn). Do not output bullet points, emojis, or markdown formatting.

After 10 exchanges from the candidate, deliver a warm closing statement thanking them and wishing them well. End with "Best of luck, and we will be in touch!"

NEVER reveal you are an AI. If asked, stay in character as Priya, the interviewer.`;

// ─── PER-SESSION STATE ────────────────────────────────────────────────────────
// Map<socketId, { history: Gemini contents[] , turnCount: number, role: string }>
const sessionMap = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI HELPER — proper multi-turn contents[] format + system_instruction
// ─────────────────────────────────────────────────────────────────────────────
const callGeminiWithHistory = async (contentsArray) => {
    if (!GEMINI_API_KEY) throw new Error("Server Error: GEMINI_API_KEY is missing.");

    let lastError = null;
    for (const modelName of GEMINI_MODELS) {
        try {
            const url =
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                modelName + ":generateContent?key=" + GEMINI_API_KEY;

            const response = await axios.post(
                url,
                {
                    system_instruction: {
                        parts: [{ text: SYSTEM_PROMPT }],
                    },
                    contents: contentsArray,
                    generationConfig: {
                        temperature: 0.85,
                        maxOutputTokens: 256,
                        topP: 0.95,
                    },
                },
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 30000,
                }
            );

            const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text.trim();
        } catch (err) {
            console.warn(
                "[Avatar] Gemini model " + modelName + " failed:",
                err.response?.data?.error?.message || err.message
            );
            lastError = err;
        }
    }

    if (lastError?.response?.status === 429)
        throw new Error("AI is currently busy. Please wait a moment and try again.");
    throw new Error("Unable to connect to AI service. Please try again shortly.");
};

// ─── STRIP MARKDOWN FROM AI RESPONSE ─────────────────────────────────────────
const cleanText = (raw = "") =>
    raw
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/#{1,6}\s*/g, "")
        .replace(/^[-•*]\s+/gm, "")
        .replace(/\n{2,}/g, " ")
        .replace(/\n/g, " ")
        .trim();

// ─────────────────────────────────────────────────────────────────────────────
// ELEVENLABS — generate audio buffer from text
// ─────────────────────────────────────────────────────────────────────────────
const generateElevenLabsAudio = async (text) => {
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY missing from .env");

    const response = await axios.post(
        "https://api.elevenlabs.io/v1/text-to-speech/" + ELEVENLABS_VOICE_ID,
        {
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.52,
                similarity_boost: 0.78,
                style: 0.25,
                use_speaker_boost: true,
            },
        },
        {
            headers: {
                Accept: "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": ELEVENLABS_API_KEY,
            },
            responseType: "arraybuffer",
            timeout: 35000,
        }
    );

    return Buffer.from(response.data);
};

// ─── SAVE TEMP AUDIO (auto-deletes after 10 min) ─────────────────────────────
const saveTempAudio = (audioBuffer) => {
    const filename = "priya-" + crypto.randomUUID() + ".mp3";
    const filePath = path.join(TEMP_AUDIO_DIR, filename);
    fs.writeFileSync(filePath, audioBuffer);

    setTimeout(() => {
        try { fs.unlinkSync(filePath); } catch (_) { /* already deleted */ }
    }, 10 * 60 * 1000);

    return {
        filename,
        publicUrl: BACKEND_URL + "/api/avatar/audio/" + filename,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET.IO HANDLERS — registered per connection in server.js
// ─────────────────────────────────────────────────────────────────────────────
export const registerAvatarInterviewHandlers = (io, socket) => {

    // ── avatar:start ──────────────────────────────────────────────────────────
    socket.on("avatar:start", async ({ token, role }) => {
        try {
            const user = token ? await User.findOne({ token }) : null;
            const candidateName = user?.name || "there";
            const targetRole    = (role || "Software Engineer").trim();

            // Seed Gemini history with context as the first user turn
            const history = [
                {
                    role: "user",
                    parts: [{
                        text: "[INTERVIEW CONTEXT - do NOT repeat this verbatim] Candidate Name: " +
                              candidateName + ". Target Role: " + targetRole +
                              ". This is the START of the interview. Greet them warmly by name, introduce yourself briefly as Priya, and ask your first interview question.",
                    }],
                },
            ];

            const rawReply = await callGeminiWithHistory(history);
            const greeting = cleanText(rawReply);

            history.push({
                role: "model",
                parts: [{ text: greeting }],
            });

            sessionMap.set(socket.id, { history, turnCount: 0, role: targetRole });

            socket.emit("avatar:response", {
                text: greeting,
                audioUrl: null,
                turnCount: 0,
                isGreeting: true,
            });

            console.log("[Avatar] Session started | Socket:", socket.id, "| Role:", targetRole);
        } catch (err) {
            console.error("[Avatar] avatar:start error:", err.message);
            socket.emit("avatar:error", { message: err.message });
        }
    });

    // ── avatar:answer ─────────────────────────────────────────────────────────
    socket.on("avatar:answer", async ({ text }) => {
        try {
            if (!text?.trim()) return;

            const session = sessionMap.get(socket.id);
            if (!session) {
                socket.emit("avatar:error", { message: "Session expired. Please restart the interview." });
                return;
            }

            const { history } = session;

            // Append user's spoken answer to the multi-turn history
            history.push({
                role: "user",
                parts: [{ text: text.trim() }],
            });

            socket.emit("avatar:thinking", true);

            // Gemini generates the next adaptive question / reaction
            const rawReply = await callGeminiWithHistory(history);
            const reply    = cleanText(rawReply);

            history.push({
                role: "model",
                parts: [{ text: reply }],
            });

            session.turnCount += 1;
            const { turnCount } = session;

            socket.emit("avatar:thinking", false);

            // Pre-generate ElevenLabs audio → pass public URL → D-ID lip-syncs perfectly
            let audioUrl = null;
            if (ELEVENLABS_API_KEY && DID_API_KEY) {
                try {
                    const audioBuffer  = await generateElevenLabsAudio(reply);
                    const { publicUrl } = saveTempAudio(audioBuffer);
                    audioUrl = publicUrl;
                } catch (audioErr) {
                    console.warn("[Avatar] ElevenLabs audio gen failed - text fallback:", audioErr.message);
                }
            }

            socket.emit("avatar:response", {
                text: reply,
                audioUrl,
                turnCount,
                isGreeting: false,
            });

            // Auto-end after 10 user turns
            if (turnCount >= 10) {
                setTimeout(() => {
                    socket.emit("avatar:session-end", {
                        message: "Interview complete - great job today!",
                        totalTurns: turnCount,
                    });
                    sessionMap.delete(socket.id);
                }, 3000);
            }
        } catch (err) {
            console.error("[Avatar] avatar:answer error:", err.message);
            socket.emit("avatar:thinking", false);
            socket.emit("avatar:error", { message: err.message });
        }
    });

    // ── avatar:end ────────────────────────────────────────────────────────────
    socket.on("avatar:end", () => {
        sessionMap.delete(socket.id);
        console.log("[Avatar] Session ended for socket", socket.id);
    });

    socket.on("disconnect", () => {
        sessionMap.delete(socket.id);
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// D-ID PROXY REST CONTROLLERS  (keys stay server-side, browser never sees them)
// ─────────────────────────────────────────────────────────────────────────────
const DID_BASE = "https://api.d-id.com";

const getDIDHeaders = () => {
    if (!DID_API_KEY) throw new Error("DID_API_KEY is missing from .env");

    // D-ID Studio gives keys in TWO possible formats:
    //   Format A: "rawkey"          → we must append ":" → base64("rawkey:")
    //   Format B: "email:rawkey"    → already has colon  → base64("email:rawkey") as-is
    // Our key contains a colon, so DON'T append another one.
    const rawForAuth = DID_API_KEY.includes(":") ? DID_API_KEY : DID_API_KEY + ":";

    return {
        Authorization: "Basic " + Buffer.from(rawForAuth).toString("base64"),
        "Content-Type": "application/json",
    };
};

// POST /api/avatar/stream/create
// Returns SDP offer + ICE servers to initiate the WebRTC peer connection
export const createDIDStream = async (req, res) => {
    try {
        const sourceUrl = req.body?.source_url || DID_PRESENTER_URL;
        const { data }  = await axios.post(
            DID_BASE + "/talks/streams",
            { source_url: sourceUrl },
            { headers: getDIDHeaders(), timeout: 20000 }
        );
        return res.status(200).json(data);
    } catch (err) {
        console.error("[D-ID] createStream:", err.response?.data || err.message);
        return res.status(err.response?.status || 500).json({
            message: err.response?.data?.description || err.message,
        });
    }
};

// POST /api/avatar/stream/:id/sdp
// Browser sends its SDP answer → D-ID completes the WebRTC negotiation
export const sendDIDSDP = async (req, res) => {
    try {
        const { id }              = req.params;
        const { answer, session_id } = req.body;
        const { data }            = await axios.post(
            DID_BASE + "/talks/streams/" + id + "/sdp",
            { answer, session_id },
            { headers: getDIDHeaders(), timeout: 15000 }
        );
        return res.status(200).json(data);
    } catch (err) {
        console.error("[D-ID] sendSDP:", err.response?.data || err.message);
        return res.status(err.response?.status || 500).json({
            message: err.response?.data?.description || err.message,
        });
    }
};

// POST /api/avatar/stream/:id/ice
// Relay ICE candidate from browser to D-ID servers
export const sendDIDICE = async (req, res) => {
    try {
        const { id } = req.params;
        const { candidate, sdpMid, sdpMLineIndex, session_id } = req.body;
        const { data } = await axios.post(
            DID_BASE + "/talks/streams/" + id + "/ice",
            { candidate, sdpMid, sdpMLineIndex, session_id },
            { headers: getDIDHeaders(), timeout: 10000 }
        );
        return res.status(200).json(data);
    } catch (err) {
        console.error("[D-ID] sendICE:", err.response?.data || err.message);
        return res.status(err.response?.status || 500).json({
            message: err.response?.data?.description || err.message,
        });
    }
};

// POST /api/avatar/stream/:id/talk
// ─────────────────────────────────────────────────────────────────────────────
// TTS Priority Chain:
//   1. Public audio_url  → pre-generated ElevenLabs .mp3 (perfect lip-sync, prod only)
//   2. Microsoft TTS     → zero-config, guaranteed to work with D-ID, used for local dev
//   3. ElevenLabs TTS    → high quality but needs ElevenLabs key in D-ID Studio settings
//
// WHY Microsoft TTS first for local dev:
//   - D-ID cannot fetch localhost audio URLs (cloud service)
//   - ElevenLabs provider requires ElevenLabs API key configured in D-ID Studio dashboard
//   - Microsoft TTS works out of the box with no extra D-ID Studio configuration
//   - en-IN-NeerjaNeural sounds natural and professional
// ─────────────────────────────────────────────────────────────────────────────
export const sendDIDTalk = async (req, res) => {
    const { id } = req.params;
    const { session_id, audio_url, text: talkText } = req.body;

    if (!talkText && !audio_url) {
        return res.status(400).json({ message: "Either text or audio_url is required." });
    }

    // Helper — sends one task attempt and returns the axios response
    // CRITICAL: D-ID streaming API endpoint is POST /talks/streams/:id
    //           NOT POST /talks/streams/:id/task  (that routes to AWS SigV4 → 403!)
    const tryScript = async (script) => {
        const label = script.type === "audio"
            ? "audio_url"
            : `${script.provider?.type || "unknown"} TTS`;
        console.log(`[D-ID] Attempting talk with: ${label}`);
        const { data } = await axios.post(
            DID_BASE + "/talks/streams/" + id,   // ← correct endpoint (no /task suffix!)
            {
                session_id,
                script,
                driver_url: "bank://lively",         // enables natural facial animations
                config: { stitch: true },             // blends avatar with background
            },
            { headers: getDIDHeaders(), timeout: 20000 }
        );
        console.log(`[D-ID] Talk accepted (${label}) ✅`);
        return data;
    };

    // Check if audio_url is publicly reachable by D-ID's cloud servers
    const isPublicUrl = audio_url &&
        !audio_url.includes("localhost") &&
        !audio_url.includes("127.0.0.1") &&
        !audio_url.includes("0.0.0.0");

    // Microsoft TTS script (zero-config, always available)
    const microsoftScript = {
        type: "text",
        input: talkText,
        provider: { type: "microsoft", voice_id: "en-IN-NeerjaNeural" },
    };

    // ElevenLabs provider script (better quality, needs D-ID Studio key setup)
    const elevenLabsScript = ELEVENLABS_VOICE_ID ? {
        type: "text",
        input: talkText,
        provider: {
            type: "elevenlabs",
            voice_id: ELEVENLABS_VOICE_ID,
            voice_config: { stability: 0.52, similarity_boost: 0.78 },
        },
    } : null;

    // Audio URL script (production best quality)
    const audioUrlScript = isPublicUrl
        ? { type: "audio", audio_url }
        : null;

    // Build priority order:
    //   Prod:  audio_url → microsoft → elevenlabs
    //   Local: microsoft → elevenlabs (audio_url is localhost, skip it)
    const attempts = [audioUrlScript, microsoftScript, elevenLabsScript].filter(Boolean);

    let lastErr = null;
    for (const script of attempts) {
        try {
            const data = await tryScript(script);
            return res.status(200).json(data);
        } catch (err) {
            lastErr = err;
            const msg = err.response?.data?.description || err.response?.data?.message || err.message;
            console.warn(`[D-ID] Talk attempt failed (${script.type === "audio" ? "audio_url" : script.provider?.type}):`, msg);
            // Don't retry on stream-level errors (wrong ID, session expired)
            const status = err.response?.status;
            if (status === 404 || status === 400) break;
        }
    }

    // All attempts failed
    console.error("[D-ID] All talk attempts exhausted.");
    return res.status(lastErr?.response?.status || 500).json({
        message: lastErr?.response?.data?.description || lastErr?.response?.data?.message || lastErr?.message || "D-ID talk failed",
    });
};

// DELETE /api/avatar/stream/:id
export const closeDIDStream = async (req, res) => {
    try {
        const { id }       = req.params;
        const { session_id } = req.body;
        const { data }     = await axios.delete(
            DID_BASE + "/talks/streams/" + id,
            { headers: getDIDHeaders(), data: { session_id }, timeout: 10000 }
        );
        return res.status(200).json(data);
    } catch (err) {
        console.error("[D-ID] closeStream:", err.response?.data || err.message);
        return res.status(err.response?.status || 500).json({
            message: err.response?.data?.description || err.message,
        });
    }
};

// GET /api/avatar/audio/:filename
// Serves temp ElevenLabs audio to D-ID for lip-sync.  Strict UUID validation = secure.
export const serveTempAudio = (req, res) => {
    try {
        const { filename } = req.params;
        if (!/^priya-[0-9a-f-]{36}\.mp3$/.test(filename)) {
            return res.status(400).json({ message: "Invalid filename." });
        }
        const filePath = path.join(TEMP_AUDIO_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Audio file not found or expired." });
        }
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "no-store");
        return res.sendFile(path.resolve(filePath));
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
