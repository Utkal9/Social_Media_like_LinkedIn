/**
 * marketAnalyzer.js
 *
 * A background worker that:
 * 1. Runs on a cron schedule (every 6 hours by default)
 * 2. Fetches job listings from The Muse public API (no auth required)
 * 3. Passes a batch of job descriptions to Gemini AI for skill extraction
 * 4. Upserts extracted skills + frequencies into the MarketData collection
 *
 * Usage in server.js:
 *   import { startMarketAnalyzer } from "./utils/marketAnalyzer.js";
 *   startMarketAnalyzer(); // Call AFTER mongoose.connect()
 */

import cron from "node-cron";
import axios from "axios";
import dotenv from "dotenv";
import MarketData from "../models/marketData.model.js";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AVAILABLE_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
];

// ---------------------------------------------------------------
// GEMINI HELPER (mirrors ai.controller.js pattern)
// ---------------------------------------------------------------
const callGeminiAI = async (prompt) => {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    let lastError = null;

    for (const modelName of AVAILABLE_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

            const response = await axios.post(
                url,
                { contents: [{ parts: [{ text: prompt }] }] },
                { headers: { "Content-Type": "application/json" }, timeout: 30000 }
            );

            const text =
                response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
        } catch (error) {
            console.warn(
                `[MarketAnalyzer] Model ${modelName} failed: ${
                    error.response?.data?.error?.message || error.message
                }`
            );
            lastError = error;
        }
    }

    throw lastError || new Error("All Gemini models failed.");
};

// ---------------------------------------------------------------
// STEP 1: Fetch job listings from The Muse API
// ---------------------------------------------------------------
const fetchJobListings = async (page = 1, category = "Engineering") => {
    try {
        // The Muse — free public API, no key required for basic endpoints
        const response = await axios.get(
            "https://www.themuse.com/api/public/jobs",
            {
                params: {
                    category,
                    page,
                    descending: true,
                },
                timeout: 15000,
            }
        );

        const jobs = response.data?.results || [];

        // Extract raw text from job contents (The Muse returns HTML in `contents`)
        const descriptions = jobs
            .map((job) => {
                const html = job.contents || "";
                // Strip HTML tags to get plain text
                const text = html
                    .replace(/<[^>]*>/g, " ")
                    .replace(/&[a-z]+;/gi, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .substring(0, 1000); // cap per-listing to control token usage

                return {
                    title: job.name || "Untitled",
                    company: job.company?.name || "Unknown",
                    content: text,
                };
            })
            .filter((j) => j.content.length > 50); // skip empty listings

        return descriptions;
    } catch (error) {
        console.error(
            "[MarketAnalyzer] Failed to fetch job listings:",
            error.message
        );
        return [];
    }
};

// ---------------------------------------------------------------
// STEP 2: Extract trending skills from job descriptions via Gemini
// ---------------------------------------------------------------
const extractSkillsWithGemini = async (jobDescriptions) => {
    if (!jobDescriptions || jobDescriptions.length === 0) return [];

    // Build a compact batched representation
    const batch = jobDescriptions
        .slice(0, 20) // safety cap
        .map(
            (j, i) =>
                `Job ${i + 1} — ${j.title} at ${j.company}:\n${j.content}`
        )
        .join("\n\n---\n\n");

    const prompt = `You are a labor market data analyst specializing in tech industry hiring trends.

Analyze the following ${jobDescriptions.slice(0, 20).length} real job descriptions and identify the TOP 10 most frequently mentioned and in-demand TECHNICAL skills.

Rules:
1. Focus ONLY on technical skills (programming languages, frameworks, platforms, tools, methodologies). Ignore soft skills like "communication".
2. Normalize skill names (e.g., "Node", "NodeJS", "Node.js" → "Node.js").
3. Count how many of the provided job descriptions mention each skill (frequency).
4. Also categorize each skill into one of: "language", "frontend", "backend", "cloud", "database", "devops", "data", "mobile", "ai-ml", "general".
5. Return ONLY a valid JSON array — no markdown, no explanation, no surrounding text.

Return format:
[
  { "displayName": "React", "skill": "react", "frequency": 14, "category": "frontend" },
  { "displayName": "Python", "skill": "python", "frequency": 12, "category": "language" }
]

JOB DESCRIPTIONS:
${batch}`;

    try {
        let rawText = await callGeminiAI(prompt);
        rawText = rawText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed = JSON.parse(rawText);

        if (!Array.isArray(parsed)) {
            throw new Error("Gemini did not return an array.");
        }

        return parsed
            .filter(
                (item) =>
                    item.displayName &&
                    item.skill &&
                    typeof item.frequency === "number"
            )
            .slice(0, 10);
    } catch (error) {
        console.error(
            "[MarketAnalyzer] Gemini skill extraction failed:",
            error.message
        );
        return [];
    }
};

// ---------------------------------------------------------------
// STEP 3: Upsert skills into MongoDB
// ---------------------------------------------------------------
const saveSkillsToDatabase = async (skills) => {
    if (!skills || skills.length === 0) {
        console.log("[MarketAnalyzer] No skills to save.");
        return;
    }

    const upsertOps = skills.map((item, index) => ({
        updateOne: {
            filter: { skill: item.skill },
            update: {
                $set: {
                    displayName: item.displayName,
                    frequency: item.frequency,
                    rank: index + 1,
                    category: item.category || "general",
                    source: "the-muse",
                    lastUpdated: new Date(),
                },
            },
            upsert: true,
        },
    }));

    try {
        const result = await MarketData.bulkWrite(upsertOps);
        console.log(
            `[MarketAnalyzer] ✅ Saved ${skills.length} trending skills. ` +
                `(Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount})`
        );
    } catch (error) {
        console.error(
            "[MarketAnalyzer] Failed to save to database:",
            error.message
        );
    }
};

// ---------------------------------------------------------------
// CORE RUN FUNCTION
// ---------------------------------------------------------------
export const runAnalysis = async () => {
    console.log(
        "[MarketAnalyzer] 🔄 Starting market analysis at",
        new Date().toISOString()
    );

    try {
        // Fetch two pages for a broader sample (40 listings)
        const [page1, page2] = await Promise.all([
            fetchJobListings(1, "Engineering"),
            fetchJobListings(2, "Engineering"),
        ]);

        const allListings = [...page1, ...page2];

        if (allListings.length === 0) {
            console.warn(
                "[MarketAnalyzer] ⚠️ No job listings fetched. Skipping this run."
            );
            return;
        }

        console.log(
            `[MarketAnalyzer] Fetched ${allListings.length} job listings. Sending to Gemini...`
        );

        const skills = await extractSkillsWithGemini(allListings);

        console.log(
            `[MarketAnalyzer] Gemini extracted ${skills.length} trending skills:`,
            skills.map((s) => `${s.displayName}(${s.frequency})`).join(", ")
        );

        await saveSkillsToDatabase(skills);

        console.log("[MarketAnalyzer] ✅ Analysis complete.");
    } catch (error) {
        console.error("[MarketAnalyzer] ❌ Analysis run failed:", error.message);
    }
};

// ---------------------------------------------------------------
// CRON SCHEDULER
// ---------------------------------------------------------------
export const startMarketAnalyzer = () => {
    console.log(
        "[MarketAnalyzer] 📅 Cron scheduler starting. Will run every 6 hours."
    );

    // Run immediately on startup so you see data right away
    runAnalysis();

    // Then schedule to run every 6 hours: "0 */6 * * *"
    cron.schedule("0 */6 * * *", () => {
        runAnalysis();
    });
};
