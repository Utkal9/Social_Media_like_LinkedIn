import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import ConnectionRequest from "../models/connections.model.js";
import request from "request";
import { v2 as cloudinary } from "cloudinary";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
    HeadingLevel,
    TabStopType,
    ExternalHyperlink, // <--- ADDED THIS
} from "docx";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// --- Helper: Send Email ---
const sendEmail = async (options) => {
    const apiKey = process.env.BREVO_API_KEY;
    // --- DEBUG LOG (Remove after fixing) ---
    console.log("DEBUG: API Key Loaded?", apiKey ? "YES" : "NO");
    if (apiKey)
        console.log("DEBUG: Key starts with:", apiKey.substring(0, 10) + "...");
    // --------------------------------------
    const senderEmail = process.env.EMAIL_USER;

    if (!apiKey || !senderEmail) {
        console.error(
            "❌ Missing Brevo API Key or Sender Email in Environment Variables"
        );
        throw new Error("Email service not configured.");
    }

    try {
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: { name: "LinkUps Security", email: senderEmail },
                to: [{ email: options.email }],
                subject: options.subject,
                htmlContent: options.html,
                textContent: options.message,
            },
            {
                headers: {
                    "api-key": apiKey,
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
            }
        );
        console.log("✅ Email sent successfully via Brevo.");
    } catch (error) {
        console.error("❌ Email Error:", error.response?.data || error.message);
        throw new Error("Failed to send email.");
    }
};

// --- HELPER: Smart Bullet Points ---
const createSmartBullets = (text) => {
    if (!text) return [];

    let points = [];
    if (text.includes("\n")) {
        points = text
            .split("\n")
            .map((line) => line.trim())
            .filter((l) => l.length > 0);
    } else {
        points = text
            .split(". ")
            .map((s) => s.trim())
            .filter((s) => s.length > 2);
    }

    return points.map(
        (point) =>
            new Paragraph({
                text: point.endsWith(".") ? point : point + ".",
                bullet: { level: 0 },
                style: "Normal",
                spacing: { after: 0 },
            })
    );
};

// --- HELPER: Clean URL ---
const cleanUrl = (url) => {
    if (!url) return "";
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
};

// --- HELPER: Create Section Header (Left Aligned + Bottom Line) ---
const createSectionHeader = (title) => {
    return new Paragraph({
        alignment: AlignmentType.LEFT,
        border: {
            bottom: {
                color: "BFBFBF", // Subtle Grey Line
                space: 1, // Space between text and line
                style: BorderStyle.SINGLE,
                size: 6, // Thin line
            },
        },
        spacing: { before: 200, after: 100 }, // Nice spacing around header
        children: [
            new TextRun({
                text: title,
                font: "Arial",
                size: 22, // 11pt
                bold: true,
                smallCaps: true, // Advanced Small Caps look
                color: "2E74B5", // Dark Blue/Purple accent
            }),
        ],
    });
};
// --- Updated Helper: Delete File from Cloudinary ---
const deleteFromCloudinary = async (url) => {
    if (!url) return;

    // 1. Guard clause: Do not delete default assets
    if (
        url.includes("default_dlizpg") ||
        url.includes("3d-rendering-hexagonal")
    ) {
        return;
    }

    try {
        // 2. Regex to extract the Public ID
        // It looks for the segment after '/upload/' (ignoring optional version 'v123/')
        // and captures everything up to the file extension.
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
        const match = url.match(regex);

        if (match && match[1]) {
            const publicId = match[1]; // e.g., "pro-connect-uploads/my_image"

            // 3. Detect Resource Type
            const resourceType = url.includes("/video/") ? "video" : "image";

            // 4. Perform Deletion
            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
            });

            console.log(`🗑️ Cloudinary Delete: ${publicId} ->`, result);
        } else {
            console.warn(`⚠️ Could not extract Public ID from URL: ${url}`);
        }
    } catch (error) {
        console.error("❌ Cloudinary Deletion Error:", error);
    }
};
// ================= EXISTING LOGIC STARTS HERE ================= //

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
        if (user.profilePicture) {
            await deleteFromCloudinary(user.profilePicture);
        }
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
        if (user.backgroundPicture) {
            await deleteFromCloudinary(user.backgroundPicture);
        }
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

