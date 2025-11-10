import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import Connection from "../models/connections.model.js";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import { v2 as cloudinary } from "cloudinary";
import request from "request";
const convertUserDataTOPDF = (userData) => {
    // We return a Promise that resolves with the Cloudinary URL
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();

            // Create an upload stream to Cloudinary
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "pro-connect-resumes",
                    resource_type: "raw", // Treat it as a raw file
                    format: "pdf",
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        return reject(error);
                    }
                    // Resolve with the new, permanent URL
                    resolve(result.secure_url);
                }
            );

            // Pipe the PDF document to the Cloudinary stream
            doc.pipe(uploadStream);

            // --- Build the PDF ---
            const profilePicUrl = userData.userId.profilePicture;

            // This function adds the text, so we can call it after the image loads
            const addTextToDoc = () => {
                doc.fontSize(14).text(`Name: ${userData.userId.name}`);
                doc.fontSize(14).text(`Username: ${userData.userId.username}`);
                doc.fontSize(14).text(`Email: ${userData.userId.email}`);
                doc.fontSize(14).text(`Bio: ${userData.bio || ""}`);
                doc.fontSize(14).text(
                    `Current Position: ${userData.currentPost || ""}`
                );

                doc.addPage(); // Add a new page for work history
                doc.fontSize(14).text("Past Work: ");
                doc.moveDown();

                if (userData.pastWork && userData.pastWork.length > 0) {
                    userData.pastWork.forEach((work) => {
                        doc.fontSize(12).text(
                            `Company Name: ${work.company || ""}`
                        );
                        doc.fontSize(12).text(
                            `Position: ${work.position || ""}`
                        );
                        doc.fontSize(12).text(`Years: ${work.years || ""}`);
                        doc.moveDown();
                    });
                } else {
                    doc.fontSize(12).text("No work history provided.");
                }

                // End the document to trigger the upload stream
                doc.end();
            };

            // Check if the profile picture is a Cloudinary URL (starts with http)
            if (profilePicUrl && profilePicUrl.startsWith("http")) {
                // Fetch image from Cloudinary URL
                request(
                    { url: profilePicUrl, encoding: null },
                    (err, res, body) => {
                        if (err || res.statusCode !== 200) {
                            console.error(
                                "Error fetching image for PDF, continuing without it."
                            );
                            addTextToDoc(); // Add text even if image fails
                        } else {
                            // Embed the fetched image
                            try {
                                doc.image(body, {
                                    align: "center",
                                    width: 100,
                                });
                                doc.moveDown();
                                addTextToDoc(); // Add text after image
                            } catch (imageError) {
                                console.error(
                                    "Error embedding image in PDF:",
                                    imageError
                                );
                                addTextToDoc(); // Continue if image embedding fails
                            }
                        }
                    }
                );
            } else {
                // Fallback for default.jpg or if no image
                console.log(
                    "No profile picture URL found, creating PDF without image."
                );
                addTextToDoc();
            }
        } catch (error) {
            reject(error);
        }
    });
};

