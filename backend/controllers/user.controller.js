import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import ConnectionRequest from "../models/connections.model.js";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import stream from "stream";
import { v2 as cloudinary } from "cloudinary";
import request from "request";

// --- HELPER: Fetch Image Buffer ---
// We fetch the image BEFORE starting the PDF to prevent Cloudinary timeouts
const fetchImageBuffer = (url) => {
    return new Promise((resolve) => {
        if (!url || !url.startsWith("http")) {
            return resolve(null);
        }
        // Set a timeout of 4 seconds to avoid hanging forever
        request({ url, encoding: null, timeout: 4000 }, (err, res, body) => {
            if (err || res.statusCode !== 200) {
                console.log(
                    "Failed to fetch profile image for PDF:",
                    err?.message
                );
                return resolve(null);
            }
            resolve(body);
        });
    });
};
// --- PDF GENERATOR: Buffer PDF in memory, then upload ---
// const convertUserDataTOPDF = async (userData) => {
//     // 1. Pre-fetch the image buffer
//     const profilePicUrl = userData.userId.profilePicture;
//     const imageBuffer = await fetchImageBuffer(profilePicUrl);

//     // 2. Create a new Promise to buffer the PDF in memory
//     const pdfBuffer = await new Promise((resolve, reject) => {
//         const doc = new PDFDocument();
//         const buffers = [];

//         doc.on("data", buffers.push.bind(buffers));
//         doc.on("end", () => {
//             resolve(Buffer.concat(buffers));
//         });
//         doc.on("error", reject);

//         // --- 3. Build PDF Content ---
//         if (imageBuffer) {
//             try {
//                 doc.image(imageBuffer, {
//                     fit: [100, 100],
//                     align: "center",
//                 });
//                 doc.moveDown();
//             } catch (imgErr) {
//                 console.error("Error embedding image in PDF:", imgErr.message);
//                 return reject(imgErr);
//             }
//         }

//         doc.fontSize(20).text(userData.userId.name || "Name Not Provided", {
//             align: "center",
//         });
//         doc.fontSize(12).text(`@${userData.userId.username || "username"}`, {
//             align: "center",
//         });
//         doc.fontSize(10).text(userData.userId.email || "", {
//             align: "center",
//         });
//         doc.moveDown();

//         doc.fontSize(14).text("About", { underline: true });
//         doc.fontSize(12).text(userData.bio || "No bio provided.");
//         doc.moveDown();

//         doc.fontSize(14).text("Current Position", { underline: true });
//         doc.fontSize(12).text(userData.currentPost || "Not specified.");
//         doc.moveDown();

//         doc.addPage();
//         doc.fontSize(16).text("Work History", { underline: true });
//         doc.moveDown();

//         if (userData.pastWork && userData.pastWork.length > 0) {
//             userData.pastWork.forEach((work) => {
//                 doc.fontSize(14).text(work.company || "Unknown Company", {
//                     bold: true,
//                 });
//                 doc.fontSize(12).text(`Position: ${work.position || "N/A"}`);
//                 doc.fontSize(12).text(`Experience: ${work.years || "0"} years`);
//                 doc.moveDown();
//             });
//         } else {
//             doc.fontSize(12).text("No work history provided.");
//         }

//         // Finalize the PDF
//         doc.end();
//     });

//     // 4. Upload the buffered PDF to Cloudinary
//     return new Promise((resolve, reject) => {
//         const uploadStream = cloudinary.uploader.upload_stream(
//             {
//                 folder: "pro-connect-resumes",
//                 resource_type: "raw",
//                 access_mode: "public",
//                 format: "pdf",
//             },
//             (error, result) => {
//                 if (error) {
//                     console.error("Cloudinary upload error:", error);
//                     return reject(error);
//                 }
//                 resolve(result.secure_url);
//             }
//         );

//         // Write the buffer to the upload stream
//         const bufferStream = new stream.PassThrough();
//         bufferStream.end(pdfBuffer);
//         bufferStream.pipe(uploadStream);
//     });
// };

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

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const newProfilePictureUrl = req.file.path;
        user.profilePicture = newProfilePictureUrl;
        await user.save();

        return res.json({
            message: "Profile picture updated",
            url: newProfilePictureUrl,
        });
    } catch (error) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res
                .status(400)
                .json({ message: "File too large. Max 10MB allowed." });
        }
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
        return res.json({ message: "User Updated" });
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
        }).populate("userId", "name email username profilePicture");
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
        Object.assign(profile_to_update, newProfileData);
        await profile_to_update.save();
        return res.json({ message: "Profile Updated" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getAllUserProfile = async (req, res) => {
    try {
        const profiles = await Profile.find().populate(
            "userId",
            "name username email profilePicture"
        );
        return res.json({ profiles });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ... (keep all your other controller functions like register, login, etc.)

// REPLACE the old downloadProfile function with this one
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

        // --- Start PDF Generation ---
        const doc = new PDFDocument();

        // Set HTTP headers to tell the browser it's a PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${userProfile.userId.username}_resume.pdf"`
        );

        // Pipe the PDF document directly to the response stream
        doc.pipe(res);

        // --- Fetch image (if it exists) ---
        const profilePicUrl = userProfile.userId.profilePicture;
        const imageBuffer = await fetchImageBuffer(profilePicUrl); // We still need your fetchImageBuffer helper

        if (imageBuffer) {
            try {
                doc.image(imageBuffer, {
                    fit: [100, 100],
                    align: "center",
                });
                doc.moveDown();
            } catch (imgErr) {
                console.error("Error embedding image in PDF:", imgErr.message);
                // If image fails, just skip it and continue
            }
        }

        // --- Build PDF Content (same as before) ---
        doc.fontSize(20).text(userProfile.userId.name || "Name Not Provided", {
            align: "center",
        });
        doc.fontSize(12).text(`@${userProfile.userId.username || "username"}`, {
            align: "center",
        });
        doc.fontSize(10).text(userProfile.userId.email || "", {
            align: "center",
        });
        doc.moveDown();

        doc.fontSize(14).text("About", { underline: true });
        doc.fontSize(12).text(userProfile.bio || "No bio provided.");
        doc.moveDown();

        doc.fontSize(14).text("Current Position", { underline: true });
        doc.fontSize(12).text(userProfile.currentPost || "Not specified.");
        doc.moveDown();

        doc.addPage();
        doc.fontSize(16).text("Work History", { underline: true });
        doc.moveDown();

        if (userProfile.pastWork && userProfile.pastWork.length > 0) {
            userProfile.pastWork.forEach((work) => {
                doc.fontSize(14).text(work.company || "Unknown Company", {
                    bold: true,
                });
                doc.fontSize(12).text(`Position: ${work.position || "N/A"}`);
                doc.fontSize(12).text(`Experience: ${work.years || "0"} years`);
                doc.moveDown();
            });
        } else {
            doc.fontSize(12).text("No work history provided.");
        }

        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error("Error in downloadProfile:", error);
        // If an error happens before the stream starts, send JSON
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate PDF." });
        }
    }
};

// ... (keep all your other controller functions)

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
        }).populate("connectionId", "name username email profilePicture");
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
        }).populate("userId", "name username email profilePicture");
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
        const post = await Post.findOne({
            _id: post_id,
        });
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
        }).populate("userId", "name email username profilePicture");
        if (!userProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        return res.json({ profile: userProfile });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
