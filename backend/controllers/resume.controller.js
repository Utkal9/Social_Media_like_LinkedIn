import Resume from "../models/resume.model.js";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
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
    ExternalHyperlink,
} from "docx";

// --- Helper: Delete from Cloudinary ---
const deleteFromCloudinary = async (url) => {
    if (!url || url.includes("default_") || !url.includes("cloudinary")) return;
    try {
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
        const match = url.match(regex);
        if (match && match[1]) {
            await cloudinary.uploader.destroy(match[1]);
        }
    } catch (error) {
        console.error("Cloudinary delete error:", error);
    }
};

// --- 1. Create Resume (With Auto-Fill from Profile) ---
export const createResume = async (req, res) => {
    try {
        const { token, title } = req.body;

        // 1. Get User
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        // 2. Get User's Existing Profile Data
        const userProfile = await Profile.findOne({ userId: user._id });

        // 3. Prepare Data for Resume
        // Start with basic User info
        let personalInfo = {
            full_name: user.name,
            email: user.email,
            image: user.profilePicture,
        };

        let summary = "";
        let experience = [];
        let education = [];
        let projects = [];
        let certificates = [];
        let achievements = [];
        let skills = [];
        let skillCats = {};

        // 4. If Profile exists, populate fields
        if (userProfile) {
            // Personal Info
            personalInfo = {
                ...personalInfo,
                phone: userProfile.phoneNumber || "",
                linkedin: userProfile.linkedin || "",
                github: userProfile.github || "",
                leetcode: userProfile.leetcode || "",
                profession: userProfile.currentPost || "",
                website: "", // Not strictly in profile root
                location: "", // Profile doesn't have root location
            };

            // Summary
            summary = userProfile.bio || "";

            // Experience
            if (userProfile.pastWork && userProfile.pastWork.length > 0) {
                experience = userProfile.pastWork.map((work) => ({
                    company: work.company,
                    position: work.position,
                    description: work.description,
                    // Note: Profile stores duration as string, Resume expects separate dates.
                    // Leaving dates blank for user to fill accurately.
                }));
            }

            // Education
            if (userProfile.education && userProfile.education.length > 0) {
                education = userProfile.education.map((edu) => ({
                    institution: edu.school,
                    degree: edu.degree,
                    field: edu.fieldOfStudy,
                    gpa: edu.grade,
                    location: edu.location,
                }));
            }

            // Projects
            if (userProfile.projects && userProfile.projects.length > 0) {
                projects = userProfile.projects.map((proj) => ({
                    name: proj.title,
                    link: proj.link,
                    description: proj.description,
                    duration: proj.duration,
                }));
            }

            // Certificates
            if (
                userProfile.certificates &&
                userProfile.certificates.length > 0
            ) {
                certificates = userProfile.certificates.map((cert) => ({
                    name: cert.name,
                    link: cert.link,
                    date: cert.date,
                }));
            }

            // Achievements
            if (
                userProfile.achievements &&
                userProfile.achievements.length > 0
            ) {
                achievements = userProfile.achievements.map((ach) => ({
                    title: ach.title,
                    description: ach.description,
                    date: ach.date,
                }));
            }

            // Skills
            skills = userProfile.skills || [];
            skillCats = {
                skillLanguages: userProfile.skillLanguages || "",
                skillCloudDevOps: userProfile.skillCloudDevOps || "",
                skillFrameworks: userProfile.skillFrameworks || "",
                skillTools: userProfile.skillTools || "",
                skillSoft: userProfile.skillSoft || "",
            };
        }

        // 5. Initialize New Resume
        const newResume = new Resume({
            userId: user._id,
            title: title || "Untitled Resume",
            personal_info: personalInfo,
            professional_summary: summary,

            experience: experience,
            education: education,
            project: projects,
            certificates: certificates,
            achievements: achievements,

            skills: skills,
            ...skillCats,
        });

        await newResume.save();
        return res.status(200).json({
            message: "Resume Created",
            resume: newResume,
            resumeId: newResume._id,
        });
    } catch (error) {
        console.error("Create Resume Error:", error);
        return res.status(500).json({ message: error.message });
    }
};

// --- 2. Get All Resumes ---
export const getAllResumes = async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const resumes = await Resume.find({ userId: user._id }).sort({
            updatedAt: -1,
        });
        return res.json({ resumes });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// --- 3. Get Single Resume ---
