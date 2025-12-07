import React, { useState } from "react";
import { Check, Palette } from "lucide-react";
import styles from "@/styles/ResumeBuilder.module.css";

const ColorPicker = ({ selectedColor, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const colors = [
        { name: "Blue", value: "#3B82F6" },
        { name: "Indigo", value: "#6366F1" },
        { name: "Purple", value: "#8B5CF6" },
        { name: "Green", value: "#10B981" },
        { name: "Red", value: "#EF4444" },
        { name: "Orange", value: "#F97316" },
        { name: "Teal", value: "#14B8A6" },
        { name: "Pink", value: "#EC4899" },
        { name: "Gray", value: "#6B7280" },
        { name: "Black", value: "#1F2937" },
    ];

    return (
        <div className={styles.dropdownContainer}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${styles.dropdownTrigger} ${styles.btnColor}`}
            >
                <Palette size={14} /> <span>Accent</span>
            </button>
            {isOpen && (
                <div className={styles.dropdownMenu}>
                    <div className={styles.colorGrid}>
                        {colors.map((color) => (
                            <div
                                key={color.value}
                                className={styles.colorOption}
                                onClick={() => {
                                    onChange(color.value);
                                    setIsOpen(false);
                                }}
                            >
                                <div
                                    className={styles.colorCircle}
                                    style={{ backgroundColor: color.value }}
                                >
                                    {selectedColor === color.value && (
                                        <Check size={16} color="white" />
                                    )}
                                </div>
                                <span
                                    style={{
                                        fontSize: "0.7rem",
                                        color: "var(--text-secondary)",
                                        marginTop: "4px",
                                    }}
                                >
                                    {color.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorPicker;
