import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import ConnectionRequest from "../models/connections.model.js";
import request from "request";
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
    TabStopPosition,
} from "docx";

// --- HELPER: Smart Bullet Points ---
// Automatically converts a paragraph of text into a clean list of bullet points
const createSmartBullets = (text) => {
    if (!text) return [];

    let points = [];
    // 1. If user used newlines, split by them
    if (text.includes("\n")) {
        points = text
            .split("\n")
            .map((line) => line.trim())
            .filter((l) => l.length > 0);
    }
    // 2. Fallback: If it's a solid block, split by sentences
    else {
        points = text
            .split(". ")
            .map((s) => s.trim())
            .filter((s) => s.length > 2);
    }

    // Create DOCX Paragraphs for each point
    return points.map(
        (point) =>
            new Paragraph({
                text: point.endsWith(".") ? point : point + ".",
                bullet: { level: 0 }, // Adds the bullet dot
                style: "Normal", // Uses our 10pt font style
                spacing: { after: 0 }, // Tight spacing
            })
    );
};

// --- HELPER: Clean URL ---
// Removes https:// and trailing slashes for a cleaner look on the resume
const cleanUrl = (url) => {
    if (!url) return "";
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
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
                            size: 20, // 10pt (docx size is in half-points, so 20 = 10pt)
                            color: "000000",
                        },
                        paragraph: {
                            spacing: { after: 40 }, // Minimal spacing to keep it 1 page
                        },
                    },
                },
            },
            sections: [
                {
                    properties: {
                        page: {
                            // Narrow margins to fit content on one page
                            margin: {
                                top: 500, // ~0.8cm
                                right: 500,
                                bottom: 500,
                                left: 500,
                            },
                        },
                    },
                    children: [
                        // --- 1. NAME (Left Aligned, Bold, Larger) ---
                        new Paragraph({
                            text: user.name,
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.LEFT,
                            spacing: { after: 100 },
                            run: {
                                font: "Arial",
                                size: 36, // 18pt
                                bold: true,
                                color: "000000",
                            },
                        }),

                        // --- 2. HEADER TABLE (Left: Links, Right: Contact) ---
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
                                        // Left Column (Links)
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
                                        // Right Column (Email/Mobile)
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

                        new Paragraph({ text: "" }), // Spacer

                        // --- 3. SKILLS SECTION ---
                        new Paragraph({
                            text: "SKILLS",
                            spacing: { before: 150, after: 50 },
                            border: {
                                bottom: {
                                    color: "000000",
                                    space: 1,
                                    value: "single",
                                    size: 6,
                                },
                            },
                            run: {
                                font: "Arial",
                                size: 22,
                                bold: true,
                                allCaps: true,
                            }, // 11pt Bold
                        }),
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
                                                    size: 20,
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

                        // --- 4. PROJECTS SECTION ---
                        ...(userProfile.projects.length > 0
                            ? [
                                  new Paragraph({
                                      text: "PROJECTS",
                                      spacing: { before: 150, after: 50 },
                                      border: {
                                          bottom: {
                                              color: "000000",
                                              space: 1,
                                              value: "single",
                                              size: 6,
                                          },
                                      },
                                      run: {
                                          font: "Arial",
                                          size: 22,
                                          bold: true,
                                          allCaps: true,
                                      },
                                  }),
                                  ...userProfile.projects.flatMap((proj) => [
                                      // Title (Left) ......... Date (Right)
                                      new Paragraph({
                                          children: [
                                              new TextRun({
                                                  text: proj.title,
                                                  bold: true,
                                                  size: 22,
                                              }), // 11pt Bold
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
                                          ], // Align right margin
                                          spacing: { after: 0 },
                                      }),
                                      // Link (Next line)
                                      ...(proj.link
                                          ? [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: "Link: ",
                                                            bold: true,
                                                            size: 18,
                                                        }),
                                                        new TextRun({
                                                            text: cleanUrl(
                                                                proj.link
                                                            ),
                                                            color: "0563C1",
                                                            underline: true,
                                                            size: 18,
                                                        }),
                                                    ],
                                                    spacing: { after: 30 },
                                                }),
                                            ]
                                          : []),
                                      // Description Bullets
                                      ...createSmartBullets(proj.description),
                                  ]),
                              ]
                            : []),

                        // --- 5. CERTIFICATES SECTION ---
                        ...(userProfile.certificates.length > 0
                            ? [
                                  new Paragraph({
                                      text: "CERTIFICATES",
                                      spacing: { before: 150, after: 50 },
                                      border: {
                                          bottom: {
                                              color: "000000",
                                              space: 1,
                                              value: "single",
                                              size: 6,
                                          },
                                      },
                                      run: {
                                          font: "Arial",
                                          size: 22,
                                          bold: true,
                                          allCaps: true,
                                      },
                                  }),
                                  ...userProfile.certificates.flatMap(
                                      (cert) => [
                                          new Paragraph({
                                              children: [
                                                  new TextRun({
                                                      text: cert.name,
                                                      bold: true,
                                                  }),
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
                                          ...(cert.link
                                              ? [
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({
                                                                text: "Link: ",
                                                                bold: true,
                                                                size: 18,
                                                            }),
                                                            new TextRun({
                                                                text: cleanUrl(
                                                                    cert.link
                                                                ),
                                                                color: "0563C1",
                                                                underline: true,
                                                                size: 18,
                                                            }),
                                                        ],
                                                        spacing: { after: 50 },
                                                    }),
                                                ]
                                              : []),
                                      ]
                                  ),
                              ]
                            : []),

                        // --- 6. ACHIEVEMENTS SECTION ---
                        ...(userProfile.achievements.length > 0
                            ? [
                                  new Paragraph({
                                      text: "ACHIEVEMENTS",
                                      spacing: { before: 150, after: 50 },
                                      border: {
                                          bottom: {
                                              color: "000000",
                                              space: 1,
                                              value: "single",
                                              size: 6,
                                          },
                                      },
                                      run: {
                                          font: "Arial",
                                          size: 22,
                                          bold: true,
                                          allCaps: true,
                                      },
                                  }),
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

                        // --- 7. EDUCATION SECTION (4-Corner Layout) ---
                        ...(userProfile.education.length > 0
                            ? [
                                  new Paragraph({
                                      text: "EDUCATION",
                                      spacing: { before: 150, after: 50 },
                                      border: {
                                          bottom: {
                                              color: "000000",
                                              space: 1,
                                              value: "single",
                                              size: 6,
                                          },
                                      },
                                      run: {
                                          font: "Arial",
                                          size: 22,
                                          bold: true,
                                          allCaps: true,
                                      },
                                  }),
                                  ...userProfile.education.flatMap((edu) => [
                                      // Line 1: School (Left) ... Location (Right)
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
                                      // Line 2: Degree (Left) ... Years (Right)
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

                        // --- 8. EXPERIENCE SECTION (If any) ---
                        ...(userProfile.pastWork.length > 0
                            ? [
                                  new Paragraph({
                                      text: "EXPERIENCE",
                                      spacing: { before: 150, after: 50 },
                                      border: {
                                          bottom: {
                                              color: "000000",
                                              space: 1,
                                              value: "single",
                                              size: 6,
                                          },
                                      },
                                      run: {
                                          font: "Arial",
                                          size: 22,
                                          bold: true,
                                          allCaps: true,
                                      },
                                  }),
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
                    ],
                },
            ],
        });

        // --- GENERATE & SEND DOCX ---
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
            return res.status(200).json({
                message: "If that email exists, a reset link has been sent.",
            });
        return res.status(200).json({ message: "Reset link sent!" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
