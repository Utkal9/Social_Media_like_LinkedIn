import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: { type: String, required: true },
    template: { type: String, default: "lpu" },
    accent_color: { type: String, default: "#2E74B5" },
    public: { type: Boolean, default: false },

    // 1. Personal Info
    personal_info: {
        full_name: { type: String, default: "" },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        location: { type: String, default: "" },
        website: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        github: { type: String, default: "" },
        leetcode: { type: String, default: "" },
        profession: { type: String, default: "" },
        image: { type: String, default: "" },
    },

    // 2. Summary
    professional_summary: { type: String, default: "" },

    // 3. Categorized Skills (These were missing!)
    skillLanguages: { type: String, default: "" },
    skillCloudDevOps: { type: String, default: "" },
    skillFrameworks: { type: String, default: "" },
    skillTools: { type: String, default: "" },
    skillSoft: { type: String, default: "" },
    skills: [{ type: String }], // Keeping for backward compatibility

    // 4. Experience
    experience: [
        {
            company: { type: String, default: "" },
            position: { type: String, default: "" },
            start_date: { type: String, default: "" },
            end_date: { type: String, default: "" },
            description: { type: String, default: "" },
            location: { type: String, default: "" },
            is_current: { type: Boolean, default: false },
        },
    ],

    // 5. Education
    education: [
        {
            institution: { type: String, default: "" },
            degree: { type: String, default: "" },
            field: { type: String, default: "" },
            graduation_date: { type: String, default: "" },
            gpa: { type: String, default: "" },
            location: { type: String, default: "" },
        },
    ],

    // 6. Projects
    project: [
        {
            name: { type: String, default: "" },
            type: { type: String, default: "" },
            description: { type: String, default: "" },
            link: { type: String, default: "" },
            live_link: { type: String, default: "" },
            duration: { type: String, default: "" },
        },
    ],

    // 7. Certificates
    certificates: [
        {
            name: { type: String, default: "" },
            link: { type: String, default: "" },
            date: { type: String, default: "" },
        },
    ],

    // 8. Achievements
    achievements: [
        {
            title: { type: String, default: "" },
            description: { type: String, default: "" },
            link: { type: String, default: "" },
            date: { type: String, default: "" },
        },
    ],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Resume = mongoose.model("Resume", ResumeSchema);
export default Resume;
