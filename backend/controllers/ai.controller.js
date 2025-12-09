import Resume from "../models/resume.model.js";
import User from "../models/user.model.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Models supported by your free tier
const AVAILABLE_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
];

// Helper: Get user from token
const getUserByToken = async (token) => {
    if (!token) return null;
    return await User.findOne({ token });
};

// Helper: Call Google Gemini API (Replaces OpenAI)
const callGeminiAI = async (prompt) => {
    if (!GEMINI_API_KEY) {
        throw new Error("Server Error: GEMINI_API_KEY is missing.");
    }

    let lastError = null;

    // Try each model until one works
    for (const modelName of AVAILABLE_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

            const payload = {
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
            };

            const response = await axios.post(url, payload, {
                headers: { "Content-Type": "application/json" },
            });

            const text =
                response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                return text; // Success
            }
        } catch (error) {
            console.warn(
                `[Backend Log] Model ${modelName} failed: ${
                    error.response?.data?.error?.message || error.message
                }`
            );
            lastError = error;
        }
    }

    // Error Sanitization for Frontend
    if (lastError?.response?.status === 429) {
        throw new Error(
            "AI is busy (Rate Limit). Please wait 1 minute and try again."
        );
    }
    if (
        lastError?.response?.status === 404 ||
        lastError?.response?.status === 400
    ) {
        throw new Error(
            "AI Service is currently updating. Please try again later."
        );
    }
    throw new Error("Unable to connect to AI service. Please try again.");
};

// Helper: Fetch GitHub Context
const fetchGithubContext = async (githubUrl) => {
    try {
        const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
        const match = githubUrl.match(regex);
        if (!match) return null;

        const owner = match[1];
        const repo = match[2].replace(".git", "");

        try {
            const readmeResponse = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/readme`,
                {
                    headers: { Accept: "application/vnd.github.v3.raw" },
                }
            );
            return `[Source: GitHub README]\n${readmeResponse.data.substring(
                0,
                3000
            )}`;
        } catch (error) {
            return null; // Silent fail
        }
    } catch (error) {
        return null;
    }
};

// Helper: Clean formatting
const cleanAIResponse = (text) => {
    if (!text) return "";
    return text
        .replace(/\*\*/g, "")
        .replace(/^[\*\-]\s*/gm, "")
        .trim();
};

// ---------------------------------------------------------
// CONTROLLERS
// ---------------------------------------------------------

// POST: /resume/ai/enhance-summary
export const enhanceProfessionalSummary = async (req, res) => {
    try {
        const { userContent } = req.body;

        if (!userContent) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // YOUR ORIGINAL LOGIC (Adapted for Gemini)
        const prompt = `
            You are an expert in resume writing. Your task is to enhance the professional summary of a resume. 
            The summary should be 1-2 sentences also highlighting key skills, experience, and career objectives. 
            Make it compelling and ATS-friendly. and only return text no options or anything else.

            Content to enhance: "${userContent}"
        `;

        const enhancedContent = await callGeminiAI(prompt);
        return res
            .status(200)
            .json({ enhancedContent: cleanAIResponse(enhancedContent) });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// POST: /resume/ai/enhance-job
export const enhanceJobDescription = async (req, res) => {
    try {
        const { userContent } = req.body;

        if (!userContent) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // YOUR ORIGINAL LOGIC (Adapted for Gemini)
        const prompt = `
            You are an expert in resume writing. Your task is to enhance the job description of a resume. 
            The job description should be only in 1-2 sentence also highlighting key responsibilities and achievements. 
            Use action verbs and quantifiable results where possible. Make it ATS-friendly. and only return text no options or anything else.

            Content to enhance: "${userContent}"
        `;

        const enhancedContent = await callGeminiAI(prompt);
        return res
            .status(200)
            .json({ enhancedContent: cleanAIResponse(enhancedContent) });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// POST: /resume/ai/enhance-project (New Feature)
export const enhanceProjectDescription = async (req, res) => {
    try {
        const { projectName, projectDescription, githubLink } = req.body;

        if (!projectName)
            return res
                .status(400)
                .json({ message: "Project Name is required." });

        let context = `Project Name: ${projectName}.\n`;

        if (githubLink) {
            const githubData = await fetchGithubContext(githubLink);
            if (githubData) context += `\n${githubData}\n`;
        }

        if (projectDescription) {
            context += `\nUser Notes/Draft: ${projectDescription}\n`;
        }

        const prompt = `
            You are a technical resume expert.
            Generate 3-4 distinct, impressive bullet points for this project.
            Rules:
            1. Use strong technical action verbs.
            2. STRICT FORMAT: Return exactly 3 or 4 sentences separated by newlines.
            3. Do NOT use bullet points (* or -). Just the plain text lines.

            Context:
            ${context}
        `;

        const rawText = await callGeminiAI(prompt);
        const enhancedContent = cleanAIResponse(rawText);

        return res.status(200).json({ enhancedContent });
    } catch (error) {
        const status = error.message.includes("busy") ? 429 : 500;
        return res.status(status).json({ message: error.message });
    }
};

// POST: /resume/ai/parse-text
export const createResumeFromText = async (req, res) => {
    try {
        const { resumeText, title, token } = req.body;

        // LinkUps Auth Check
        const user = await getUserByToken(token);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!resumeText) {
            return res.status(400).json({ message: "Missing resume text" });
        }

        // YOUR ORIGINAL LOGIC (Adapted for Gemini)
        const prompt = `
            You are an expert AI Agent to extract data from resume.
            extract data from this resume: ${resumeText.substring(0, 8000)}
        
            Provide data in the following JSON format with no additional text before or after:

            {
                "professional_summary": { "type": "String", "default": "" },
                "skills": [{ "type": "String" }],
                "personal_info": {
                    "image": {"type": "String", "default": "" },
                    "full_name": {"type": "String", "default": "" },
                    "profession": {"type": "String", "default": "" },
                    "email": {"type": "String", "default": "" },
                    "phone": {"type": "String", "default": "" },
                    "location": {"type": "String", "default": "" },
                    "linkedin": {"type": "String", "default": "" },
                    "website": {"type": "String", "default": "" }
                },
                "experience": [
                    {
                        "company": { "type": "String" },
                        "position": { "type": "String" },
                        "start_date": { "type": "String" },
                        "end_date": { "type": "String" },
                        "description": { "type": "String" },
                        "is_current": { "type": "Boolean" }
                    }
                ],
                "project": [
                    {
                        "name": { "type": "String" },
                        "type": { "type": "String" },
                        "description": { "type": "String" }
                    }
                ],
                "education": [
                    {
                        "institution": { "type": "String" },
                        "degree": { "type": "String" },
                        "field": { "type": "String" },
                        "graduation_date": { "type": "String" },
                        "gpa": { "type": "String" }
                    }
                ]
            }
        `;

        let jsonString = await callGeminiAI(prompt);
        // Clean markdown code blocks if Gemini adds them
        jsonString = jsonString
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsedData = JSON.parse(jsonString);

        // Create the resume in LinkUps DB
        const newResume = await Resume.create({
            userId: user._id,
            title: title || "AI Generated Resume",
            ...parsedData,
        });

        res.json({ resumeId: newResume._id });
    } catch (error) {
        console.error("AI Parse Error:", error);
        return res.status(400).json({ message: error.message });
    }
};
