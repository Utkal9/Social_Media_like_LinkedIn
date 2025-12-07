import React from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import styles from "@/styles/ResumeBuilder.module.css";

const EducationForm = ({ data, onChange }) => {
    const addEducation = () => {
        onChange([
            ...data,
            {
                institution: "",
                degree: "",
                field: "",
                graduation_date: "",
                gpa: "",
            },
        ]);
    };

    const removeEducation = (index) =>
        onChange(data.filter((_, i) => i !== index));

    const updateEducation = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
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
                    <h3 className={styles.sectionTitle}>Education</h3>
                    <p className={styles.sectionDesc}>
                        Add your education details
                    </p>
                </div>
                <button
                    onClick={addEducation}
                    className={styles.navBtn}
                    style={{
                        color: "var(--neon-teal)",
                        borderColor: "var(--neon-teal)",
                    }}
                >
                    <Plus size={14} /> Add Education
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
                    <GraduationCap
                        size={40}
                        style={{ margin: "0 auto 10px", opacity: 0.5 }}
                    />
                    <p>No education added yet.</p>
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                    }}
                >
                    {data.map((edu, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitleText}>
                                    Education #{index + 1}
                                </span>
                                <button
                                    onClick={() => removeEducation(index)}
                                    className={styles.deleteBtn}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className={styles.grid2}>
                                <input
                                    value={edu.institution || ""}
                                    onChange={(e) =>
                                        updateEducation(
                                            index,
                                            "institution",
                                            e.target.value
                                        )
                                    }
                                    type="text"
                                    placeholder="Institution Name"
                                    className={styles.input}
                                />
                                <input
                                    value={edu.degree || ""}
                                    onChange={(e) =>
                                        updateEducation(
                                            index,
                                            "degree",
                                            e.target.value
                                        )
                                    }
                                    type="text"
                                    placeholder="Degree"
                                    className={styles.input}
                                />
                                <input
                                    value={edu.field || ""}
                                    onChange={(e) =>
                                        updateEducation(
                                            index,
                                            "field",
                                            e.target.value
                                        )
                                    }
                                    type="text"
                                    placeholder="Field of Study"
                                    className={styles.input}
                                />
                                <input
                                    value={edu.graduation_date || ""}
                                    onChange={(e) =>
                                        updateEducation(
                                            index,
                                            "graduation_date",
                                            e.target.value
                                        )
                                    }
                                    type="month"
                                    className={styles.input}
                                />
                            </div>
                            <input
                                value={edu.gpa || ""}
                                onChange={(e) =>
                                    updateEducation(
                                        index,
                                        "gpa",
                                        e.target.value
                                    )
                                }
                                type="text"
                                placeholder="GPA (optional)"
                                className={styles.input}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EducationForm;
