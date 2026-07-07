import axios from "axios";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AVAILABLE_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
];

// ---------------------------------------------------------------
// GEMINI HELPER (mirrors the pattern in ai.controller.js)
// ---------------------------------------------------------------
const callGeminiAI = async (prompt) => {
    if (!GEMINI_API_KEY) {
        throw new Error("Server Error: GEMINI_API_KEY is missing.");
    }

    let lastError = null;

    for (const modelName of AVAILABLE_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
            };

            const response = await axios.post(url, payload, {
                headers: { "Content-Type": "application/json" },
            });

            const text =
                response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
        } catch (error) {
            console.warn(
                `[AI Interview] Model ${modelName} failed: ${
                    error.response?.data?.error?.message || error.message
                }`
            );
            lastError = error;
        }
    }

    if (lastError?.response?.status === 429) {
        throw new Error("AI is busy. Please wait a moment and try again.");
    }
    throw new Error("Unable to connect to AI service. Please try again.");
};

// ---------------------------------------------------------------
// PER-SESSION CONVERSATION HISTORY
// Map<socketId, Array<{ role, text }>>
// ---------------------------------------------------------------
const sessionHistories = new Map();

const SYSTEM_PROMPT = `You are ARIA, a strict, senior technical interviewer at a top-tier technology company (think FAANG level).

Your behaviour rules:
1. Begin by greeting the candidate and asking them to briefly introduce themselves.
2. After the introduction, ask ONE focused technical interview question at a time — never multiple at once.
3. Question types should follow this rough mix: 40% deep technical (algorithms, system design, architecture), 30% practical (debugging, real-world scenarios), 30% behavioral (using the STAR method).
4. After each candidate answer, critically evaluate it in 1-2 sentences, then ask the next question. If the answer is incomplete, probe deeper before moving on.
5. Do NOT give away answers. If a candidate is stuck, offer a single small hint, then wait.
6. Keep responses concise — 2-4 sentences max. You are on a live voice call.
7. After 8-10 exchanges, wrap up by saying "That concludes our interview session" and give a brief, honest 3-line overall assessment.
8. Maintain a professional, slightly challenging, but respectful tone throughout.
9. NEVER break character. You are always ARIA the interviewer.
10. Format your response as plain text only — no markdown, no bullet points, no asterisks. It will be read aloud via text-to-speech.`;

// ---------------------------------------------------------------
// SOCKET.IO HANDLER  — registered in server.js
// ---------------------------------------------------------------
export const registerAIInterviewHandlers = (io, socket) => {
    // --- Start / Resume a session ---
    socket.on("ai-interview:start", async ({ token, role }) => {
        try {
            // Auth: resolve user from JWT token (matches existing codebase pattern)
            const user = token ? await User.findOne({ token }) : null;
            const candidateName = user?.name || "Candidate";
            const targetRole = role || "Software Engineer";

            // Initialize fresh history for this socket session
            const history = [
                {
                    role: "system",
                    text: `${SYSTEM_PROMPT}\n\nThe candidate's name is ${candidateName}. They are interviewing for the role of: ${targetRole}.`,
                },
            ];
            sessionHistories.set(socket.id, history);

            // First message — the interviewer greeting
            const greetingPrompt = buildPromptFromHistory(history, null);
            const greeting = await callGeminiAI(greetingPrompt);
            const cleanGreeting = cleanResponse(greeting);

            // Save AI's turn to history
            history.push({ role: "assistant", text: cleanGreeting });

            socket.emit("ai-interview:response", {
                text: cleanGreeting,
                isGreeting: true,
            });
        } catch (err) {
            console.error("[AI Interview] start error:", err.message);
            socket.emit("ai-interview:error", {
                message: err.message,
            });
        }
    });

    // --- Receive a transcribed user answer and get AI reply ---
    socket.on("ai-interview:answer", async ({ text }) => {
        try {
            if (!text || text.trim().length === 0) return;

            const history = sessionHistories.get(socket.id);
            if (!history) {
                socket.emit("ai-interview:error", {
                    message: "Session not found. Please restart the interview.",
                });
                return;
            }

            // Add user's message to history
            history.push({ role: "user", text: text.trim() });

            // Emit a "thinking" signal to the frontend
            socket.emit("ai-interview:thinking", true);

            // Build full prompt from conversation history and call Gemini
            const prompt = buildPromptFromHistory(history, null);
            const aiReply = await callGeminiAI(prompt);
            const cleanReply = cleanResponse(aiReply);

            // Save AI's reply to history
            history.push({ role: "assistant", text: cleanReply });

            socket.emit("ai-interview:thinking", false);
            socket.emit("ai-interview:response", {
                text: cleanReply,
                isGreeting: false,
                turnCount: history.filter((h) => h.role === "user").length,
            });

            // Auto-end session check (10+ user turns)
            const userTurns = history.filter((h) => h.role === "user").length;
            if (userTurns >= 10) {
                socket.emit("ai-interview:session-end", {
                    message:
                        "The interview session has concluded. Well done for completing it!",
                });
            }
        } catch (err) {
            console.error("[AI Interview] answer error:", err.message);
            socket.emit("ai-interview:thinking", false);
            socket.emit("ai-interview:error", {
                message: err.message,
            });
        }
    });

    // --- End / Reset session manually ---
    socket.on("ai-interview:end", () => {
        sessionHistories.delete(socket.id);
        socket.emit("ai-interview:session-end", {
            message: "Session ended. Your history has been cleared.",
        });
    });

    // --- Cleanup on disconnect ---
    socket.on("disconnect", () => {
        sessionHistories.delete(socket.id);
    });
};

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------

/**
 * Builds a single flat prompt from the conversation history array
 * so we can pass it to the simple Gemini text endpoint (no multi-turn API).
 */
const buildPromptFromHistory = (history, _newUserMessage) => {
    const lines = [];

    // System instruction first
    const systemEntry = history.find((h) => h.role === "system");
    if (systemEntry) {
        lines.push(`[SYSTEM INSTRUCTIONS]\n${systemEntry.text}\n`);
    }

    lines.push("[CONVERSATION SO FAR]");

    history
        .filter((h) => h.role !== "system")
        .forEach((entry) => {
            if (entry.role === "user") {
                lines.push(`Candidate: ${entry.text}`);
            } else if (entry.role === "assistant") {
                lines.push(`ARIA (Interviewer): ${entry.text}`);
            }
        });

    lines.push("\n[YOUR NEXT RESPONSE AS ARIA]");

    return lines.join("\n");
};

/**
 * Strip any residual markdown that Gemini might add,
 * since the response will be spoken via text-to-speech.
 */
const cleanResponse = (text) => {
    if (!text) return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, "$1") // bold
        .replace(/\*(.*?)\*/g, "$1")     // italic
        .replace(/`{1,3}[^`]*`{1,3}/g, "") // code
        .replace(/#{1,6}\s/g, "")        // headings
        .replace(/^[-*•]\s+/gm, "")      // bullets
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};
