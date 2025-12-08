import { Sparkles } from "lucide-react";
import React from "react";

const SkillsForm = ({ data, onChange }) => {
    // Helper to update specific category fields
    const handleCategoryChange = (key, value) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h3
                    className="flex items-center gap-2 text-lg font-semibold"
                    style={{ color: "var(--text-primary)" }}
                >
                    {" "}
                    Technical Skills{" "}
                </h3>
                <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                >
                    Categorize your skills for the CV.
                </p>
            </div>

            <div className="grid gap-4">
                <div className="space-y-1">
                    <label
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Languages
                    </label>
                    <input
                        type="text"
                        placeholder="C++, JavaScript, Python, Java..."
                        value={data.skillLanguages || ""}
                        onChange={(e) =>
                            handleCategoryChange(
                                "skillLanguages",
                                e.target.value
                            )
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2"
                        style={{
                            backgroundColor: "var(--holo-bg)",
                            borderColor: "var(--holo-border)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>

                <div className="space-y-1">
                    <label
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Cloud & DevOps
                    </label>
                    <input
                        type="text"
                        placeholder="AWS, Docker, Kubernetes, CI/CD..."
                        value={data.skillCloudDevOps || ""}
                        onChange={(e) =>
                            handleCategoryChange(
                                "skillCloudDevOps",
                                e.target.value
                            )
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2"
                        style={{
                            backgroundColor: "var(--holo-bg)",
                            borderColor: "var(--holo-border)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>

                <div className="space-y-1">
                    <label
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Frameworks
                    </label>
                    <input
                        type="text"
                        placeholder="React.js, Next.js, Express..."
                        value={data.skillFrameworks || ""}
                        onChange={(e) =>
                            handleCategoryChange(
                                "skillFrameworks",
                                e.target.value
                            )
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2"
                        style={{
                            backgroundColor: "var(--holo-bg)",
                            borderColor: "var(--holo-border)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>

                <div className="space-y-1">
                    <label
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Tools / Platforms
                    </label>
                    <input
                        type="text"
                        placeholder="Git, Postman, MySQL..."
                        value={data.skillTools || ""}
                        onChange={(e) =>
                            handleCategoryChange("skillTools", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2"
                        style={{
                            backgroundColor: "var(--holo-bg)",
                            borderColor: "var(--holo-border)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>

                <div className="space-y-1">
                    <label
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Soft Skills
                    </label>
                    <input
                        type="text"
                        placeholder="Leadership, Problem Solving..."
                        value={data.skillSoft || ""}
                        onChange={(e) =>
                            handleCategoryChange("skillSoft", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2"
                        style={{
                            backgroundColor: "var(--holo-bg)",
                            borderColor: "var(--holo-border)",
                            color: "var(--text-primary)",
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
export default SkillsForm;
