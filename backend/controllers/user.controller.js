import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import ConnectionRequest from "../models/connections.model.js";
import request from "request";

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

        // Middleware should catch this, but double check
        if (!req.file) {
            return res
                .status(400)
                .json({ message: "No file uploaded or file upload failed." });
        }

        const newProfilePictureUrl = req.file.path;
        user.profilePicture = newProfilePictureUrl;
        await user.save();

        return res.json({
            message: "Profile picture updated",
            url: newProfilePictureUrl,
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

        if (!req.file) {
            return res
                .status(400)
                .json({ message: "No file uploaded or file upload failed." });
        }

        const newBackgroundUrl = req.file.path;
        user.backgroundPicture = newBackgroundUrl;
        await user.save();

        return res.json({
            message: "Background picture updated",
            url: newBackgroundUrl,
        });
    } catch (error) {
        console.error("Upload Controller Error:", error);
        return res.status(500).json({ message: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { token, ...newUserData } = req.body;
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });
        const { username, email } = newUserData;

        if (username || email) {
            const existingUser = await User.findOne({
                $or: [{ username }, { email }],
            });
            if (existingUser && String(existingUser._id) !== String(user._id)) {
                return res
                    .status(400)
                    .json({ message: "Username or email already exists" });
            }
        }

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
        const profile = await Profile.findOne({
            userId: user._id,
        }).populate(
            "userId",
            "name email username profilePicture backgroundPicture isOnline lastSeen"
        );
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        return res.json({ profile });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateProfileData = async (req, res) => {
    try {
        const { token, ...newProfileData } = req.body;
        const userProfile = await User.findOne({ token: token });
        if (!userProfile)
            return res.status(404).json({ message: "User not found" });
        const profile_to_update = await Profile.findOne({
            userId: userProfile._id,
        });

        if (newProfileData.skills && !Array.isArray(newProfileData.skills)) {
            newProfileData.skills = [newProfileData.skills];
        }

        Object.assign(profile_to_update, newProfileData);
        await profile_to_update.save();
        return res.json({
            message: "Profile Updated",
            profile: profile_to_update,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
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

export const downloadProfile = async (req, res) => {
    try {
        const user_id = req.query.id;
        if (!user_id) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const userProfile = await Profile.findOne({ userId: user_id }).populate(
            "userId",
            "name username email profilePicture"
        );

        if (!userProfile) {
            return res.status(404).json({ message: "Profile not found." });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${userProfile.userId.username}_resume.pdf"`
        );

        doc.pipe(res);

        // --- Header Section ---
        // Name
        doc.font("Helvetica-Bold")
            .fontSize(24)
            .text(userProfile.userId.name, { align: "left" });

        // Contact Info Line
        doc.font("Helvetica")
            .fontSize(10)
            .text(
                `Email: ${userProfile.userId.email} | LinkedIn: linkedin.com/in/${userProfile.userId.username}`,
                { align: "left" }
            );
        doc.moveDown(0.5);

        // Divider Line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // --- Profile Summary / Bio ---
        if (userProfile.bio) {
            doc.font("Helvetica-Bold").fontSize(14).text("Profile Summary");
            doc.font("Helvetica").fontSize(10).text(userProfile.bio, {
                align: "justify",
                indent: 10,
            });
            doc.moveDown(1);
        }

        // --- Skills Section ---
        if (userProfile.skills && userProfile.skills.length > 0) {
            doc.font("Helvetica-Bold").fontSize(14).text("Skills");
            doc.font("Helvetica")
                .fontSize(10)
                .text(userProfile.skills.join(" • "), {
                    indent: 10,
                });
            doc.moveDown(1);
        }

        // --- Experience Section ---
        if (userProfile.pastWork && userProfile.pastWork.length > 0) {
            doc.font("Helvetica-Bold").fontSize(14).text("Work Experience");
            doc.moveDown(0.5);

            userProfile.pastWork.forEach((work) => {
                // Company & Years
                doc.font("Helvetica-Bold")
                    .fontSize(12)
                    .text(work.company || "Company Name", { continued: true });
                doc.font("Helvetica")
                    .fontSize(10)
                    .text(`  (${work.years || "0"} years)`, { align: "right" });

                // Position
                doc.font("Helvetica-Oblique")
                    .fontSize(11)
                    .text(work.position || "Position", { indent: 10 });

                doc.moveDown(0.5);
            });
            doc.moveDown(0.5);
        }

        // --- Education Section ---
        if (userProfile.education && userProfile.education.length > 0) {
            doc.font("Helvetica-Bold").fontSize(14).text("Education");
            doc.moveDown(0.5);

            userProfile.education.forEach((edu) => {
                // School
                doc.font("Helvetica-Bold")
                    .fontSize(12)
                    .text(edu.school || "School Name");

                // Degree & Field
                const degreeText = edu.degree ? `${edu.degree}` : "";
                const fieldText = edu.fieldOfStudy
                    ? ` in ${edu.fieldOfStudy}`
                    : "";
                doc.font("Helvetica")
                    .fontSize(11)
                    .text(`${degreeText}${fieldText}`, { indent: 10 });

                doc.moveDown(0.5);
            });
        }

        // Footer
        doc.fontSize(8).text(
            "Generated by ProConnect",
            50,
            doc.page.height - 50,
            { align: "center", color: "grey" }
        );

        doc.end();
    } catch (error) {
        console.error("Error in downloadProfile:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate PDF." });
        }
    }
};

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
        return res.json(connections);
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

        if (!connection) {
            return res.status(404).json({ message: "Connection not found" });
        }

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
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
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

        if (!userProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        // Get the actual list of accepted connections
        const connections = await ConnectionRequest.find({
            $or: [
                { userId: user._id, status_accepted: true },
                { connectionId: user._id, status_accepted: true },
            ],
        }).populate("userId connectionId", "name username profilePicture");

        // Clean up list: Filter out the profile user to show only the "friend"
        const connectionList = connections.map((conn) => {
            if (conn.userId._id.toString() === user._id.toString()) {
                return conn.connectionId;
            }
            return conn.userId;
        });

        const profileData = userProfile.toObject();
        profileData.connectionCount = connectionList.length;
        profileData.connectionList = connectionList; // Send the list to frontend

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
        if (!user) {
            return res.status(200).json({
                message: "If that email exists, a reset link has been sent.",
            });
        }

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        console.log(`[MOCK EMAIL] Password reset requested for: ${email}`);
        console.log(
            `[MOCK EMAIL] Reset Link: ${frontendUrl}/reset-password?email=${email}`
        );

        return res.status(200).json({
            message: "Reset link sent! (Check server console for mock link)",
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
