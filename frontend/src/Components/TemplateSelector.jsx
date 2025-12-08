import { Check, Layout } from "lucide-react";
import React, { useState } from "react";

const TemplateSelector = ({ selectedTemplate, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Added "lpu" to the list
    const templates = [
        { id: "lpu", name: "LPU General CV" },
        { id: "modern", name: "Modern" },
        { id: "classic", name: "Classic" },
        { id: "minimal-image", name: "Minimal Image" },
        { id: "minimal", name: "Minimal" },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-all"
                style={{
                    backgroundColor: "var(--holo-bg)",
                    borderColor: "var(--holo-border)",
                    color: "var(--text-primary)",
                }}
            >
                <Layout
                    className="w-4 h-4"
                    style={{ color: "var(--neon-blue)" }}
                />
                <span className="max-sm:hidden">Template</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        className="absolute top-full left-0 mt-2 w-48 border rounded-lg shadow-xl z-20 p-1"
                        style={{
                            backgroundColor: "var(--holo-panel)",
                            borderColor: "var(--holo-border)",
                        }}
                    >
                        {templates.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    onChange(t.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors`}
                                style={{
                                    backgroundColor:
                                        selectedTemplate === t.id
                                            ? "var(--holo-bg)"
                                            : "transparent",
                                    color:
                                        selectedTemplate === t.id
                                            ? "var(--neon-blue)"
                                            : "var(--text-primary)",
                                }}
                            >
                                {t.name}
                                {selectedTemplate === t.id && (
                                    <Check className="w-3 h-3" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
export default TemplateSelector;
