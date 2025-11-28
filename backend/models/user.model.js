import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    active: {
        type: Boolean,
        default: true,
    },
    password: {
        type: String,
        required: false, // Changed to false for Social Login
    },
    profilePicture: {
        type: String,
        default:
            "https://res.cloudinary.com/dx28uxwrg/image/upload/v1762799986/default_dlizpg.jpg",
    },
    backgroundPicture: {
        type: String,
        default:
            "https://img.freepik.com/free-photo/3d-rendering-hexagonal-texture-background_23-2150796421.jpg?semt=ais_hybrid&w=740&q=80",
    },
    // --- NEW FIELDS ---
    googleId: { type: String },
    githubId: { type: String },

    isOnline: {
        type: Boolean,
        default: false,
    },
    lastSeen: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    token: {
        type: String,
        default: "",
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
});
const User = mongoose.model("User", UserSchema);
export default User;
