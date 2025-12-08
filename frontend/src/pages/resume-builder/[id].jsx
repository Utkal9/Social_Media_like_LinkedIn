import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useSelector } from "react-redux";
import clientServer from "@/config";
import toast, { Toaster } from "react-hot-toast";
import {
    ArrowLeft,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    EyeOff,
    FileText,
    Folder,
    GraduationCap,
    Share2,
    Sparkles,
    User,
    Award,
    Trophy,
} from "lucide-react";

// Components
import PersonalInfoForm from "@/Components/resume-forms/PersonalInfoForm";
import ProfessionalSummaryForm from "@/Components/resume-forms/ProfessionalSummaryForm";
import ExperienceForm from "@/Components/resume-forms/ExperienceForm";
import EducationForm from "@/Components/resume-forms/EducationForm";
import ProjectForm from "@/Components/resume-forms/ProjectForm";
import SkillsForm from "@/Components/resume-forms/SkillsForm";
import CertificateForm from "@/Components/resume-forms/CertificateForm";
import AchievementForm from "@/Components/resume-forms/AchievementForm";
import ResumePreview from "@/Components/ResumePreview";
import TemplateSelector from "@/Components/TemplateSelector";
import ColorPicker from "@/Components/ColorPicker";

export default function ResumeBuilder() {
    const router = useRouter();
    const { id } = router.query;
    const { token: authReduxToken } = useSelector((state) => state.auth);
    const getToken = () => authReduxToken || localStorage.getItem("token");

    const [resumeData, setResumeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [removeBackground, setRemoveBackground] = useState(false);
    const [completion, setCompletion] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const sections = [
        { id: "personal", name: "Personal", icon: User },
        { id: "skills", name: "Skills", icon: Sparkles },
        { id: "projects", name: "Projects", icon: Folder },
        { id: "experience", name: "Experience", icon: Briefcase },
        { id: "education", name: "Education", icon: GraduationCap },
        { id: "certificates", name: "Certificates", icon: Award },
        { id: "achievements", name: "Achievements", icon: Trophy },
        { id: "summary", name: "Summary", icon: FileText },
    ];
    const activeSection = sections[activeSectionIndex];

    useEffect(() => {
        if (!resumeData) return;
        let filled = 0;
        if (resumeData.personal_info?.full_name) filled++;
        if (
            resumeData.skillLanguages ||
            (resumeData.skills && resumeData.skills.length > 0)
        )
            filled++;
        if (resumeData.project?.length > 0) filled++;
        if (resumeData.experience?.length > 0) filled++;
        if (resumeData.education?.length > 0) filled++;
        if (resumeData.certificates?.length > 0) filled++;
        if (resumeData.achievements?.length > 0) filled++;
        if (resumeData.professional_summary) filled++;
        setCompletion(Math.round((filled / sections.length) * 100));
    }, [resumeData]);

    useEffect(() => {
        if (!id) return;
        const loadResume = async () => {
            try {
                const token = getToken();
                const { data } = await clientServer.get("/resume/get", {
                    params: { resumeId: id, token },
                });
                if (data.resume) {
                    setResumeData(data.resume);
                    document.title = data.resume.title;
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadResume();
    }, [id]);

    const saveResume = async () => {
        try {
            const token = getToken();
            let updatedData = { ...resumeData };
            if (updatedData.personal_info)
                updatedData.personal_info = { ...updatedData.personal_info };

            const formData = new FormData();
            formData.append("resumeId", id);
            formData.append("token", token);

            if (
                updatedData.personal_info?.image &&
                typeof updatedData.personal_info.image === "object"
            ) {
                formData.append("image", updatedData.personal_info.image);
                delete updatedData.personal_info.image;
            }

            formData.append("resumeData", JSON.stringify(updatedData));
            if (removeBackground) formData.append("removeBackground", "yes");

            const { data } = await clientServer.post(
                "/resume/update",
                formData
            );
            setResumeData(data.resume);
            toast.success("Saved successfully");
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Save failed");
        }
    };

    const toggleVisibility = async () => {
        const newData = { ...resumeData, public: !resumeData.public };
        setResumeData(newData);
        try {
            const token = getToken();
            const formData = new FormData();
            formData.append("resumeId", id);
            formData.append("token", token);
            formData.append(
                "resumeData",
                JSON.stringify({ public: newData.public })
            );
            await clientServer.post("/resume/update", formData);
            toast.success(
                `Resume is now ${newData.public ? "Public" : "Private"}`
            );
        } catch (e) {
            setResumeData({ ...resumeData, public: !newData.public });
            toast.error("Update failed");
        }
    };

    // --- UPDATED: DOCX DOWNLOAD ---
    const downloadDocx = async () => {
        setIsDownloading(true);
        const toastId = toast.loading("Generating DOCX...");
        try {
            const token = getToken();
            // Call the backend endpoint to generate the file
            const response = await clientServer.get("/resume/download/docx", {
                params: { resumeId: id, token },
                responseType: "blob", // Important: Expect a file blob
            });

            // Create a temporary link to trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `${resumeData.personal_info?.full_name || "Resume"}_CV.docx`
            );
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            toast.success("Downloaded!", { id: toastId });
        } catch (error) {
            console.error("Download Error:", error);
            toast.error("Download failed.", { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading || !resumeData)
        return (
            <div
                className="min-h-screen flex items-center justify-center font-sans"
                style={{
                    backgroundColor: "var(--holo-bg)",
                    color: "var(--text-primary)",
                }}
            >
                <div
                    className="animate-spin rounded-full h-12 w-12 border-b-2"
                    style={{ borderColor: "var(--neon-teal)" }}
                ></div>
            </div>
        );

    return (
        <div
            className="min-h-screen font-sans transition-colors duration-300"
            style={{
                backgroundColor: "var(--holo-bg)",
                color: "var(--text-primary)",
            }}
        >
            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        background: "var(--holo-panel)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--holo-border)",
                    },
                }}
            />

            <div className="max-w-7xl mx-auto px-4 py-6">
                <Link
                    href="/resume-builder"
                    className="inline-flex gap-2 items-center hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-4 pb-8">
                <div className="grid lg:grid-cols-12 gap-8">
                    {/* LEFT: EDITOR */}
                    <div className="relative lg:col-span-5 rounded-lg">
                        <div
                            className="rounded-lg shadow-sm border p-6 pt-1 sticky top-4"
                            style={{
                                backgroundColor: "var(--holo-panel)",
                                borderColor: "var(--holo-border)",
                            }}
                        >
                            {/* Completion Bar */}
                            <div className="mb-8 mt-4">
                                <div className="flex justify-between text-xs mb-2 font-medium">
                                    <span style={{ color: "var(--neon-teal)" }}>
                                        Resume Completion
                                    </span>
                                    <span
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        {completion}%
                                    </span>
                                </div>
                                <div
                                    className="relative h-3 rounded-full overflow-hidden"
                                    style={{
                                        backgroundColor:
                                            "rgba(128,128,128,0.2)",
                                    }}
                                >
                                    <div
                                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${completion}%`,
                                            backgroundColor: "var(--neon-teal)",
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 px-1">
                                    {sections.map((sec, idx) => (
                                        <div
                                            key={sec.id}
                                            onClick={() =>
                                                setActiveSectionIndex(idx)
                                            }
                                            className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                                                activeSectionIndex === idx
                                                    ? "scale-150"
                                                    : ""
                                            }`}
                                            style={{
                                                backgroundColor:
                                                    idx <=
                                                    (completion / 100) *
                                                        (sections.length - 1)
                                                        ? "var(--neon-teal)"
                                                        : "var(--text-secondary)",
                                                opacity:
                                                    activeSectionIndex === idx
                                                        ? 1
                                                        : 0.5,
                                            }}
                                            title={sec.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Controls */}
                            <div
                                className="flex justify-between items-center mb-6 border-b pb-4"
                                style={{ borderColor: "var(--holo-border)" }}
                            >
                                <div className="flex items-center gap-2">
                                    <TemplateSelector
                                        selectedTemplate={resumeData.template}
                                        onChange={(t) =>
                                            setResumeData((p) => ({
                                                ...p,
                                                template: t,
                                            }))
                                        }
                                    />
                                    <ColorPicker
                                        selectedColor={resumeData.accent_color}
                                        onChange={(c) =>
                                            setResumeData((p) => ({
                                                ...p,
                                                accent_color: c,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() =>
                                            setActiveSectionIndex((p) =>
                                                Math.max(p - 1, 0)
                                            )
                                        }
                                        disabled={activeSectionIndex === 0}
                                        className="p-2 rounded-lg hover:bg-[var(--holo-bg)] disabled:opacity-30 transition-all"
                                        style={{
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveSectionIndex((p) =>
                                                Math.min(
                                                    p + 1,
                                                    sections.length - 1
                                                )
                                            )
                                        }
                                        disabled={
                                            activeSectionIndex ===
                                            sections.length - 1
                                        }
                                        className="p-2 rounded-lg hover:bg-[var(--holo-bg)] disabled:opacity-30 transition-all"
                                        style={{
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Forms */}
                            <div className="min-h-[400px]">
                                <h2
                                    className="text-xl font-bold mb-1 flex items-center gap-2"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {React.createElement(activeSection.icon, {
                                        className: "w-5 h-5",
                                        style: { color: "var(--neon-teal)" },
                                    })}
                                    {activeSection.name}
                                </h2>
                                <p
                                    className="text-sm mb-6"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    Update your details.
                                </p>

                                {activeSection.id === "personal" && (
                                    <PersonalInfoForm
                                        data={resumeData.personal_info}
                                        onChange={(d) =>
                                            setResumeData((p) => ({
                                                ...p,
                                                personal_info: d,
                                            }))
                                        }
                                        removeBackground={removeBackground}
                                        setRemoveBackground={
                                            setRemoveBackground
                                        }
                                    />
                                )}
                                {activeSection.id === "summary" && (
                                    <ProfessionalSummaryForm
                                        data={resumeData.professional_summary}
                                        onChange={(d) =>
                                            setResumeData((p) => ({
                                                ...p,
                                                professional_summary: d,
                                            }))
                                        }
                                        setResumeData={setResumeData}
                                    />
                                )}
                                {activeSection.id === "skills" && (
                                    <SkillsForm
                                        data={resumeData}
                                        onChange={(newData) =>
                                            setResumeData(newData)
                                        }
                                    />
                                )}
                                {activeSection.id === "experience" && (
                                    <ExperienceForm
                                        data={resumeData.experience}
                                        onChange={(d) =>
                                            setResumeData((p) => ({
                                                ...p,
                                                experience: d,
                                            }))
                                        }
                                    />
                                )}
                                {activeSection.id === "education" && (
                                    <EducationForm
                                        data={resumeData.education}
                                        onChange={(d) =>
                                            setResumeData((p) => ({
                                                ...p,
                                                education: d,
                                            }))
                                        }
                                    />
                                )}
                                {activeSection.id === "projects" && (
                                    <ProjectForm
                                        data={resumeData.project}
                                        onChange={(d) =>
                                            setResumeData((p) => ({
                                                ...p,
                                                project: d,
                                            }))
                                        }
                                    />
                                )}
                                {activeSection.id === "certificates" && (
                                    <CertificateForm
                                        data={resumeData.certificates || []}
                                        onChange={(d) =>
                                            setResumeData((p) => ({
                                                ...p,
                                                certificates: d,
                                            }))
                                        }
                                    />
                                )}
                                {activeSection.id === "achievements" && (
                                    <AchievementForm
                                        data={resumeData.achievements || []}
                                        onChange={(d) =>
                                            setResumeData((p) => ({
                                                ...p,
                                                achievements: d,
                                            }))
                                        }
                                    />
                                )}
                            </div>

                            <button
                                onClick={saveResume}
                                className="w-full mt-8 font-medium py-2.5 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: "var(--neon-teal)",
                                    color: "#000",
                                }}
                            >
                                <Share2 className="w-4 h-4" /> Save Changes
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: PREVIEW */}
                    <div className="lg:col-span-7">
                        <div className="sticky top-4">
                            <div
                                className="p-3 rounded-lg shadow-sm border mb-4 flex items-center justify-between"
                                style={{
                                    backgroundColor: "var(--holo-panel)",
                                    borderColor: "var(--holo-border)",
                                }}
                            >
                                <div
                                    className="text-sm font-medium"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    Live Preview
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={toggleVisibility}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors"
                                        style={{
                                            borderColor: "var(--holo-border)",
                                            color: resumeData.public
                                                ? "var(--neon-teal)"
                                                : "var(--text-secondary)",
                                        }}
                                    >
                                        {resumeData.public ? (
                                            <Eye className="w-3 h-3" />
                                        ) : (
                                            <EyeOff className="w-3 h-3" />
                                        )}
                                        {resumeData.public
                                            ? "Public"
                                            : "Private"}
                                    </button>
                                    <button
                                        onClick={downloadDocx}
                                        disabled={isDownloading}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                                        style={{
                                            backgroundColor: "var(--holo-bg)",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        <Download className="w-3 h-3" />
                                        {isDownloading
                                            ? "Generating..."
                                            : "Download DOCX"}
                                    </button>
                                </div>
                            </div>
                            <ResumePreview
                                data={resumeData}
                                template={resumeData.template}
                                accentColor={resumeData.accent_color}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
