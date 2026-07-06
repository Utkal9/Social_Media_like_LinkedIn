import {
    Briefcase,
    Loader2,
    Plus,
    Sparkles,
    Trash2,
    Calendar,
    Minus,
} from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import clientServer from "@/config";
import toast, { Toaster } from "react-hot-toast";

// Helper: normalize description — always return array of strings
const normalizeDesc = (desc) => {
    if (!desc) return [""];
    if (Array.isArray(desc)) return desc.length > 0 ? desc : [""];
    // Legacy: single string with newlines → split into array
    return desc.split("\n").map(l => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean).length > 0
        ? desc.split("\n").map(l => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean)
        : [""];
};

const ExperienceForm = ({ data, onChange, template = "general" }) => {
    const isSpecialized = template === "specialized";
    const { token } = useSelector((state) => state.auth);
    const [generatingIndex, setGeneratingIndex] = useState(-1);

    const addExperience = () =>
        onChange([
            ...data,
            {
                company: "",
                position: "",
                start_date: "",
                end_date: "",
                description: ["", "", ""],
                location: "",
                tech_stack: "",
                cert_link: "",
                is_current: false,
            },
        ]);
    const removeExperience = (index) =>
        onChange(data.filter((_, i) => i !== index));
    const updateExperience = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    // Update a single bullet point
    const updateBullet = (expIndex, bulletIndex, value) => {
        const updated = [...data];
        const bullets = [...normalizeDesc(updated[expIndex].description)];
        bullets[bulletIndex] = value;
        updated[expIndex] = { ...updated[expIndex], description: bullets };
        onChange(updated);
    };

    // Add a bullet point
    const addBullet = (expIndex) => {
        const updated = [...data];
        const bullets = [...normalizeDesc(updated[expIndex].description)];
        if (bullets.length >= 5) return; // max 5 bullets
        bullets.push("");
        updated[expIndex] = { ...updated[expIndex], description: bullets };
        onChange(updated);
    };

    // Remove a bullet point
    const removeBullet = (expIndex, bulletIndex) => {
        const updated = [...data];
        const bullets = [...normalizeDesc(updated[expIndex].description)];
        if (bullets.length <= 1) return; // keep at least 1
        bullets.splice(bulletIndex, 1);
        updated[expIndex] = { ...updated[expIndex], description: bullets };
        onChange(updated);
    };

    const generateDescription = async (index) => {
        setGeneratingIndex(index);
        try {
            const currentDesc = normalizeDesc(data[index].description).filter(Boolean).join(". ");
            const { data: resData } = await clientServer.post(
                "/resume/ai/enhance-job",
                { userContent: `enhance: ${currentDesc}` },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Backend now returns an array of bullet strings
            const enhanced = resData.enhancedContent;
            if (Array.isArray(enhanced) && enhanced.length > 0) {
                updateExperience(index, "description", enhanced.slice(0, 4));
            } else if (typeof enhanced === "string") {
                // Fallback for legacy string response
                const bullets = enhanced
                    .split("\n")
                    .map(s => s.replace(/^[-•*]\s*/, "").trim())
                    .filter(s => s.length > 10)
                    .slice(0, 4);
                if (bullets.length > 0) {
                    updateExperience(index, "description", bullets);
                }
            }
            toast.success("Enhanced!");
        } catch {
            toast.error("AI Failed");
        } finally {
            setGeneratingIndex(-1);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h3
                    className="flex items-center gap-2 text-lg font-semibold"
                    style={{ color: "var(--text-primary)" }}
                >
                    {isSpecialized ? "Internship / Experience" : "Professional Experience"}
                </h3>
                <button
                    onClick={addExperience}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-lg"
                    style={{
                        borderColor: "var(--holo-border)",
                        color: "var(--neon-teal)",
                        backgroundColor: "var(--holo-glass)",
                    }}
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            {data.map((experience, index) => (
                <div
                    key={index}
                    className="p-5 border rounded-xl shadow-sm"
                    style={{
                        backgroundColor: "var(--holo-panel)",
                        borderColor: "var(--holo-border)",
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <h4
                            className="font-medium"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Experience #{index + 1}
                        </h4>
                        <button
                            onClick={() => removeExperience(index)}
                            className="hover:text-red-500"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">

                        {/* ── Specialized: Position first (bold primary line in template) ── */}
                        {isSpecialized && (
                            <input
                                value={experience.position}
                                onChange={(e) => updateExperience(index, "position", e.target.value)}
                                type="text"
                                placeholder="Job Title (e.g. Web Development Intern)"
                                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2"
                                style={{
                                    backgroundColor: "var(--holo-bg)",
                                    borderColor: "var(--holo-border)",
                                    color: "var(--text-primary)",
                                }}
                            />
                        )}

                        <input
                            value={experience.company}
                            onChange={(e) => updateExperience(index, "company", e.target.value)}
                            type="text"
                            placeholder={isSpecialized
                                ? "Company (e.g. Vanillakart (Emvity Brushflicks Creative Hub Pvt. Ltd.))"
                                : "Company"}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />

                        {/* ── General: Position after company ── */}
                        {!isSpecialized && (
                            <input
                                value={experience.position}
                                onChange={(e) => updateExperience(index, "position", e.target.value)}
                                type="text"
                                placeholder="Job Title / Role"
                                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2"
                                style={{
                                    backgroundColor: "var(--holo-bg)",
                                    borderColor: "var(--holo-border)",
                                    color: "var(--text-primary)",
                                }}
                            />
                        )}

                        {/* Location */}
                        <input
                            value={experience.location || ""}
                            onChange={(e) => updateExperience(index, "location", e.target.value)}
                            type="text"
                            placeholder="Location (e.g. Remote / Bhubaneswar)"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 md:col-span-2"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />

                        {/* Tech Stack */}
                        <input
                            value={experience.tech_stack || ""}
                            onChange={(e) =>
                                updateExperience(index, "tech_stack", e.target.value)
                            }
                            type="text"
                            placeholder="Tech Stack (e.g. MERN Stack, WordPress)"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />

                        {/* Certificate Link */}
                        <input
                            value={experience.cert_link || ""}
                            onChange={(e) =>
                                updateExperience(index, "cert_link", e.target.value)
                            }
                            type="url"
                            placeholder="Certificate Link (URL)"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />

                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Start Date"
                                onFocus={(e) => (e.target.type = "month")}
                                onBlur={(e) => {
                                    if (!e.target.value) e.target.type = "text";
                                }}
                                value={experience.start_date}
                                onChange={(e) =>
                                    updateExperience(
                                        index,
                                        "start_date",
                                        e.target.value
                                    )
                                }
                                className="w-full pl-10 py-2 text-sm border rounded-lg focus:ring-2"
                                style={{
                                    backgroundColor: "var(--holo-bg)",
                                    borderColor: "var(--holo-border)",
                                    color: "var(--text-primary)",
                                }}
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="End Date"
                                onFocus={(e) => (e.target.type = "month")}
                                onBlur={(e) => {
                                    if (!e.target.value) e.target.type = "text";
                                }}
                                value={experience.end_date}
                                onChange={(e) =>
                                    updateExperience(
                                        index,
                                        "end_date",
                                        e.target.value
                                    )
                                }
                                disabled={experience.is_current}
                                className="w-full pl-10 py-2 text-sm border rounded-lg focus:ring-2 disabled:opacity-50"
                                style={{
                                    backgroundColor: "var(--holo-bg)",
                                    borderColor: "var(--holo-border)",
                                    color: "var(--text-primary)",
                                }}
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 mb-4 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={experience.is_current}
                            onChange={(e) =>
                                updateExperience(
                                    index,
                                    "is_current",
                                    e.target.checked
                                )
                            }
                            className="w-4 h-4 rounded focus:ring-2"
                        />
                        <span
                            className="text-sm"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Currently working here
                        </span>
                    </label>

                    {/* ── BULLET POINT DESCRIPTION FIELDS ── */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label
                                className="text-sm font-medium"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Description Bullet Points
                            </label>
                            <button
                                onClick={() => generateDescription(index)}
                                disabled={generatingIndex === index}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium border rounded"
                                style={{
                                    borderColor: "var(--neon-violet)",
                                    color: "var(--neon-violet)",
                                }}
                            >
                                {generatingIndex === index ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3" />
                                )}{" "}
                                Enhance
                            </button>
                        </div>

                        {normalizeDesc(experience.description).map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2">
                                <span
                                    className="text-sm font-bold mt-2 flex-shrink-0"
                                    style={{ color: "var(--neon-teal)", width: "18px" }}
                                >
                                    •
                                </span>
                                <input
                                    value={bullet}
                                    onChange={(e) => updateBullet(index, bIdx, e.target.value)}
                                    type="text"
                                    placeholder={`Bullet point ${bIdx + 1} (e.g. Developed a full-stack web app using React and Node.js)`}
                                    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2"
                                    style={{
                                        backgroundColor: "var(--holo-bg)",
                                        borderColor: "var(--holo-border)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                                {normalizeDesc(experience.description).length > 1 && (
                                    <button
                                        onClick={() => removeBullet(index, bIdx)}
                                        className="mt-2 flex-shrink-0 hover:text-red-500 transition-colors"
                                        style={{ color: "var(--text-secondary)" }}
                                        title="Remove bullet"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}

                        {normalizeDesc(experience.description).length < 5 && (
                            <button
                                onClick={() => addBullet(index)}
                                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border transition-colors"
                                style={{
                                    borderColor: "var(--holo-border)",
                                    color: "var(--text-secondary)",
                                    backgroundColor: "var(--holo-glass)",
                                }}
                            >
                                <Plus className="w-3 h-3" /> Add Bullet Point
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
export default ExperienceForm;
