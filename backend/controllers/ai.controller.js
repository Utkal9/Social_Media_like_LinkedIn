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

        // Return 3-4 bullet points as an array
        const prompt = `
            You are an expert in resume writing. Your task is to enhance the job description of a resume.
            Generate exactly 3-4 distinct bullet points, each 1-2 lines max.
            Use action verbs and quantifiable results where possible. Make it ATS-friendly.
            STRICT FORMAT: Return ONLY a JSON array of strings, e.g. ["bullet 1", "bullet 2", "bullet 3"]
            No markdown, no extra text, just the JSON array.

            Content to enhance: "${userContent}"
        `;

        let rawText = await callGeminiAI(prompt);
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const bullets = JSON.parse(rawText);
            if (Array.isArray(bullets)) {
                return res.status(200).json({ enhancedContent: bullets });
            }
        } catch (parseErr) {
            // Fallback: split by newlines if AI didn't return valid JSON array
            const bullets = rawText
                .split("\n")
                .map(s => s.replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, "").trim())
                .filter(s => s.length > 5)
                .slice(0, 4);
            return res.status(200).json({ enhancedContent: bullets });
        }

        return res.status(200).json({ enhancedContent: [cleanAIResponse(rawText)] });
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
            2. Each bullet should be 1-2 lines max.
            3. STRICT FORMAT: Return ONLY a JSON array of strings, e.g. ["bullet 1", "bullet 2", "bullet 3"]
            4. No markdown, no extra text, just the JSON array.

            Context:
            ${context}
        `;

        let rawText = await callGeminiAI(prompt);
        rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const bullets = JSON.parse(rawText);
            if (Array.isArray(bullets)) {
                return res.status(200).json({ enhancedContent: bullets });
            }
        } catch (parseErr) {
            // Fallback: split by newlines
            const bullets = rawText
                .split("\n")
                .map(s => s.replace(/^[-•*]\s*/, "").replace(/^\d+\.\s*/, "").trim())
                .filter(s => s.length > 5)
                .slice(0, 4);
            return res.status(200).json({ enhancedContent: bullets });
        }

        return res.status(200).json({ enhancedContent: [cleanAIResponse(rawText)] });
    } catch (error) {
        const status = error.message.includes("busy") ? 429 : 500;
        return res.status(status).json({ message: error.message });
    }
};

// ---------------------------------------------------------
// HELPER: Serialize resume data into a text summary for AI prompts
// ---------------------------------------------------------
const serializeResumeForAI = (resume) => {
    let text = "";

    if (resume.personal_info) {
        const pi = resume.personal_info;
        text += `Name: ${pi.full_name || "N/A"}\n`;
        if (pi.profession) text += `Profession: ${pi.profession}\n`;
        if (pi.email) text += `Email: ${pi.email}\n`;
    }

    if (resume.professional_summary) {
        text += `\nProfessional Summary:\n${resume.professional_summary}\n`;
    }

    // Skills
    const skillParts = [];
    if (resume.skillLanguages) skillParts.push(`Languages: ${resume.skillLanguages}`);
    if (resume.skillFrontend) skillParts.push(`Frontend: ${resume.skillFrontend}`);
    if (resume.skillBackend) skillParts.push(`Backend: ${resume.skillBackend}`);
    if (resume.skillCloudDevOps) skillParts.push(`Cloud/DevOps: ${resume.skillCloudDevOps}`);
    if (resume.skillTools) skillParts.push(`Tools: ${resume.skillTools}`);
    if (resume.skillCoreConcepts) skillParts.push(`Core Concepts: ${resume.skillCoreConcepts}`);
    if (resume.skillSoft) skillParts.push(`Soft Skills: ${resume.skillSoft}`);
    if (resume.specLanguages) skillParts.push(`Languages: ${resume.specLanguages}`);
    if (resume.specTechFrameworks) skillParts.push(`Tech/Frameworks: ${resume.specTechFrameworks}`);
    if (resume.specDomainSkills) skillParts.push(`Domain Skills: ${resume.specDomainSkills}`);
    if (resume.skills?.length) skillParts.push(`Other: ${resume.skills.join(", ")}`);
    if (skillParts.length) text += `\nSkills:\n${skillParts.join("\n")}\n`;

    // Experience
    if (resume.experience?.length) {
        text += `\nExperience:\n`;
        resume.experience.forEach((exp) => {
            text += `- ${exp.position || "Role"} at ${exp.company || "Company"}`;
            if (exp.start_date) text += ` (${exp.start_date} - ${exp.end_date || "Present"})`;
            text += `\n`;
            const desc = Array.isArray(exp.description) ? exp.description.filter(Boolean).join("\n  ") : exp.description;
            if (desc) text += `  ${desc}\n`;
            if (exp.tech_stack) text += `  Tech Stack: ${exp.tech_stack}\n`;
        });
    }

    // Projects
    if (resume.project?.length) {
        text += `\nProjects:\n`;
        resume.project.forEach((proj) => {
            text += `- ${proj.name || "Project"}`;
            if (proj.tech_stack) text += ` [${proj.tech_stack}]`;
            text += `\n`;
            const desc = Array.isArray(proj.description) ? proj.description.filter(Boolean).join("\n  ") : proj.description;
            if (desc) text += `  ${desc}\n`;
        });
    }

    // Education
    if (resume.education?.length) {
        text += `\nEducation:\n`;
        resume.education.forEach((edu) => {
            text += `- ${edu.degree || ""} in ${edu.field || ""} from ${edu.institution || ""}`;
            if (edu.gpa) text += ` (GPA: ${edu.gpa})`;
            text += `\n`;
        });
    }

    // Certificates
    if (resume.certificates?.length) {
        text += `\nCertificates:\n`;
        resume.certificates.forEach((cert) => {
            text += `- ${cert.name}`;
            if (cert.issuer) text += ` by ${cert.issuer}`;
            text += `\n`;
        });
    }

    // Achievements
    if (resume.achievements?.length) {
        text += `\nAchievements:\n`;
        resume.achievements.forEach((ach) => {
            text += `- ${ach.title}`;
            if (ach.description) text += `: ${ach.description}`;
            text += `\n`;
        });
    }

    return text.substring(0, 6000); // Keep under token limits
};

// ---------------------------------------------------------
// AI CAREER TOOLS
// ---------------------------------------------------------

// POST: /resume/ai/tailor
export const tailorResumeToJD = async (req, res) => {
    try {
        const { token, resumeId, jobDescription } = req.body;

        const user = await getUserByToken(token);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!jobDescription || !resumeId) {
            return res.status(400).json({ message: "Job description and resume are required." });
        }

        const resume = await Resume.findOne({ _id: resumeId, userId: user._id });
        if (!resume) return res.status(404).json({ message: "Resume not found" });

        const resumeText = serializeResumeForAI(resume);

        const prompt = `
