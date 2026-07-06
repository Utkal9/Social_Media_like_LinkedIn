import { Router } from "express";
import {
    createResume,
    getAllResumes,
    getResumeById,
    getPublicResume,
    getPrintResume,
    updateResume,
    deleteResume,
} from "../controllers/resume.controller.js";
import {
    enhanceProfessionalSummary,
    enhanceJobDescription,
    createResumeFromText,
    enhanceProjectDescription,
    tailorResumeToJD,
    analyzeJobMatch,
    generateMockInterview,
} from "../controllers/ai.controller.js";
import { exportResumeToPdf } from "../controllers/pdf.controller.js";
import upload from "../config/cloudinary.config.js";

import { rateLimit } from "express-rate-limit";

const router = Router();

// Define AI Rate Limiter: Max 10 requests per 5 minutes per IP
const aiRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 10, // Limit each IP to 10 AI requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: "Too many AI requests from this IP, please try again after 5 minutes." },
});

// Resume CRUD
router.post("/resume/create", createResume);
router.get("/resume/all", getAllResumes);
router.get("/resume/get", getResumeById);
router.get("/resume/public", getPublicResume);
router.get("/resume/print", getPrintResume);
router.post("/resume/delete", deleteResume);
router.post("/resume/update", upload.single("image"), updateResume);
router.get("/resume/export/pdf/:id", exportResumeToPdf);

// Apply rate limiter to all AI routes
router.use("/resume/ai", aiRateLimiter);

// AI helpers
router.post("/resume/ai/enhance-summary", enhanceProfessionalSummary);
router.post("/resume/ai/enhance-job", enhanceJobDescription);
router.post("/resume/ai/parse-text", createResumeFromText);
router.post("/resume/ai/enhance-project", enhanceProjectDescription);

// AI Career Tools
router.post("/resume/ai/tailor", tailorResumeToJD);
router.post("/resume/ai/match-score", analyzeJobMatch);
router.post("/resume/ai/mock-interview", generateMockInterview);

export default router;

