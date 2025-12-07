import React from "react";
import { Plus, Trash2 } from "lucide-react";
import styles from "@/styles/ResumeBuilder.module.css";

const ProjectForm = ({ data, onChange }) => {
    const addProject = () => {
        onChange([...data, { name: "", type: "", description: "" }]);
    };

    const removeProject = (index) =>
        onChange(data.filter((_, i) => i !== index));

    const updateProject = (index, field, value) => {
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
                    <h3 className={styles.sectionTitle}>Projects</h3>
                    <p className={styles.sectionDesc}>Showcase your work</p>
                </div>
                <button
                    onClick={addProject}
                    className={styles.navBtn}
                    style={{
                        color: "var(--neon-teal)",
                        borderColor: "var(--neon-teal)",
                    }}
                >
                    <Plus size={14} /> Add Project
                </button>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                {data.map((project, index) => (
                    <div key={index} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitleText}>
                                Project #{index + 1}
                            </span>
                            <button
                                onClick={() => removeProject(index)}
                                className={styles.deleteBtn}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className={styles.inputGroup}>
                            <input
                                value={project.name || ""}
                                onChange={(e) =>
                                    updateProject(index, "name", e.target.value)
                                }
                                type="text"
                                placeholder="Project Name"
                                className={styles.input}
                            />
                            <input
                                value={project.type || ""}
                                onChange={(e) =>
                                    updateProject(index, "type", e.target.value)
                                }
                                type="text"
                                placeholder="Tech Stack / Type"
                                className={styles.input}
                            />
                            <textarea
                                value={project.description || ""}
                                onChange={(e) =>
                                    updateProject(
                                        index,
                                        "description",
                                        e.target.value
                                    )
                                }
                                rows={4}
                                className={styles.textarea}
                                placeholder="Describe your project..."
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectForm;