You are an expert ATS resume optimizer and career coach.

TASK: Rewrite and restructure the following resume to perfectly target the given Job Description. 
The output must be ATS-optimized (use exact keywords from the JD).

RULES:
1. Rewrite the professional_summary to directly target the JD role (2-3 sentences).
2. Reorder and rewrite experience descriptions to emphasize JD-relevant achievements. Use action verbs and quantifiable results.
3. Reorder and rewrite project descriptions to highlight JD-relevant technologies and impact.
4. For skills: keep existing relevant skills AND add any JD-required skills the candidate plausibly has based on their experience.
5. Keep personal_info, education, certificates, and achievements mostly unchanged — only rewrite if it improves JD alignment.
6. PRESERVE all original data — do not remove experiences or projects, just reorder and rewrite them.
7. Return ONLY valid JSON, no markdown, no explanation.
8. CRITICAL: Each description MUST be an array of 3-4 bullet point strings. Each bullet should be 1-2 lines max, using action verbs and quantifiable results.

JOB DESCRIPTION:
${jobDescription.substring(0, 4000)}

CURRENT RESUME:
${resumeText}

Return JSON in this EXACT format:
{
    "professional_summary": "rewritten summary string",
    "skillLanguages": "comma-separated languages",
    "skillFrontend": "comma-separated frontend skills",
    "skillBackend": "comma-separated backend skills",
    "skillCloudDevOps": "comma-separated cloud/devops skills",
    "skillTools": "comma-separated tools",
    "skillCoreConcepts": "comma-separated concepts",
    "experience": [
        {
            "company": "string",
            "position": "string",
            "start_date": "string",
            "end_date": "string",
            "description": ["bullet point 1", "bullet point 2", "bullet point 3"],
            "tech_stack": "string",
            "is_current": false
        }
    ],
    "project": [
        {
            "name": "string",
            "description": ["bullet point 1", "bullet point 2", "bullet point 3"],
            "tech_stack": "string",
            "link": "string",
            "live_link": "string"
        }
    ],
    "extracted_role": "short role title extracted from JD, e.g. Full Stack Developer"
}
`;

        let jsonString = await callGeminiAI(prompt);
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();

        const tailored = JSON.parse(jsonString);
        const roleName = tailored.extracted_role || "Target Role";
        delete tailored.extracted_role;

        // Create a new resume with tailored content (keep original untouched)
        const newResume = await Resume.create({
            userId: user._id,
            title: `Tailored — ${roleName}`,
            template: resume.template,
            accent_color: resume.accent_color,
            font_size: resume.font_size,
            section_order: resume.section_order,
            personal_info: resume.personal_info,
            education: resume.education,
            certificates: resume.certificates,
            achievements: resume.achievements,
            skills: resume.skills,
            // Overwrite with AI-tailored content
            professional_summary: tailored.professional_summary || resume.professional_summary,
            skillLanguages: tailored.skillLanguages || resume.skillLanguages,
            skillFrontend: tailored.skillFrontend || resume.skillFrontend,
            skillBackend: tailored.skillBackend || resume.skillBackend,
            skillCloudDevOps: tailored.skillCloudDevOps || resume.skillCloudDevOps,
            skillTools: tailored.skillTools || resume.skillTools,
            skillCoreConcepts: tailored.skillCoreConcepts || resume.skillCoreConcepts,
            experience: tailored.experience?.length ? tailored.experience : resume.experience,
            project: tailored.project?.length ? tailored.project : resume.project,
        });

        return res.status(200).json({
            message: "Resume tailored successfully!",
            resumeId: newResume._id,
            roleName,
            diffData: {
                oldSummary: resume.professional_summary || "",
                newSummary: newResume.professional_summary || "",
            }
        });
    } catch (error) {
        console.error("Tailor Error:", error);
        const status = error.message.includes("busy") ? 429 : 500;
        return res.status(status).json({ message: error.message });
    }
};

// POST: /resume/ai/match-score
export const analyzeJobMatch = async (req, res) => {
    try {
        const { token, resumeId, jobDescription } = req.body;

        const user = await getUserByToken(token);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!jobDescription || !resumeId) {
            return res.status(400).json({ message: "Job description and resume are required." });
        }

        const resume = await Resume.findOne({ _id: resumeId, userId: user._id });
        if (!resume) return res.status(404).json({ message: "Resume not found" });

        const resumeText = serializeResumeForAI(resume);

        const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer and career advisor.

TASK: Analyze how well the following resume matches the given Job Description.

RULES:
1. Calculate a match score from 0-100 based on skill alignment, experience relevance, and keyword overlap.
2. Identify skills the candidate HAS that match the JD.
3. Identify skills REQUIRED by the JD that are MISSING from the resume.
4. Provide actionable suggestions to improve the match.
5. Identify keyword gaps — important JD terms not found in the resume.
6. Calculate an ATS compatibility score (0-100) based on keyword density, format, and standard sections.
7. Return ONLY valid JSON, no markdown, no explanation.

JOB DESCRIPTION:
${jobDescription.substring(0, 4000)}

CANDIDATE RESUME:
${resumeText}

Return JSON in this EXACT format:
{
    "score": 72,
    "matching_skills": ["React", "Node.js", "MongoDB"],
    "missing_skills": ["TypeScript", "AWS", "Docker"],
    "suggestions": [
        "Add quantifiable metrics to project descriptions",
        "Mention REST API development experience explicitly"
    ],
    "keyword_gaps": ["CI/CD", "microservices", "agile"],
    "ats_score": 65,
    "ats_tips": [
        "Add a dedicated skills section with exact JD keywords",
        "Use standard section headings like Experience and Education"
    ],
    "summary": "Brief 2-sentence overall assessment"
}
`;

        let jsonString = await callGeminiAI(prompt);
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();

        const analysis = JSON.parse(jsonString);

        return res.status(200).json({ analysis });
    } catch (error) {
        console.error("Match Score Error:", error);
        const status = error.message.includes("busy") ? 429 : 500;
        return res.status(status).json({ message: error.message });
    }
};

