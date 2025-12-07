import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: { type: String, required: true },
    template: { type: String, default: "modern" },
    accent_color: { type: String, default: "#0fffc6" },
    public: { type: Boolean, default: false },

    // --- Resume Content Sections ---
    personal_info: {
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        address: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        github: { type: String, default: "" },
        leetcode: { type: String, default: "" },
        website: { type: String, default: "" },
        image: { type: String, default: "" },
        jobTitle: { type: String, default: "" },
    },
    professional_summary: { type: String, default: "" },
    experience: [
        {
            id: String,
            position: String,
            company: String,
            duration: String,
            description: String,
            location: String,
        },
    ],
    education: [
        {
            id: String,
            school: String,
            degree: String,
            fieldOfStudy: String,
            years: String,
            grade: String,
            location: String,
        },
    ],
    project: [
        {
            // Note: Frontend uses 'project' key in some places
            id: String,
            title: String,
            link: String,
            duration: String,
            description: String,
            technologies: String,
        },
    ],
    skills: [{ type: String }],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Resume = mongoose.model("Resume", ResumeSchema);
export default Resume;
