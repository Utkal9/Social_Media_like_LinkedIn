import { Plus, Trash2, Trophy } from "lucide-react";
import React from "react";

const AchievementForm = ({ data, onChange }) => {
    const addAch = () =>
        onChange([...data, { title: "", link: "", date: "", description: "" }]);
    const removeAch = (index) => onChange(data.filter((_, i) => i !== index));
    const updateAch = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h3
                    className="text-lg font-semibold flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                >
                    <Trophy className="w-5 h-5" /> Achievements
                </h3>
                <button
                    onClick={addAch}
                    className="px-3 py-1.5 text-sm border rounded-lg"
                    style={{
                        borderColor: "var(--holo-border)",
                        color: "var(--neon-teal)",
                    }}
                >
                    <Plus className="inline w-4 h-4 mr-1" /> Add
                </button>
            </div>

            {data.map((ach, index) => (
                <div
                    key={index}
                    className="p-4 border rounded-xl space-y-3"
                    style={{
                        backgroundColor: "var(--holo-panel)",
                        borderColor: "var(--holo-border)",
                    }}
                >
                    <div className="flex justify-between">
                        <h4
                            className="font-medium"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Achievement #{index + 1}
                        </h4>
                        <button
                            onClick={() => removeAch(index)}
                            className="text-red-500"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <input
                            value={ach.title}
                            onChange={(e) =>
                                updateAch(index, "title", e.target.value)
                            }
                            placeholder="Title / Rank"
                            className="p-2 text-sm border rounded"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />
                        <input
                            value={ach.date}
                            onChange={(e) =>
                                updateAch(index, "date", e.target.value)
                            }
                            placeholder="Date"
                            className="p-2 text-sm border rounded"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />
                    </div>
                    <input
                        value={ach.link}
                        onChange={(e) =>
                            updateAch(index, "link", e.target.value)
                        }
                        placeholder="Proof Link (Optional)"
                        className="w-full p-2 text-sm border rounded"
                        style={{
                            backgroundColor: "var(--holo-bg)",
                            borderColor: "var(--holo-border)",
                            color: "var(--text-primary)",
                        }}
                    />
                    <textarea
                        rows={2}
                        value={ach.description}
                        onChange={(e) =>
                            updateAch(index, "description", e.target.value)
                        }
                        placeholder="Description..."
                        className="w-full p-2 text-sm border rounded resize-none"
                        style={{
                            backgroundColor: "var(--holo-bg)",
                            borderColor: "var(--holo-border)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>
            ))}
        </div>
    );
};
export default AchievementForm;
