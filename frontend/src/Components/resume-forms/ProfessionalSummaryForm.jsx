import { Loader2, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import clientServer from "@/config"; // LinkUps Axios config
import toast from "react-hot-toast";

const ProfessionalSummaryForm = ({ data, onChange, setResumeData }) => {
    const { token } = useSelector((state) => state.auth);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateSummary = async () => {
        try {
            setIsGenerating(true);
            const prompt = `enhance my professional summary "${data}"`;

            // Updated to LinkUps Backend Route
            const response = await clientServer.post(
                "/resume/ai/enhance-summary",
                { userContent: prompt },
                { headers: { Authorization: `Bearer ${token}` } } // Ensure token header format matches your backend
            );

            setResumeData((prev) => ({
                ...prev,
                professional_summary: response.data.enhancedContent,
            }));
            toast.success("Summary enhanced by AI!");
        } catch (error) {
            console.error(error);
            toast.error(
                error?.response?.data?.message || "AI generation failed"
            );
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        {" "}
                        Professional Summary{" "}
                    </h3>
                    <p className="text-sm text-gray-500">
                        Add summary for your resume here
                    </p>
                </div>
                <button
                    disabled={isGenerating}
                    onClick={generateSummary}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                    {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Sparkles className="w-4 h-4" />
                    )}
                    {isGenerating ? "Enhancing..." : "AI Enhance"}
                </button>
            </div>

            <div className="mt-6">
                <textarea
                    value={data || ""}
                    onChange={(e) => onChange(e.target.value)}
                    rows={7}
                    className="w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-400"
                    placeholder="Write a compelling professional summary that highlights your key strengths and career objectives..."
                />
                <p className="mt-2 text-xs text-center text-gray-500">
                    Tip: Keep it concise (3-4 sentences) and focus on your most
                    relevant achievements and skills.
                </p>
            </div>
        </div>
    );
};

export default ProfessionalSummaryForm;
