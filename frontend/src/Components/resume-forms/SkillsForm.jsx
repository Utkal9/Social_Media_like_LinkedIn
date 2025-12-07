import React, { useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import styles from "@/styles/ResumeBuilder.module.css";

const SkillsForm = ({ data, onChange }) => {
    const [newSkill, setNewSkill] = useState("");

    const addSkill = () => {
        if (newSkill.trim() && !data.includes(newSkill.trim())) {
            onChange([...data, newSkill.trim()]);
            setNewSkill("");
        }
    };

    const removeSkill = (index) => onChange(data.filter((_, i) => i !== index));

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addSkill();
        }
    };

    return (
        <div className={styles.formSection}>
            <div style={{ marginBottom: "15px" }}>
                <h3 className={styles.sectionTitle}>Skills</h3>
                <p className={styles.sectionDesc}>
                    Add technical and soft skills
                </p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <input
                    type="text"
                    placeholder="Enter a skill (e.g. React)"
                    className={styles.input}
                    style={{ flex: 1 }}
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
                <button
                    onClick={addSkill}
                    disabled={!newSkill.trim()}
                    className={styles.navBtn}
                    style={{
                        background: "var(--neon-blue)",
                        color: "#fff",
                        border: "none",
                    }}
                >
                    <Plus size={14} /> Add
                </button>
            </div>

            {data.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {data.map((skill, index) => (
                        <div key={index} className={styles.skillTag}>
                            {skill}
                            <button
                                onClick={() => removeSkill(index)}
                                className={styles.removeTagBtn}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        textAlign: "center",
                        padding: "30px",
                        color: "var(--text-secondary)",
                    }}
                >
                    <Sparkles
                        size={32}
                        style={{ margin: "0 auto 10px", opacity: 0.3 }}
                    />
                    <p>No skills added yet.</p>
                </div>
            )}
        </div>
    );
};

export default SkillsForm;
