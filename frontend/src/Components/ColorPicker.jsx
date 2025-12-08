import { Check } from "lucide-react";
import React, { useState } from "react";

const ColorPicker = ({ selectedColor, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const colors = [
        { name: "Blue", value: "#3B82F6" },
        { name: "Purple", value: "#8B5CF6" },
        { name: "Green", value: "#10B981" },
        { name: "Red", value: "#EF4444" },
        { name: "Black", value: "#1F2937" },
        { name: "Teal", value: "#14B8A6" },
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
                <div
                    className="w-4 h-4 rounded-full"
                    style={{ background: selectedColor }}
                />
                <span className="max-sm:hidden">Color</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        className="absolute top-full left-0 mt-2 w-48 border rounded-lg shadow-xl z-20 p-3 grid grid-cols-4 gap-2"
                        style={{
                            backgroundColor: "var(--holo-panel)",
                            borderColor: "var(--holo-border)",
                        }}
                    >
                        {colors.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => {
                                    onChange(c.value);
                                    setIsOpen(false);
                                }}
                                className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform relative flex items-center justify-center"
                                style={{ background: c.value }}
                            >
                                {selectedColor === c.value && (
                                    <Check className="w-4 h-4 text-white" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
export default ColorPicker;
