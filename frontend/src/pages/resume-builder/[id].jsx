import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";
import clientServer from "@/config";
import styles from "@/styles/ResumeBuilder.module.css";
import {
    ArrowLeft,
    Save,
    Download,
    ChevronLeft,
    ChevronRight,
    Share2,
    Eye,
    EyeOff,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Import Templates (Capital C)
import ModernTemplate from "@/Components/templates/ModernTemplate";
// Add other templates imports here when you create them

// Import Forms (Capital C)
import PersonalInfoForm from "@/Components/resume-forms/PersonalInfoForm";
import ProfessionalSummaryForm from "@/Components/resume-forms/ProfessionalSummaryForm";
import ExperienceForm from "@/Components/resume-forms/ExperienceForm";
import EducationForm from "@/Components/resume-forms/EducationForm";
import SkillsForm from "@/Components/resume-forms/SkillsForm";
import ProjectForm from "@/Components/resume-forms/ProjectForm";
import TemplateSelector from "@/Components/TemplateSelector";
import ColorPicker from "@/Components/ColorPicker";

export default function BuilderPage() {
    const router = useRouter();
    const { id } = router.query;
    const [resumeData, setResumeData] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [activeSection, setActiveSection] = useState(0);
    const [removeBackground, setRemoveBackground] = useState(false);
    const [saving, setSaving] = useState(false);

    const sections = [
        { id: "personal", label: "Personal" },
        { id: "summary", label: "Summary" },
        { id: "experience", label: "Experience" },
        { id: "education", label: "Education" },
        { id: "projects", label: "Projects" },
        { id: "skills", label: "Skills" },
    ];

    useEffect(() => {
        if (!id) return;
        const loadData = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await clientServer.get("/resume/get", {
                    params: { token, resumeId: id },
                });
                setResumeData(res.data.resume);
                document.title = res.data.resume.title;
            } catch (err) {
                console.error(err);
                router.push("/resume-builder");
            }
        };
        loadData();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem("token");
        try {
            const formData = new FormData();
            formData.append("token", token);
            formData.append("resumeId", id);

            // Logic from minor project: Remove raw image object if present in data
            let updatedResumeData = structuredClone(resumeData);
            if (typeof updatedResumeData.personal_info.image === "object") {
                delete updatedResumeData.personal_info.image;
            }

            formData.append("resumeData", JSON.stringify(updatedResumeData));

            if (removeBackground) formData.append("removeBackground", "yes");
            if (resumeFile) formData.append("image", resumeFile);

            const res = await clientServer.post("/resume/update", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setResumeData(res.data.resume);
            toast.success(res.data.message);
        } catch (err) {
            console.error(err);
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    const updateData = (sectionKey, data) => {
        setResumeData((prev) => ({ ...prev, [sectionKey]: data }));
    };

    const toggleVisibility = async () => {
        // Implement if you have the public route set up
        const newData = { ...resumeData, public: !resumeData.public };
        setResumeData(newData);
        toast.success(`Resume is now ${newData.public ? "Public" : "Private"}`);
    };

    if (!resumeData)
        return <div className={styles.builderContainer}>Loading...</div>;

    return (
        <div className={styles.builderContainer}>
            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        background: "#0b0f2a",
                        color: "#fff",
                        border: "1px solid #0fffc6",
                    },
                }}
            />

            {/* Header */}
            <div className={styles.headerBar}>
                <div
                    className={styles.backLink}
                    onClick={() => router.push("/resume-builder")}
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </div>
            </div>

            <div className={styles.grid}>
                {/* LEFT: FORM PANEL */}
                <div className={styles.editorPanel}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{
                                width: `${
                                    ((activeSection + 1) / sections.length) *
                                    100
                                }%`,
                            }}
                        />
                    </div>

                    {/* Selectors */}
                    <div
                        className={styles.controls}
                        style={{
                            borderBottom: "1px solid var(--holo-border)",
                            background: "rgba(0,0,0,0.2)",
                        }}
                    >
                        <div style={{ display: "flex", gap: "10px" }}>
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
                    </div>

                    {/* Navigation */}
                    <div className={styles.controls}>
                        <button
                            className={styles.navBtn}
                            disabled={activeSection === 0}
                            onClick={() => setActiveSection((p) => p - 1)}
                        >
                            <ChevronLeft size={14} /> Previous
                        </button>
                        <span
                            style={{
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                                color: "var(--neon-teal)",
                            }}
                        >
                            {sections[activeSection].label}
                        </span>
                        <button
                            className={styles.navBtn}
                            disabled={activeSection === sections.length - 1}
                            onClick={() => setActiveSection((p) => p + 1)}
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className={styles.formContent}>
                        {activeSection === 0 && (
                            <PersonalInfoForm
                                data={resumeData.personal_info}
                                onChange={(d) => updateData("personal_info", d)}
                                removeBackground={removeBackground}
                                setRemoveBackground={setRemoveBackground}
                                setResumeFile={setResumeFile} // Pass file setter
                            />
                        )}
                        {activeSection === 1 && (
                            <ProfessionalSummaryForm
                                data={resumeData.professional_summary}
                                onChange={(d) =>
                                    updateData("professional_summary", d)
                                }
                                setResumeData={setResumeData}
                            />
                        )}
                        {activeSection === 2 && (
                            <ExperienceForm
                                data={resumeData.experience}
                                onChange={(d) => updateData("experience", d)}
                            />
                        )}
                        {activeSection === 3 && (
                            <EducationForm
                                data={resumeData.education}
                                onChange={(d) => updateData("education", d)}
                            />
                        )}
                        {activeSection === 4 && (
                            <ProjectForm
                                data={resumeData.project}
                                onChange={(d) => updateData("project", d)}
                            />
                        )}
                        {activeSection === 5 && (
                            <SkillsForm
                                data={resumeData.skills}
                                onChange={(d) => updateData("skills", d)}
                            />
                        )}

                        <button
                            onClick={() =>
                                toast.promise(handleSave(), {
                                    loading: "Saving...",
                                    success: "Saved!",
                                    error: "Error",
                                })
                            }
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "20px",
                                background: "var(--neon-teal)",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "bold",
                                cursor: "pointer",
                            }}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* RIGHT: PREVIEW PANEL */}
                <div className={styles.previewPanel} style={{ marginTop: "0" }}>
                    <div className={styles.previewToolbar}>
                        <button
                            onClick={toggleVisibility}
                            className={`${styles.actionBtn} ${styles.btnVisibility}`}
                        >
                            {resumeData.public ? (
                                <Eye size={16} />
                            ) : (
                                <EyeOff size={16} />
                            )}
                            {resumeData.public ? "Public" : "Private"}
                        </button>
                        <button
                            onClick={() => window.print()}
                            className={`${styles.actionBtn} ${styles.btnDownload}`}
                        >
                            <Download size={16} /> Download
                        </button>
                    </div>

                    <div className={styles.resumePaper}>
                        {/* Dynamically render template based on selection */}
                        <ModernTemplate
                            data={resumeData}
                            accentColor={resumeData.accent_color}
                        />
                        {/* Add switch case for other templates here */}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .${styles.resumePaper}, .${styles.resumePaper} * { 
                        visibility: visible; 
                    }
                    .${styles.resumePaper} {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        box-shadow: none;
                    }
                }
            `}</style>
        </div>
    );
}

// BuilderPage.getLayout = (page) => <UserLayout>{page}</UserLayout>;
