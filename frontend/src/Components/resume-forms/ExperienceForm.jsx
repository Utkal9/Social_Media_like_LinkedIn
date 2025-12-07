import React, { useState } from "react";
import { Briefcase, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import clientServer from "@/config";
import toast from "react-hot-toast";
import styles from "@/styles/ResumeBuilder.module.css";

const ExperienceForm = ({ data, onChange }) => {
    const [generatingIndex, setGeneratingIndex] = useState(-1);

    // ... addExperience, removeExperience, updateExperience logic remains same ...
    const addExperience = () =>
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
    const removeExperience = (index) =>
        onChange(data.filter((_, i) => i !== index));
    const updateExperience = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const generateDescription = async (index) => {
        setGeneratingIndex(index);
        const experience = data[index];
        const prompt = `enhance this job description ${experience.description} for the position of ${experience.position} at ${experience.company}.`;
        const token = localStorage.getItem("token");

        try {
            // EXACT LOGIC: Using specific endpoint
            const { data: resData } = await clientServer.post(
                "/resume/ai/enhance-job",
                { userContent: prompt },
                { headers: { Authorization: token } }
            );
            updateExperience(index, "description", resData.enhancedContent);
            toast.success("Description enhanced!");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setGeneratingIndex(-1);
        }
    };

    return (
        <div className={styles.formSection}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                }}
            >
                <div>
                    <h3 className={styles.sectionTitle}>
                        Professional Experience
                    </h3>
                    <p className={styles.sectionDesc}>
                        Add your job experience
                    </p>
                </div>
                <button
                    onClick={addExperience}
                    className={styles.navBtn}
                    style={{
                        color: "var(--neon-teal)",
                        borderColor: "var(--neon-teal)",
                    }}
                >
                    <Plus size={14} /> Add Experience
                </button>
            </div>

            {data.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--text-secondary)",
                    }}
                >
                    <Briefcase
                        size={40}
                        style={{ margin: "0 auto 10px", opacity: 0.5 }}
                    />
                    <p>No work experience added yet.</p>
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                    }}
                >
                    {data.map((experience, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitleText}>
                                    Experience #{index + 1}
                                </span>
                                <button
                                    onClick={() => removeExperience(index)}
                                    className={styles.deleteBtn}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className={styles.grid2}>
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
                                    className={styles.input}
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
                                    className={styles.input}
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
                                    className={styles.input}
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
                                    className={styles.input}
                                    style={{
                                        opacity: experience.is_current
                                            ? 0.5
                                            : 1,
                                    }}
                                />
                            </div>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontSize: "0.9rem",
                                    color: "var(--text-primary)",
                                }}
                            >
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
                                    style={{ accentColor: "var(--neon-teal)" }}
                                />
                                Currently working here
                            </label>
                            <div className={styles.inputGroup}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <label className={styles.label}>
                                        Description
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
                                        className={styles.aiBtn}
                                    >
                                        {generatingIndex === index ? (
                                            <Loader2
                                                size={12}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Sparkles size={12} />
                                        )}{" "}
                                        Enhance
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
                                    className={styles.textarea}
                                    placeholder="Describe responsibilities..."
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
