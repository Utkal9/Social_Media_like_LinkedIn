import { Plus, Trash2, Folder, Calendar } from "lucide-react";
import React from "react";

const ProjectForm = ({ data, onChange }) => {
    const addProject = () =>
        onChange([
            ...data,
            {
                name: "",
                type: "",
                description: "",
                link: "",
                live_link: "",
                duration: "",
            },
        ]);

    const removeProject = (index) =>
        onChange(data.filter((_, i) => i !== index));

    const updateProject = (index, field, value) => {
        const updated = [...data];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h3
                    className="text-lg font-semibold"
                    style={{ color: "var(--text-primary)" }}
                >
                    Projects
                </h3>
                <button
                    onClick={addProject}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg"
                    style={{
                        borderColor: "var(--holo-border)",
                        color: "var(--neon-teal)",
                        backgroundColor: "var(--holo-glass)",
                    }}
                >
                    <Plus className="w-4 h-4" /> Add
                </button>
            </div>

            {data.map((project, index) => (
                <div
                    key={index}
                    className="p-5 border rounded-xl shadow-sm space-y-4"
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
                            Project #{index + 1}
                        </h4>
                        <button
                            onClick={() => removeProject(index)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <input
                            value={project.name || ""}
                            onChange={(e) =>
                                updateProject(index, "name", e.target.value)
                            }
                            placeholder="Project Name"
                            className="p-2 text-sm border rounded outline-none focus:ring-2"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />

                        <input
                            value={project.type || ""}
                            onChange={(e) =>
                                updateProject(index, "type", e.target.value)
                            }
                            placeholder="Tech Stack / Type"
                            className="p-2 text-sm border rounded outline-none focus:ring-2"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <input
                            value={project.link || ""}
                            onChange={(e) =>
                                updateProject(index, "link", e.target.value)
                            }
                            placeholder="GitHub Link"
                            className="p-2 text-sm border rounded outline-none focus:ring-2"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />

                        <input
                            value={project.live_link || ""}
                            onChange={(e) =>
                                updateProject(
                                    index,
                                    "live_link",
                                    e.target.value
                                )
                            }
                            placeholder="Live Demo Link"
                            className="p-2 text-sm border rounded outline-none focus:ring-2"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />

                        {/* Advanced Calendar Wrapper for Duration */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                value={project.duration || ""}
                                onChange={(e) =>
                                    updateProject(
                                        index,
                                        "duration",
                                        e.target.value
                                    )
                                }
                                placeholder="Duration (e.g. Sept 2025)"
                                className="w-full pl-10 py-2 text-sm border rounded outline-none focus:ring-2"
                                style={{
                                    backgroundColor: "var(--holo-bg)",
                                    borderColor: "var(--holo-border)",
                                    color: "var(--text-primary)",
                                }}
                            />
                        </div>
                    </div>

                    <textarea
                        rows={3}
                        value={project.description || ""}
                        onChange={(e) =>
                            updateProject(index, "description", e.target.value)
                        }
                        placeholder="Description (Bullet points)"
                        className="w-full p-2 text-sm border rounded resize-none outline-none focus:ring-2"
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
export default ProjectForm;