export const register = async (req, res) => {
    try {
        const { name, email, password, username } = req.body;
        if (!name || !email || !password || !username)
            return res.status(400).json({ message: "All fields are required" });
        const user = await User.findOne({
            email,
        });
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
        const user = await User.findOne({
            email,
        });
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
    const { token } = req.body;
    try {
        const user = await User.findOne({ token: token });
        if (!user)
            return res.status(404).json({ message: "User does not exist" });

        // --- CHANGED ---
        // We now get the secure Cloudinary URL from req.file.path
        // If no file was uploaded, do nothing
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }
        user.profilePicture = req.file.path;
        // --- CHANGED ---

        await user.save();
        return res.json({ message: "Profile Picture Updated" });
    } catch (error) {
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
            // Make sure we are not conflicting with *another* user
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

// --- UPDATED FUNCTION ---
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

        // This now returns a Cloudinary URL
        let cloudinaryUrl = await convertUserDataTOPDF(userProfile);

        // Return the permanent URL
        return res.json({ message: cloudinaryUrl });
    } catch (error) {
        console.error("Error in downloadProfile:", error);
        // --- BUG FIX --- (Was 5G00)
        return res.status(500).json({ message: "Failed to generate PDF." });
    }
};
// --- NEW CONNECTION FUNCTION: sendConnectionRequest ---
export const sendConnectionRequest = async (req, res) => {
    const { token, connectionId } = req.body; // connectionId is the recipient's ID
    try {
        const user = await User.findOne({ token: token }); // This is the requester
        if (!user) return res.status(404).json({ message: "User not found" });

        const recipient = await User.findOne({ _id: connectionId });
        if (!recipient)
            return res.status(404).json({ message: "Recipient not found" });

        if (user._id.toString() === recipient._id.toString()) {
            return res
                .status(400)
                .json({ message: "You cannot connect with yourself." });
        }

        // Check if a connection exists in EITHER direction
        const existingConnection = await Connection.findOne({
            $or: [
                { requester: user._id, recipient: recipient._id },
                { requester: recipient._id, recipient: user._id },
            ],
        });

        if (existingConnection) {
            if (existingConnection.status === "pending") {
                return res
                    .status(400)
                    .json({ message: "Request already sent or received" });
            } else if (existingConnection.status === "accepted") {
                return res.status(400).json({ message: "Already connected" });
            }
            // If declined, we'll just create a new request, the unique index will catch it
        }

        // Create ONE new connection document
        const request = new Connection({
            requester: user._id,
            recipient: recipient._id,
            status: "pending",
        });

        await request.save();
        return res.json({ message: "Request Sent" });
    } catch (error) {
        // Handle unique constraint error (duplicate request)
        if (error.code === 11000) {
            return res.status(400).json({ message: "Request already sent." });
        }
        return res.status(500).json({ message: error.message });
    }
};

// --- NEW CONNECTION FUNCTION: respondToConnectionRequest ---
export const respondToConnectionRequest = async (req, res) => {
    // requestId is the ID of the *connection document*
    // action_type is "accept" or "decline"
    const { token, requestId, action_type } = req.body;
    try {
        const user = await User.findOne({ token: token }); // This is the recipient
        if (!user) return res.status(404).json({ message: "User not found" });

        const connection = await Connection.findOne({
            _id: requestId,
            recipient: user._id, // IMPORTANT: Only the recipient can respond
            status: "pending", // IMPORTANT: Can only respond to pending requests
        });

        if (!connection) {
            return res
                .status(404)
                .json({ message: "Request not found or already handled" });
        }

        if (action_type === "accept") {
            connection.status = "accepted";
            await connection.save();
            return res.json({ message: "Request Accepted" });
        } else if (action_type === "decline") {
            // We set it to declined instead of deleting, to prevent future requests
            connection.status = "declined";
            await connection.save();
            // Or you can delete it:
            // await Connection.deleteOne({ _id: requestId });
            return res.json({ message: "Request Declined" });
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// --- NEW CONNECTION FUNCTION: getMyNetwork ---
export const getMyNetwork = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const connections = await Connection.find({
            $or: [{ requester: user._id }, { recipient: user._id }],
            status: "accepted",
        })
            .populate("requester", "name username email profilePicture")
            .populate("recipient", "name username email profilePicture");

        // Return the *other* user in the connection
        const network = connections.map((conn) => {
            if (conn.requester._id.toString() === user._id.toString()) {
                return conn.recipient;
            }
            return conn.requester;
        });

        return res.json(network);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// --- NEW CONNECTION FUNCTION: getPendingIncomingRequests ---
export const getPendingIncomingRequests = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const requests = await Connection.find({
            recipient: user._id,
            status: "pending",
        }).populate("requester", "name username email profilePicture"); // Get the sender's info

        return res.json(requests);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// --- NEW CONNECTION FUNCTION: getPendingSentRequests ---
export const getPendingSentRequests = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const requests = await Connection.find({
            requester: user._id,
            status: "pending",
        }).populate("recipient", "name username email profilePicture"); // Get the recipient's info

        return res.json(requests);
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
