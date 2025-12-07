import React, { useState } from "react";
import { Check, Layout } from "lucide-react";
import styles from "@/styles/ResumeBuilder.module.css";

const TemplateSelector = ({ selectedTemplate, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const templates = [
        {
            id: "classic",
            name: "Classic",
            preview: "Clean, traditional format.",
        },
        {
            id: "modern",
            name: "Modern",
            preview: "Sleek with strategic color.",
        },
        {
            id: "minimal-image",
            name: "Minimal Image",
            preview: "Minimal with photo.",
        },
        {
            id: "minimal",
            name: "Minimal",
            preview: "Text-focused clean design.",
        },
    ];

    return (
        <div className={styles.dropdownContainer}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${styles.dropdownTrigger} ${styles.btnTemplate}`}
            >
                <Layout size={14} /> <span>Template</span>
            </button>
            {isOpen && (
                <div className={styles.dropdownMenu}>
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => {
                                onChange(template.id);
                                setIsOpen(false);
                            }}
                            className={`${styles.dropdownItem} ${
                                selectedTemplate === template.id
                                    ? styles.selected
                                    : ""
                            }`}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <h4
                                    style={{
                                        margin: 0,
                                        color: "var(--text-primary)",
                                        fontSize: "0.9rem",
                                    }}
                                >
                                    {template.name}
                                </h4>
                                {selectedTemplate === template.id && (
                                    <div
                                        style={{
                                            width: 20,
                                            height: 20,
                                            background: "var(--neon-blue)",
                                            borderRadius: "50%",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Check size={12} color="white" />
                                    </div>
                                )}
                            </div>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: "0.75rem",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                {template.preview}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TemplateSelector;
