import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
    school: { type: String, default: "" },
    degree: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    years: { type: String, default: "" },
    grade: { type: String, default: "" },
    // --- NEW: Location for Resume ---
    location: { type: String, default: "" },
});

const workSchema = new mongoose.Schema({
    company: { type: String, default: "" },
    position: { type: String, default: "" },
    years: { type: String, default: "" },
    description: { type: String, default: "" },
});

// --- NEW: Resume Specific Schemas ---
const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    link: { type: String, default: "" },
    duration: { type: String, default: "" },
    description: { type: String, default: "" },
});

const certificateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    link: { type: String, default: "" },
    date: { type: String, default: "" },
});

const achievementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    // --- NEW: Date for Resume ---
    date: { type: String, default: "" },
});

const ProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    bio: { type: String, default: "" },
    currentPost: { type: String, default: "" },

    // --- Contact Info ---
    phoneNumber: { type: String, default: "" },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    leetcode: { type: String, default: "" },

    // --- Sections ---
    pastWork: { type: [workSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certificates: { type: [certificateSchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },

    skills: { type: [String], default: [] },

    // --- NEW: Categorized Skills for Resume ---
    skillLanguages: { type: String, default: "" },
    skillCloudDevOps: { type: String, default: "" },
    skillFrameworks: { type: String, default: "" },
    skillTools: { type: String, default: "" },
    skillSoft: { type: String, default: "" },
});

const Profile = mongoose.model("Profile", ProfileSchema);
export default Profile;
