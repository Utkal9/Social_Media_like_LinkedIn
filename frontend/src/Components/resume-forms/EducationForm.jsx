import { GraduationCap, Plus, Trash2 } from "lucide-react";
import React from "react";

const EducationForm = ({ data, onChange }) => {
    const addEducation = () =>
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
    const removeEducation = (index) =>
        onChange(data.filter((_, i) => i !== index));
    const updateEducation = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
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
                        Education{" "}
                    </h3>
                    <p
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Add your academic background
                    </p>
                </div>
                <button
                    onClick={addEducation}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors"
                    style={{
                        borderColor: "var(--holo-border)",
                        color: "var(--neon-teal)",
                        backgroundColor: "var(--holo-glass)",
                    }}
                >
                    <Plus className="w-4 h-4" /> Add Education
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
                    <GraduationCap
                        className="w-12 h-12 mx-auto mb-3"
                        style={{ color: "var(--text-secondary)" }}
                    />
                    <p style={{ color: "var(--text-secondary)" }}>
                        No education added yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map((education, index) => (
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
                                    Education #{index + 1}
                                </h4>
                                <button
                                    onClick={() => removeEducation(index)}
                                    className="p-1 hover:text-red-500 transition-colors"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    "institution",
                                    "degree",
                                    "field",
                                    "graduation_date",
                                ].map((field) => (
                                    <input
                                        key={field}
                                        value={education[field] || ""}
                                        onChange={(e) =>
                                            updateEducation(
                                                index,
                                                field,
                                                e.target.value
                                            )
                                        }
                                        type={
                                            field === "graduation_date"
                                                ? "month"
                                                : "text"
                                        }
                                        placeholder={
                                            field.charAt(0).toUpperCase() +
                                            field.slice(1).replace("_", " ")
                                        }
                                        className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2"
                                        style={{
                                            backgroundColor: "var(--holo-bg)",
                                            borderColor: "var(--holo-border)",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                ))}
                            </div>
                            <input
                                value={education.gpa || ""}
                                onChange={(e) =>
                                    updateEducation(
                                        index,
                                        "gpa",
                                        e.target.value
                                    )
                                }
                                type="text"
                                placeholder="GPA (optional)"
                                className="w-full mt-4 px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2"
                                style={{
                                    backgroundColor: "var(--holo-bg)",
                                    borderColor: "var(--holo-border)",
                                    color: "var(--text-primary)",
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default EducationForm;