// POST: /resume/ai/mock-interview
export const generateMockInterview = async (req, res) => {
    try {
        const { token, resumeId, jobDescription } = req.body;

        const user = await getUserByToken(token);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!jobDescription || !resumeId) {
            return res.status(400).json({ message: "Job description and resume are required." });
        }

        const resume = await Resume.findOne({ _id: resumeId, userId: user._id });
        if (!resume) return res.status(404).json({ message: "Resume not found" });

        const resumeText = serializeResumeForAI(resume);

        const prompt = `
You are a senior technical interviewer at a top tech company.

TASK: Generate 8-10 interview questions that a candidate would likely face for this job, personalized to their resume.

RULES:
1. Mix question types: technical (coding/system design), behavioral (STAR method), and situational.
2. Tailor questions to the candidate's ACTUAL experience — reference their specific projects and roles.
3. Include questions about skills they claim to have AND skills the JD requires.
4. For each question, provide a brief hint on how to answer well.
5. Rate difficulty as: easy, medium, or hard.
6. Return ONLY valid JSON array, no markdown, no explanation.

JOB DESCRIPTION:
${jobDescription.substring(0, 4000)}

CANDIDATE RESUME:
${resumeText}

Return JSON array in this EXACT format:
[
    {
        "question": "The interview question text",
        "type": "technical",
        "difficulty": "medium",
        "hint": "Brief guidance on how to answer this well",
        "what_they_check": "What the interviewer is evaluating with this question"
    }
]

Types must be one of: "technical", "behavioral", "situational"
Difficulty must be one of: "easy", "medium", "hard"
`;

        let jsonString = await callGeminiAI(prompt);
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();

        const questions = JSON.parse(jsonString);

        return res.status(200).json({ questions });
    } catch (error) {
        console.error("Mock Interview Error:", error);
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
                        "description": [{ "type": "String" }],
                        "is_current": { "type": "Boolean" }
                    }
                ],
                "project": [
                    {
                        "name": { "type": "String" },
                        "type": { "type": "String" },
                        "description": [{ "type": "String" }]
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
