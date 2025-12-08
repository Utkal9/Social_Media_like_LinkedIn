import { Plus, Trash2, Award } from "lucide-react";
import React from "react";

const CertificateForm = ({ data, onChange }) => {
    const addCert = () => onChange([...data, { name: "", link: "", date: "" }]);
    const removeCert = (index) => onChange(data.filter((_, i) => i !== index));
    const updateCert = (index, field, value) => {
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
                    <Award className="w-5 h-5" /> Certificates
                </h3>
                <button
                    onClick={addCert}
                    className="px-3 py-1.5 text-sm border rounded-lg"
                    style={{
                        borderColor: "var(--holo-border)",
                        color: "var(--neon-teal)",
                    }}
                >
                    <Plus className="inline w-4 h-4 mr-1" /> Add
                </button>
            </div>

            {data.map((cert, index) => (
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
                            Certificate #{index + 1}
                        </h4>
                        <button
                            onClick={() => removeCert(index)}
                            className="text-red-500"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <input
                            value={cert.name}
                            onChange={(e) =>
                                updateCert(index, "name", e.target.value)
                            }
                            placeholder="Certificate Name"
                            className="p-2 text-sm border rounded"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />
                        <input
                            value={cert.date}
                            onChange={(e) =>
                                updateCert(index, "date", e.target.value)
                            }
                            placeholder="Date (e.g. July 2025)"
                            className="p-2 text-sm border rounded"
                            style={{
                                backgroundColor: "var(--holo-bg)",
                                borderColor: "var(--holo-border)",
                                color: "var(--text-primary)",
                            }}
                        />
                    </div>
                    <input
                        value={cert.link}
                        onChange={(e) =>
                            updateCert(index, "link", e.target.value)
                        }
                        placeholder="Credential Link"
                        className="w-full p-2 text-sm border rounded"
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
export default CertificateForm;
