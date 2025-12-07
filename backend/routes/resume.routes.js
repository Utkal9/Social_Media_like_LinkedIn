import { Router } from "express";
import {
    createResume,
    getAllResumes,
    getResumeById,
    updateResume,
    deleteResume,
} from "../controllers/resume.controller.js";
import {
    enhanceProfessionalSummary,
    enhanceJobDescription,
    createResumeFromText,
} from "../controllers/ai.controller.js";
import multer from "multer";
import upload from "../config/cloudinary.config.js";

const router = Router();
const tempUpload = multer({ dest: "uploads/" });
/**
 * @openapi
 * tags:
 * - name: Resume
 * description: Resume Builder Endpoints
 */

router.post("/resume/create", createResume);
router.get("/resume/all", getAllResumes);
router.get("/resume/get", getResumeById);
router.post("/resume/delete", deleteResume);
// Handle file upload for resume image
router.post("/resume/update", upload.single("image"), updateResume);
// AI Logic Routes (Matching your minor project concepts)
router.post("/resume/ai/enhance-summary", enhanceProfessionalSummary);
router.post("/resume/ai/enhance-job", enhanceJobDescription);
router.post("/resume/ai/parse-text", createResumeFromText); // The "uploadResume" equivalent

export default router;