export const getResumeById = async (req, res) => {
    try {
        const { token, resumeId } = req.query;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const resume = await Resume.findOne({
            _id: resumeId,
            userId: user._id,
        });
        if (!resume)
            return res.status(404).json({ message: "Resume not found" });

        return res.json({ resume });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// --- 4. Delete Resume ---
export const deleteResume = async (req, res) => {
    try {
        const { token, resumeId } = req.body;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const resume = await Resume.findOne({
            _id: resumeId,
            userId: user._id,
        });
        if (!resume)
            return res.status(404).json({ message: "Resume not found" });

        // Optional: Delete custom image if it exists and isn't the profile pic
        if (
            resume.personal_info?.image &&
            resume.personal_info.image !== user.profilePicture
        ) {
            await deleteFromCloudinary(resume.personal_info.image);
        }

        await Resume.deleteOne({ _id: resumeId });
        return res.json({ message: "Resume deleted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// --- 5. Update Resume (Robust) ---
export const updateResume = async (req, res) => {
    try {
        const { token, resumeId, resumeData, removeBackground } = req.body;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        let parsedData =
            typeof resumeData === "string"
                ? JSON.parse(resumeData)
                : resumeData;

        const resume = await Resume.findOne({
            _id: resumeId,
            userId: user._id,
        });
        if (!resume)
            return res.status(404).json({ message: "Resume not found" });

        // Handle Image Upload
        if (req.file) {
            if (
                resume.personal_info?.image &&
                !resume.personal_info.image.includes("default") &&
                !resume.personal_info.image.includes(user.profilePicture)
            ) {
                await deleteFromCloudinary(resume.personal_info.image);
            }
            if (!parsedData.personal_info) parsedData.personal_info = {};
            parsedData.personal_info.image = req.file.path;
        } else if (removeBackground === "yes") {
            if (!parsedData.personal_info) parsedData.personal_info = {};
            parsedData.personal_info.image = "";
        } else {
            // Preserve existing image if not uploading new one
            if (parsedData.personal_info) {
                parsedData.personal_info.image = resume.personal_info?.image;
            }
        }

        parsedData.updatedAt = Date.now();

        // Update fields
        Object.assign(resume, parsedData);

        // Mark complex fields as modified to ensure Mongoose saves them
        resume.markModified("experience");
        resume.markModified("education");
        resume.markModified("project");
        resume.markModified("skills");
        resume.markModified("certificates");
        resume.markModified("achievements");
        resume.markModified("personal_info");

        await resume.save();

        return res.json({ message: "Resume saved", resume });
    } catch (error) {
        console.error("Update Error:", error);
        return res.status(500).json({ message: error.message });
    }
};

// --- 6. Download DOCX (LPU Template Logic) ---
export const downloadResumeDocx = async (req, res) => {
    try {
        const { token, resumeId } = req.query;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const resume = await Resume.findOne({
            _id: resumeId,
            userId: user._id,
        });
        if (!resume)
            return res.status(404).json({ message: "Resume not found" });

        // --- Helpers ---
        const cleanUrl = (url) =>
            url
                ? url.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")
                : "";

        const createHeader = (text) =>
            new Paragraph({
                text: text.toUpperCase(),
                heading: HeadingLevel.HEADING_2,
                border: {
                    bottom: {
                        color: "BFBFBF",
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6,
                    },
                },
                spacing: { before: 200, after: 100 },
                run: { font: "Arial", size: 22, bold: true, color: "2E74B5" }, // 11pt
            });

        const createBullets = (text) => {
            if (!text) return [];
            return text
                .split("\n")
                .filter((line) => line.trim())
                .map(
                    (line) =>
                        new Paragraph({
                            text: line.replace(/^[-•]\s*/, ""),
                            bullet: { level: 0 },
                            spacing: { after: 0, line: 240 },
                            run: { font: "Arial", size: 20 },
                        })
                );
        };

        // --- Document Definition ---
        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: { font: "Arial", size: 20, color: "000000" }, // 10pt
                    },
                },
            },
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: 720,
                                right: 720,
                                bottom: 720,
                                left: 720,
                            },
                        }, // 0.5 inch
                    },
                    children: [
                        // Name
                        new Paragraph({
                            text: resume.personal_info.full_name || "YOUR NAME",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { after: 100 },
                            run: {
                                font: "Arial",
                                size: 44,
                                bold: true,
                                color: "2E74B5",
                            },
                        }),

                        // Contact Table
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
                                        new TableCell({
                                            width: {
                                                size: 60,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            children: [
                                                resume.personal_info.linkedin &&
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({
                                                                text: "LinkedIn: ",
                                                                bold: true,
                                                            }),
                                                            new ExternalHyperlink(
                                                                {
                                                                    children: [
                                                                        new TextRun(
                                                                            {
                                                                                text: cleanUrl(
                                                                                    resume
                                                                                        .personal_info
                                                                                        .linkedin
                                                                                ),
                                                                                style: "Hyperlink",
                                                                                color: "0563C1",
                                                                            }
                                                                        ),
                                                                    ],
                                                                    link: resume
                                                                        .personal_info
                                                                        .linkedin,
                                                                }
                                                            ),
                                                        ],
                                                    }),
                                                resume.personal_info.github &&
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({
                                                                text: "GitHub: ",
                                                                bold: true,
                                                            }),
                                                            new ExternalHyperlink(
                                                                {
                                                                    children: [
                                                                        new TextRun(
                                                                            {
                                                                                text: cleanUrl(
                                                                                    resume
                                                                                        .personal_info
                                                                                        .github
                                                                                ),
                                                                                style: "Hyperlink",
                                                                                color: "0563C1",
                                                                            }
                                                                        ),
                                                                    ],
                                                                    link: resume
                                                                        .personal_info
                                                                        .github,
                                                                }
                                                            ),
                                                        ],
                                                    }),
                                                resume.personal_info.leetcode &&
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({
                                                                text: "LeetCode: ",
                                                                bold: true,
                                                            }),
                                                            new ExternalHyperlink(
                                                                {
                                                                    children: [
                                                                        new TextRun(
                                                                            {
                                                                                text: cleanUrl(
                                                                                    resume
                                                                                        .personal_info
                                                                                        .leetcode
                                                                                ),
                                                                                style: "Hyperlink",
                                                                                color: "0563C1",
                                                                            }
                                                                        ),
                                                                    ],
                                                                    link: resume
                                                                        .personal_info
                                                                        .leetcode,
                                                                }
                                                            ),
                                                        ],
                                                    }),
                                            ].filter(Boolean),
                                        }),
                                        new TableCell({
                                            width: {
                                                size: 40,
                                                type: WidthType.PERCENTAGE,
                                            },
                                            children: [
                                                resume.personal_info.email &&
                                                    new Paragraph({
                                                        alignment:
                                                            AlignmentType.RIGHT,
                                                        children: [
                                                            new TextRun({
                                                                text: "Email: ",
                                                                bold: true,
                                                            }),
                                                            new TextRun(
                                                                resume.personal_info.email
                                                            ),
                                                        ],
                                                    }),
                                                resume.personal_info.phone &&
                                                    new Paragraph({
                                                        alignment:
                                                            AlignmentType.RIGHT,
                                                        children: [
                                                            new TextRun({
                                                                text: "Mobile: ",
                                                                bold: true,
                                                            }),
                                                            new TextRun(
                                                                resume.personal_info.phone
                                                            ),
                                                        ],
                                                    }),
                                            ].filter(Boolean),
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        // Skills
                        createHeader("SKILLS"),
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
                                ["Languages", resume.skillLanguages],
                                ["Cloud & DevOps", resume.skillCloudDevOps],
                                ["Frameworks", resume.skillFrameworks],
                                ["Tools/Platforms", resume.skillTools],
                                ["Soft Skills", resume.skillSoft],
                            ]
                                .filter((row) => row[1])
                                .map(
                                    (row) =>
                                        new TableRow({
                                            children: [
                                                new TableCell({
                                                    width: {
                                                        size: 25,
                                                        type: WidthType.PERCENTAGE,
                                                    },
                                                    children: [
                                                        new Paragraph({
                                                            children: [
                                                                new TextRun({
                                                                    text:
                                                                        row[0] +
                                                                        " :",
                                                                    bold: true,
                                                                }),
                                                            ],
                                                        }),
                                                    ],
                                                }),
                                                new TableCell({
                                                    children: [
                                                        new Paragraph(row[1]),
                                                    ],
                                                }),
                                            ],
                                        })
                                ),
                        }),

                        // Projects
                        ...(resume.project.length > 0
                            ? [
                                  createHeader("PROJECTS"),
                                  ...resume.project.flatMap((proj) => [
                                      new Paragraph({
                                          children: [
                                              new TextRun({
                                                  text: proj.name,
                                                  bold: true,
                                                  size: 22,
                                              }),
                                              ...(proj.link
                                                  ? [
                                                        new TextRun({
                                                            text: "  :  ",
                                                        }),
                                                        new ExternalHyperlink({
                                                            children: [
                                                                new TextRun({
                                                                    text: "Link",
                                                                    style: "Hyperlink",
                                                                    color: "0563C1",
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
                                                  bold: true,
                                              }),
                                          ],
                                          tabStops: [
                                              {
                                                  type: TabStopType.RIGHT,
                                                  position: 10000,
                                              },
                                          ],
                                          spacing: { after: 50 },
                                      }),
                                      ...(proj.live_link
                                          ? [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: "Live Demo: ",
                                                            bold: true,
                                                        }),
                                                        new ExternalHyperlink({
                                                            children: [
                                                                new TextRun({
                                                                    text: "Launch App",
                                                                    style: "Hyperlink",
                                                                    color: "0563C1",
                                                                }),
                                                            ],
                                                            link: proj.live_link,
                                                        }),
                                                    ],
                                                }),
                                            ]
                                          : []),
                                      ...createBullets(proj.description),
                                  ]),
                              ]
                            : []),

                        // Certificates
                        ...(resume.certificates.length > 0
                            ? [
                                  createHeader("CERTIFICATES"),
                                  ...resume.certificates.flatMap((cert) => [
                                      new Paragraph({
                                          children: [
                                              new TextRun({ text: cert.name }),
                                              ...(cert.link
                                                  ? [
                                                        new TextRun(" "),
                                                        new ExternalHyperlink({
                                                            children: [
                                                                new TextRun({
                                                                    text: "Link",
                                                                    style: "Hyperlink",
                                                                    color: "0563C1",
                                                                    bold: true,
                                                                }),
                                                            ],
                                                            link: cert.link,
                                                        }),
                                                    ]
                                                  : []),
                                              new TextRun({
                                                  text: `\t${cert.date || ""}`,
                                              }),
                                          ],
                                          tabStops: [
                                              {
                                                  type: TabStopType.RIGHT,
                                                  position: 10000,
                                              },
                                          ],
                                          spacing: { after: 50 },
                                      }),
                                  ]),
                              ]
                            : []),

                        // Achievements
                        ...(resume.achievements.length > 0
                            ? [
                                  createHeader("ACHIEVEMENTS"),
                                  ...resume.achievements.flatMap((ach) => [
                                      new Paragraph({
                                          children: [
                                              new TextRun({
                                                  text: ach.title + " : ",
                                                  bold: true,
                                              }),
                                              ...(ach.link
                                                  ? [
                                                        new ExternalHyperlink({
                                                            children: [
                                                                new TextRun({
                                                                    text: "Link",
                                                                    style: "Hyperlink",
                                                                    color: "0563C1",
                                                                    bold: true,
                                                                }),
                                                            ],
                                                            link: ach.link,
                                                        }),
                                                    ]
                                                  : []),
                                              new TextRun({
                                                  text: `\t${ach.date || ""}`,
                                              }),
                                          ],
                                          tabStops: [
                                              {
                                                  type: TabStopType.RIGHT,
                                                  position: 10000,
                                              },
                                          ],
                                      }),
                                      new Paragraph({
                                          text: ach.description,
                                          spacing: { after: 100 },
                                      }),
                                  ]),
                              ]
                            : []),

                        // Education
                        ...(resume.education.length > 0
                            ? [
                                  createHeader("EDUCATION"),
                                  ...resume.education.flatMap((edu) => [
                                      new Paragraph({
                                          children: [
                                              new TextRun({
                                                  text: edu.institution,
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
                                                  position: 10000,
                                              },
                                          ],
                                          spacing: { after: 0 },
                                      }),
                                      new Paragraph({
                                          children: [
                                              new TextRun({
                                                  text: `${edu.degree} ${
                                                      edu.field
                                                          ? "- " + edu.field
                                                          : ""
                                                  }`,
                                              }),
                                              ...(edu.gpa
                                                  ? [
                                                        new TextRun({
                                                            text: `; CGPA: ${edu.gpa}`,
                                                        }),
                                                    ]
                                                  : []),
                                              new TextRun({
                                                  text: `\t${
                                                      edu.graduation_date || ""
                                                  }`,
                                              }),
                                          ],
                                          tabStops: [
                                              {
                                                  type: TabStopType.RIGHT,
                                                  position: 10000,
                                              },
                                          ],
                                          spacing: { after: 150 },
                                      }),
                                  ]),
                              ]
                            : []),
                    ],
                },
            ],
        });

        // Send Buffer
        const buffer = await Packer.toBuffer(doc);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${resume.title.replace(/\s+/g, "_")}_CV.docx`
        );
        res.send(buffer);
    } catch (error) {
        console.error("Docx Gen Error:", error);
        res.status(500).json({ message: "Failed to generate DOCX" });
    }
};
