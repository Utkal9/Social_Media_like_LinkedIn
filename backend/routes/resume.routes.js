import { Router } from "express";
import {
    createResume,
    getAllResumes,
    getResumeById,
    updateResume,
    deleteResume,
    downloadResumeDocx, // <--- Import Controller
} from "../controllers/resume.controller.js";
import {
    enhanceProfessionalSummary,
    enhanceJobDescription,
    createResumeFromText,
    enhanceProjectDescription,
} from "../controllers/ai.controller.js";
import multer from "multer";
import upload from "../config/cloudinary.config.js";

const router = Router();

router.post("/resume/create", createResume);
router.get("/resume/all", getAllResumes);
router.get("/resume/get", getResumeById);
router.post("/resume/delete", deleteResume);
router.post("/resume/update", upload.single("image"), updateResume);

// NEW ENDPOINT
router.get("/resume/download/docx", downloadResumeDocx);

// AI Routes
router.post("/resume/ai/enhance-summary", enhanceProfessionalSummary);
router.post("/resume/ai/enhance-job", enhanceJobDescription);
router.post("/resume/ai/parse-text", createResumeFromText);
router.post("/resume/ai/enhance-project", enhanceProjectDescription);

export default router;
