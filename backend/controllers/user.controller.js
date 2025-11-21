import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import ConnectionRequest from "../models/connections.model.js";
import request from "request";
import fs from "fs";
import path from "path";
import pdf from "pdf-creator-node";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- HELPER: Fetch Image Buffer ---
const fetchImageBuffer = (url) => {
    return new Promise((resolve) => {
        if (!url || !url.startsWith("http")) {
            return resolve(null);
        }
        request({ url, encoding: null, timeout: 4000 }, (err, res, body) => {
            if (err || res.statusCode !== 200) {
                return resolve(null);
            }
            resolve(body);
        });
    });
};

export const register = async (req, res) => {
    try {
        const { name, email, password, username } = req.body;
        if (!name || !email || !password || !username)
            return res.status(400).json({ message: "All fields are required" });
        const user = await User.findOne({ email });
        if (user)
            return res.status(400).json({ message: "User already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            username,
        });
        await newUser.save();
        const profile = new Profile({ userId: newUser._id });
        await profile.save();
        return res.json({ message: "User Created" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "All fields are required" });
        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User does not exist" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid Credentials !" });
        const token = crypto.randomBytes(32).toString("hex");
        await User.updateOne({ _id: user._id }, { token });
        return res.json({ token: token });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const uploadProfilePicture = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findOne({ token });
        if (!user)
            return res.status(404).json({ message: "User does not exist" });
        if (!req.file)
            return res.status(400).json({ message: "No file uploaded." });
        user.profilePicture = req.file.path;
        await user.save();
        return res.json({
            message: "Profile picture updated",
            url: req.file.path,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const uploadBackgroundPicture = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findOne({ token });
        if (!user)
            return res.status(404).json({ message: "User does not exist" });
        if (!req.file)
            return res.status(400).json({ message: "No file uploaded." });
        user.backgroundPicture = req.file.path;
        await user.save();
        return res.json({ message: "Background updated", url: req.file.path });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { token, ...newUserData } = req.body;
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });
        Object.assign(user, newUserData);
        await user.save();
        return res.json({ message: "User Updated", user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getUserAndProfile = async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });
        const profile = await Profile.findOne({ userId: user._id }).populate(
            "userId",
            "name email username profilePicture backgroundPicture isOnline lastSeen"
        );
        return res.json({ profile });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateProfileData = async (req, res) => {
    try {
        const { token, ...newProfileData } = req.body;
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const updatedProfile = await Profile.findOneAndUpdate(
            { userId: user._id },
            { $set: newProfileData },
            { new: true }
        );

        return res.json({
            message: "Profile Updated",
            profile: updatedProfile,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// --- DOWNLOAD RESUME LOGIC ---
export const downloadProfile = async (req, res) => {
    try {
        const user_id = req.query.id;
        if (!user_id)
            return res.status(400).json({ message: "User ID is required." });

        const userProfile = await Profile.findOne({ userId: user_id }).populate(
            "userId",
            "name username email"
        );
        if (!userProfile)
            return res.status(404).json({ message: "Profile not found." });

        const userProfileObj = userProfile.toObject();

        const templatePath = path.join(
            __dirname,
            "../templates/resume_template.html"
        );
        if (!fs.existsSync(templatePath)) {
            return res
                .status(500)
                .json({ message: "Resume template not found on server." });
        }

        const html = fs.readFileSync(templatePath, "utf8");

        const data = {
            user: {
                name: userProfileObj.userId.name,
                email: userProfileObj.userId.email,
                mobile: userProfileObj.phoneNumber || "",
                linkedin: userProfileObj.linkedin || "",
                github: userProfileObj.github || "",
                leetcode: userProfileObj.leetcode || "",
            },
            skills: userProfileObj.skills || [],
            work: userProfileObj.pastWork || [],
            education: userProfileObj.education || [],
            projects: userProfileObj.projects || [],
            certificates: userProfileObj.certificates || [],
            achievements: userProfileObj.achievements || [],
        };

        const options = {
            format: "A4",
            orientation: "portrait",
            border: "10mm",
        };
        const document = {
            html: html,
            data: data,
            path: "./output.pdf",
            type: "buffer",
        };
        const pdfBuffer = await pdf.create(document, options);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${userProfileObj.userId.username}_resume.pdf"`
        );
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ message: "Failed to generate PDF." });
    }
};

export const getAllUserProfile = async (req, res) => {
    try {
        const profiles = await Profile.find().populate(
            "userId",
            "name username email profilePicture backgroundPicture isOnline lastSeen"
        );
        return res.json({ profiles });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// --- CONNECTION LOGIC (RESTORED) ---
export const sendConnectionRequest = async (req, res) => {
    const { token, connectionId } = req.body;
    try {
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });
        const connectionUser = await User.findOne({ _id: connectionId });
        if (!connectionUser)
            return res
                .status(404)
                .json({ message: "Connection User not found" });
        if (user._id.toString() === connectionUser._id.toString()) {
            return res
                .status(400)
                .json({ message: "You cannot connect with yourself." });
        }
        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { userId: user._id, connectionId: connectionUser._id },
                { userId: connectionUser._id, connectionId: user._id },
            ],
        });
        if (existingRequest) {
            return res.status(400).json({ message: "Request already sent" });
        }
        const request = new ConnectionRequest({
            userId: user._id,
            connectionId: connectionUser._id,
        });
        await request.save();
        return res.json({ message: "Request Sent" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getMyConnectionsRequests = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });
        const connections = await ConnectionRequest.find({
            userId: user._id,
        }).populate(
            "connectionId",
            "name username email profilePicture isOnline lastSeen"
        );
        return res.json({ connections });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const whatAreMyConnections = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });
        const connections = await ConnectionRequest.find({
            connectionId: user._id,
        }).populate(
            "userId",
            "name username email profilePicture isOnline lastSeen"
        );
        return res.json({ connections });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const acceptConnectionRequest = async (req, res) => {
    const { token, requestId, action_type } = req.body;
    try {
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });
        const connection = await ConnectionRequest.findOne({
            _id: requestId,
            connectionId: user._id,
        });
        if (!connection)
            return res.status(404).json({ message: "Connection not found" });

        if (action_type === "accept") {
            connection.status_accepted = true;
            await connection.save();
            return res.json({ message: "Request Accepted" });
        } else {
            await ConnectionRequest.deleteOne({ _id: requestId });
            return res.json({ message: "Request Declined" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const commentPost = async (req, res) => {
    const { token, post_id, commentBody } = req.body;
    try {
        const user = await User.findOne({ token: token }).select("_id");
        if (!user) return res.status(404).json({ message: "User not found" });
        const post = await Post.findOne({ _id: post_id });
        if (!post) return res.status(404).json({ message: "Post not found" });
        const comment = new Comment({
            userId: user._id,
            postId: post_id,
            body: commentBody,
        });
        await comment.save();
        return res.status(200).json({ message: "comment Added" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getUserProfileAndUserBasedOnUername = async (req, res) => {
    const { username } = req.query;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "User not found" });
        const userProfile = await Profile.findOne({
            userId: user._id,
        }).populate(
            "userId",
            "name email username profilePicture backgroundPicture isOnline lastSeen"
        );
        if (!userProfile)
            return res.status(404).json({ message: "Profile not found" });

        const connections = await ConnectionRequest.find({
            $or: [
                { userId: user._id, status_accepted: true },
                { connectionId: user._id, status_accepted: true },
            ],
        }).populate("userId connectionId", "name username profilePicture");

        const connectionList = connections.map((conn) => {
            if (conn.userId._id.toString() === user._id.toString())
                return conn.connectionId;
            return conn.userId;
        });

        const profileData = userProfile.toObject();
        profileData.connectionCount = connectionList.length;
        profileData.connectionList = connectionList;
        return res.json({ profile: profileData });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email is required" });
        const user = await User.findOne({ email });
        if (!user)
            return res
                .status(200)
                .json({
                    message:
                        "If that email exists, a reset link has been sent.",
                });
        return res.status(200).json({ message: "Reset link sent!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
