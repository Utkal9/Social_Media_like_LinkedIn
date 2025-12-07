import Resume from "../models/resume.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

// Helper: Delete from Cloudinary
const deleteFromCloudinary = async (url) => {
    if (!url || url.includes("default_") || !url.includes("cloudinary")) return;
    try {
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
        const match = url.match(regex);
        if (match && match[1]) {
            await cloudinary.uploader.destroy(match[1]);
        }
    } catch (error) {
        console.error("Cloudinary delete error:", error);
    }
};

export const createResume = async (req, res) => {
    try {
        const { token, title } = req.body;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Initialize with basic user info
        const newResume = new Resume({
            userId: user._id,
            title: title || "Untitled Resume",
            personal_info: {
                name: user.name,
                email: user.email,
                image: user.profilePicture, // Use profile pic as default
            },
        });

        await newResume.save();
        return res
            .status(200)
            .json({
                message: "Resume Created",
                resume: newResume,
                resumeId: newResume._id,
            });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getAllResumes = async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const resumes = await Resume.find({ userId: user._id }).sort({
            updatedAt: -1,
        });
        return res.json({ resumes });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getResumeById = async (req, res) => {
    try {
        const { token, resumeId } = req.query;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const resume = await Resume.findOne({
            _id: resumeId,
            userId: user._id,
        });
        if (!resume)
            return res.status(404).json({ message: "Resume not found" });

        return res.json({ resume });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const deleteResume = async (req, res) => {
    try {
        const { token, resumeId } = req.body;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const resume = await Resume.findOne({
            _id: resumeId,
            userId: user._id,
        });
        if (!resume)
            return res.status(404).json({ message: "Resume not found" });

        // Optional: Delete custom image if it exists
        if (
            resume.personal_info?.image &&
            resume.personal_info.image !== user.profilePicture
        ) {
            await deleteFromCloudinary(resume.personal_info.image);
        }

        await Resume.deleteOne({ _id: resumeId });
        return res.json({ message: "Resume deleted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateResume = async (req, res) => {
    try {
        const { token, resumeId, resumeData, removeBackground } = req.body;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        let parsedData =
            typeof resumeData === "string"
                ? JSON.parse(resumeData)
                : resumeData;
        const resume = await Resume.findOne({
            _id: resumeId,
            userId: user._id,
        });
        if (!resume)
            return res.status(404).json({ message: "Resume not found" });

        // Handle Image Upload
        if (req.file) {
            if (resume.personal_info?.image) {
                await deleteFromCloudinary(resume.personal_info.image);
            }
            parsedData.personal_info.image = req.file.path;
        } else if (removeBackground === "yes") {
            parsedData.personal_info.image = "";
        } else {
            // Preserve existing image if not uploading new one
            parsedData.personal_info.image = resume.personal_info.image;
        }

        parsedData.updatedAt = Date.now();

        // Update fields
        Object.assign(resume, parsedData);
        await resume.save();

        return res.json({ message: "Resume saved", resume });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};