// ================= ENHANCED RESUME BUILDER (.docx) ================= //

export const downloadProfile = async (req, res) => {
    try {
        const user_id = req.query.id;
        if (!user_id)
            return res.status(400).json({ message: "User ID required" });

        const userProfile = await Profile.findOne({ userId: user_id }).populate(
            "userId"
        );
        if (!userProfile)
            return res.status(404).json({ message: "Profile not found" });

        const user = userProfile.userId;

        // --- DOCUMENT CONFIGURATION ---
        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: "Arial",
                            size: 20, // 10pt
                            color: "000000",
                        },
                        paragraph: {
                            spacing: { after: 40 },
                        },
                    },
                },
            },
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: 500,
                                right: 500,
                                bottom: 500,
                                left: 500,
                            },
                        },
                    },
                    children: [
                        // --- 1. NAME ---
                        new Paragraph({
                            text: user.name,
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.LEFT,
                            spacing: { after: 50 },
                            run: {
                                font: "Arial",
                                size: 36, // 18pt
                                bold: true,
                                color: "2E74B5", // Dark Blue/Purple
                            },
                        }),

                        // --- 2. CONTACT INFO (Header Table) ---
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                                insideVertical: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE },
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        // Links
                                        new TableCell({
                                            width: {
                                                size: 60,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            children: [
                                                new Paragraph({
                                                    text: userProfile.linkedin
                                                        ? `LinkedIn: ${cleanUrl(
                                                              userProfile.linkedin
                                                          )}`
                                                        : "",
                                                }),
                                                new Paragraph({
                                                    text: userProfile.github
                                                        ? `GitHub: ${cleanUrl(
                                                              userProfile.github
                                                          )}`
                                                        : "",
                                                }),
                                                new Paragraph({
                                                    text: userProfile.leetcode
                                                        ? `LeetCode: ${cleanUrl(
                                                              userProfile.leetcode
                                                          )}`
                                                        : "",
                                                }),
                                            ],
                                        }),
                                        // Contact Details
                                        new TableCell({
                                            width: {
                                                size: 40,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            verticalAlign: AlignmentType.TOP,
                                            children: [
                                                new Paragraph({
                                                    text: `Email: ${user.email}`,
                                                    alignment:
                                                        AlignmentType.RIGHT,
                                                }),
                                                new Paragraph({
                                                    text: `Mobile: ${userProfile.phoneNumber}`,
                                                    alignment:
                                                        AlignmentType.RIGHT,
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        new Paragraph({ text: "" }),

                        // --- 3. SKILLS SECTION ---
                        createSectionHeader("SKILLS"),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.NONE },
                                bottom: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                                insideVertical: { style: BorderStyle.NONE },
                                insideHorizontal: { style: BorderStyle.NONE },
                            },
                            rows: [
                                userProfile.skillLanguages &&
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                width: {
                                                    size: 25,
                                                    type: WidthType.PERCENTAGE,
                                                },
                                                children: [
                                                    new Paragraph({
                                                        text: "Languages:",
                                                        bold: true,
                                                    }),
                                                ],
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph(
                                                        userProfile.skillLanguages
                                                    ),
                                                ],
                                            }),
                                        ],
                                    }),
                                userProfile.skillCloudDevOps &&
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        text: "Cloud & DevOps:",
                                                        bold: true,
                                                    }),
                                                ],
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph(
                                                        userProfile.skillCloudDevOps
                                                    ),
                                                ],
                                            }),
                                        ],
                                    }),
                                userProfile.skillFrameworks &&
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        text: "Frameworks:",
                                                        bold: true,
                                                    }),
                                                ],
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph(
                                                        userProfile.skillFrameworks
                                                    ),
                                                ],
                                            }),
                                        ],
                                    }),
                                userProfile.skillTools &&
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        text: "Tools/Platforms:",
                                                        bold: true,
                                                    }),
                                                ],
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph(
                                                        userProfile.skillTools
                                                    ),
                                                ],
                                            }),
                                        ],
                                    }),
                                userProfile.skillSoft &&
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        text: "Soft Skills:",
                                                        bold: true,
                                                    }),
                                                ],
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph(
                                                        userProfile.skillSoft
                                                    ),
                                                ],
                                            }),
                                        ],
                                    }),
                            ].filter(Boolean),
                        }),

                        // --- 4. EXPERIENCE SECTION (Moved Up) ---
                        ...(userProfile.pastWork.length > 0
                            ? [
                                  createSectionHeader("EXPERIENCE"),
                                  ...userProfile.pastWork.flatMap((work) => [
                                      new Paragraph({
                                          children: [
                                              new TextRun({
                                                  text: work.company,
                                                  bold: true,
                                                  size: 22,
                                              }),
                                              new TextRun({
                                                  text: `\t${work.years}`,
                                              }),
                                          ],
                                          tabStops: [
                                              {
                                                  type: TabStopType.RIGHT,
                                                  position: 10500,
                                              },
                                          ],
                                          spacing: { after: 0 },
                                      }),
                                      new Paragraph({
                                          text: work.position,
                                          italics: true,
                                          spacing: { after: 0 },
                                      }),
                                      ...createSmartBullets(work.description),
                                  ]),
                              ]
                            : []),

                        // --- 5. PROJECTS SECTION ---
                        ...(userProfile.projects.length > 0
                            ? [
                                  createSectionHeader("PROJECTS"),
                                  ...userProfile.projects.flatMap((proj) => [
                                      new Paragraph({
                                          children: [
                                              new TextRun({
                                                  text: proj.title,
                                                  bold: true,
                                                  size: 22,
                                              }),
                                              // --- Hyperlink Logic: "Link" Word ---
                                              ...(proj.link
                                                  ? [
                                                        new TextRun({
                                                            text: "  :  ",
                                                        }), // Separator
                                                        new ExternalHyperlink({
                                                            children: [
                                                                new TextRun({
                                                                    text: "Link",
                                                                    style: "Hyperlink",
                                                                    color: "0563C1",
                                                                    underline: true,
                                                                    bold: true,
                                                                }),
                                                            ],
                                                            link: proj.link,
                                                        }),
                                                    ]
                                                  : []),
                                              new TextRun({
                                                  text: `\t${
                                                      proj.duration || ""
                                                  }`,
                                                  size: 20,
                                              }),
                                          ],
                                          tabStops: [
                                              {
                                                  type: TabStopType.RIGHT,
                                                  position: 10500,
                                              },
                                          ],
                                          spacing: { after: 0 },
                                      }),
                                      ...createSmartBullets(proj.description),
                                  ]),
                              ]
                            : []),

                        // --- 6. CERTIFICATES SECTION ---
                        ...(userProfile.certificates.length > 0
                            ? [
                                  createSectionHeader("CERTIFICATES"),
                                  ...userProfile.certificates.flatMap(
                                      (cert) => [
                                          new Paragraph({
                                              children: [
                                                  new TextRun({
                                                      text: cert.name,
                                                      bold: true,
                                                  }),
                                                  ...(cert.link
                                                      ? [
                                                            new TextRun({
                                                                text: "  :  ",
                                                            }),
                                                            new ExternalHyperlink(
                                                                {
                                                                    children: [
                                                                        new TextRun(
                                                                            {
                                                                                text: "Link",
                                                                                style: "Hyperlink",
                                                                                color: "0563C1",
                                                                                underline: true,
                                                                                bold: true,
                                                                            }
                                                                        ),
                                                                    ],
                                                                    link: cert.link,
                                                                }
                                                            ),
                                                        ]
                                                      : []),
                                                  new TextRun({
                                                      text: `\t${
                                                          cert.date || ""
                                                      }`,
                                                  }),
                                              ],
                                              tabStops: [
                                                  {
                                                      type: TabStopType.RIGHT,
                                                      position: 10500,
                                                  },
                                              ],
                                              spacing: { after: 0 },
                                          }),
                                      ]
                                  ),
                              ]
                            : []),

                        // --- 7. ACHIEVEMENTS SECTION ---
                        ...(userProfile.achievements.length > 0
                            ? [
                                  createSectionHeader("ACHIEVEMENTS"),
                                  ...userProfile.achievements.flatMap((ach) => [
                                      new Paragraph({
                                          children: [
                                              new TextRun({
                                                  text: ach.title + ":",
                                                  bold: true,
                                              }),
                                              new TextRun({
                                                  text: `\t${ach.date || ""}`,
                                              }),
                                          ],
                                          tabStops: [
                                              {
                                                  type: TabStopType.RIGHT,
                                                  position: 10500,
                                              },
                                          ],
                                          spacing: { after: 0 },
                                      }),
                                      ...createSmartBullets(ach.description),
                                  ]),
                              ]
                            : []),

                        // --- 8. EDUCATION SECTION ---
                        ...(userProfile.education.length > 0
                            ? [
                                  createSectionHeader("EDUCATION"),
                                  ...userProfile.education.flatMap((edu) => [
                                      new Paragraph({
                                          children: [
                                              new TextRun({
                                                  text: edu.school,
                                                  bold: true,
                                                  size: 22,
                                              }),
                                              new TextRun({
                                                  text: `\t${
                                                      edu.location || ""
                                                  }`,
                                                  bold: true,
                                              }),
                                          ],
                                          tabStops: [
                                              {
                                                  type: TabStopType.RIGHT,
                                                  position: 10500,
                                              },
                                          ],
                                          spacing: { after: 0 },
                                      }),
                                      new Paragraph({
                                          children: [
                                              new TextRun({
                                                  text: `${edu.degree} ${
                                                      edu.grade
                                                          ? "| " + edu.grade
                                                          : ""
                                                  }`,
                                              }),
                                              new TextRun({
                                                  text: `\t${edu.years}`,
                                              }),
                                          ],
                                          tabStops: [
                                              {
                                                  type: TabStopType.RIGHT,
                                                  position: 10500,
                                              },
                                          ],
                                          spacing: { after: 80 },
                                      }),
                                  ]),
                              ]
                            : []),
                    ],
                },
            ],
        });

        const buffer = await Packer.toBuffer(doc);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${user.username}_resume.docx`
        );
        res.send(buffer);
    } catch (error) {
        console.error("Error generating DOCX:", error);
        res.status(500).json({ message: "Failed to generate Resume" });
    }
};

// ================= EXISTING LOGIC CONTINUES ================= //

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

// backend/controllers/user.controller.js

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

        // --- FIX START: Handle deleted users safely ---
        const connectionList = connections
            .map((conn) => {
                // If a user was deleted, populate returns null. We must check for this.
                if (!conn.userId || !conn.connectionId) {
                    return null;
                }

                if (conn.userId._id.toString() === user._id.toString()) {
                    return conn.connectionId;
                }
                return conn.userId;
            })
            .filter((conn) => conn !== null); // Remove the null entries
        // --- FIX END ---

        const profileData = userProfile.toObject();
        profileData.connectionCount = connectionList.length;
        profileData.connectionList = connectionList;

        return res.json({ profile: profileData });
    } catch (error) {
        console.error("Error fetching profile:", error); // Log error to server console
        return res.status(500).json({ message: error.message });
    }
};

// --- 2. FORGOT PASSWORD (Request Link) ---
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate Token
        const resetToken = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");
        user.resetPasswordExpires = Date.now() + 3600000; // 1 Hour
        await user.save();

        // --- DYNAMIC URL GENERATION ---
        // If running locally, this uses http://localhost:3000
        // If running on Render, this uses https://your-app.onrender.com
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const resetUrl = `${frontendUrl}/reset_password/${resetToken}`;

        const message = `You requested a password reset. Please go to this link: ${resetUrl}`;
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2E74B5;">LinkUps Password Reset</h2>
                <p>You are receiving this because you (or someone else) requested a password reset for your account.</p>
                <p>Please click the button below to complete the process:</p>
                <a href="${resetUrl}" style="background-color: #2E74B5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <p>This link expires in 1 hour.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: "LinkUps Password Reset Token",
                message,
                html: htmlMessage,
            });

            res.status(200).json({ success: true, message: "Email sent" });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({ message: "Email could not be sent" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// --- 3. RESET PASSWORD (Set New Password) ---
export const resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res
                .status(400)
                .json({ message: "Invalid or expired token" });
        }

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);

            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            await user.save();

            return res.status(200).json({
                success: true,
                message: "Password updated successfully",
            });
        } else {
            return res.status(400).json({ message: "Password is required" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
