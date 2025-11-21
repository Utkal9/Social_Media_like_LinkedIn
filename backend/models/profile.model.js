import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
    school: { type: String, default: "" },
    degree: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    years: { type: String, default: "" },
    grade: { type: String, default: "" },
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
});

const ProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    bio: { type: String, default: "" },
    currentPost: { type: String, default: "" },

    // --- NEW: Contact Info ---
    phoneNumber: { type: String, default: "" },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    leetcode: { type: String, default: "" },

    // --- Existing & New Sections ---
    pastWork: { type: [workSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certificates: { type: [certificateSchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },

    skills: { type: [String], default: [] },
});

const Profile = mongoose.model("Profile", ProfileSchema);
export default Profile;
