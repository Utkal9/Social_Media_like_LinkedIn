import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import clientServer from "@/config";
import toast from "react-hot-toast";
import styles from "@/styles/ResumeBuilder.module.css";

const ProfessionalSummaryForm = ({ data, onChange, setResumeData }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateSummary = async () => {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("Authentication required");

        try {
            setIsGenerating(true);
            const prompt = `enhance my professional summary "${data}"`;

            // EXACT LOGIC: Using specific endpoint
            const response = await clientServer.post(
                "/resume/ai/enhance-summary",
                { userContent: prompt },
                { headers: { Authorization: token } }
            );

            onChange(response.data.enhancedContent);
            if (setResumeData) {
                setResumeData((prev) => ({
                    ...prev,
                    professional_summary: response.data.enhancedContent,
                }));
            }
            toast.success("Summary enhanced!");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={styles.formSection}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                }}
            >
                <div>
                    <h3 className={styles.sectionTitle}>
                        Professional Summary
                    </h3>
                    <p className={styles.sectionDesc}>
                        Add summary for your resume here
                    </p>
                </div>
                <button
                    disabled={isGenerating}
                    onClick={generateSummary}
                    className={styles.aiBtn}
                >
                    {isGenerating ? (
                        <Loader2 className="animate-spin" size={14} />
                    ) : (
                        <Sparkles size={14} />
                    )}
                    {isGenerating ? "Enhancing..." : "AI Enhance"}
                </button>
            </div>

            <textarea
                value={data || ""}
                onChange={(e) => onChange(e.target.value)}
                rows={7}
                className={styles.textarea}
                placeholder="Write a compelling professional summary..."
            />
        </div>
    );
};

export default ProfessionalSummaryForm;
