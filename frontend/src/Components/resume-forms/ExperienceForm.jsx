import { Briefcase, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import clientServer from "@/config";
import toast from "react-hot-toast";

const ExperienceForm = ({ data, onChange }) => {
    const { token } = useSelector((state) => state.auth);
    const [generatingIndex, setGeneratingIndex] = useState(-1);

    const addExperience = () => {
        onChange([
            ...data,
            {
                company: "",
                position: "",
                start_date: "",
                end_date: "",
                description: "",
                is_current: false,
            },
        ]);
    };

    const removeExperience = (index) => {
        onChange(data.filter((_, i) => i !== index));
    };

    const updateExperience = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const generateDescription = async (index) => {
        setGeneratingIndex(index);
        const experience = data[index];
        const prompt = `enhance this job description ${experience.description} for the position of ${experience.position} at ${experience.company}.`;
        try {
            const { data: resData } = await clientServer.post(
                "/resume/ai/enhance-job",
                { userContent: prompt },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            updateExperience(index, "description", resData.enhancedContent);
            toast.success("Description enhanced!");
        } catch (error) {
            toast.error("AI generation failed");
        } finally {
            setGeneratingIndex(-1);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h3
                        className="flex items-center gap-2 text-lg font-semibold"
                        style={{ color: "var(--text-primary)" }}
                    >
                        {" "}
                        Professional Experience{" "}
                    </h3>
                    <p
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Add your job experience
                    </p>
                </div>
                <button
                    onClick={addExperience}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors"
                    style={{
                        borderColor: "var(--holo-border)",
                        color: "var(--neon-teal)",
                        backgroundColor: "var(--holo-glass)",
                    }}
                >
                    <Plus className="w-4 h-4" /> Add Experience
                </button>
            </div>

            {data.length === 0 ? (
                <div
                    className="text-center py-12 rounded-lg border-2 border-dashed"
                    style={{
                        borderColor: "var(--holo-border)",
                        backgroundColor: "var(--holo-bg)",
                    }}
                >
                    <Briefcase
                        className="w-12 h-12 mx-auto mb-3"
                        style={{ color: "var(--text-secondary)" }}
                    />
                    <p style={{ color: "var(--text-secondary)" }}>
                        No work experience added yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map((experience, index) => (
                        <div
                            key={index}
                            className="p-5 border rounded-xl shadow-sm transition-shadow"
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
                                    className="p-1 hover:text-red-500 transition-colors"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <input
                                    value={experience.company || ""}
                                    onChange={(e) =>
                                        updateExperience(
                                            index,
                                            "company",
                                            e.target.value
                                        )
                                    }
                                    type="text"
                                    placeholder="Company Name"
                                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2"
                                    style={{
                                        backgroundColor: "var(--holo-bg)",
                                        borderColor: "var(--holo-border)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                                <input
                                    value={experience.position || ""}
                                    onChange={(e) =>
                                        updateExperience(
                                            index,
                                            "position",
                                            e.target.value
                                        )
                                    }
                                    type="text"
                                    placeholder="Job Title"
                                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2"
                                    style={{
                                        backgroundColor: "var(--holo-bg)",
                                        borderColor: "var(--holo-border)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                                <input
                                    value={experience.start_date || ""}
                                    onChange={(e) =>
                                        updateExperience(
                                            index,
                                            "start_date",
                                            e.target.value
                                        )
                                    }
                                    type="month"
                                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2"
                                    style={{
                                        backgroundColor: "var(--holo-bg)",
                                        borderColor: "var(--holo-border)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                                <input
                                    value={experience.end_date || ""}
                                    onChange={(e) =>
                                        updateExperience(
                                            index,
                                            "end_date",
                                            e.target.value
                                        )
                                    }
                                    type="month"
                                    disabled={experience.is_current}
                                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 disabled:opacity-50"
                                    style={{
                                        backgroundColor: "var(--holo-bg)",
                                        borderColor: "var(--holo-border)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                            </div>

                            <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={experience.is_current || false}
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

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label
                                        className="text-sm font-medium"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        Job Description
                                    </label>
                                    <button
                                        onClick={() =>
                                            generateDescription(index)
                                        }
                                        disabled={
                                            generatingIndex === index ||
                                            !experience.position ||
                                            !experience.company
                                        }
                                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium border rounded transition-colors disabled:opacity-50"
                                        style={{
                                            borderColor: "var(--neon-violet)",
                                            color: "var(--neon-violet)",
                                        }}
                                    >
                                        {generatingIndex === index ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-3 h-3" />
                                        )}
                                        Enhance with AI
                                    </button>
                                </div>
                                <textarea
                                    value={experience.description || ""}
                                    onChange={(e) =>
                                        updateExperience(
                                            index,
                                            "description",
                                            e.target.value
                                        )
                                    }
                                    rows={4}
                                    className="w-full text-sm px-3 py-2 border rounded-lg outline-none resize-none"
                                    placeholder="Describe your key responsibilities..."
                                    style={{
                                        backgroundColor: "var(--holo-bg)",
                                        borderColor: "var(--holo-border)",
                                        color: "var(--text-primary)",
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExperienceForm;
