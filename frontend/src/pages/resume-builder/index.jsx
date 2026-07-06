import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import clientServer from "@/config";
import toast, { Toaster } from "react-hot-toast";
import pdfToText from "react-pdftotext";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import {
    FilePenLine,
    LoaderCircle,
    Pencil,
    Plus,
    Trash2,
    UploadCloud,
    X,
    AlertTriangle,
    MoreVertical,
    Sparkles,
} from "lucide-react";

const ResumeDashboard = () => {
    const router = useRouter();
    const { token: authReduxToken } = useSelector((state) => state.auth);

    const getToken = () => authReduxToken || localStorage.getItem("token");
    const baseColors = ["#9333ea", "#d97706", "#dc2626", "#0284c7", "#16a34a"];

    const [allResumes, setAllResumes] = useState([]);
    const [title, setTitle] = useState("");
    const [resumeFile, setResumeFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- MODAL & MENU STATES ---
    const [showCreateResume, setShowCreateResume] = useState(false);
    const [createStep, setCreateStep] = useState(1);         // 1 = pick template, 2 = enter title
    const [selectedTemplate, setSelectedTemplate] = useState("general"); // "general" | "specialized"
    const [showUploadResume, setShowUploadResume] = useState(false);
    const [editResumeId, setEditResumeId] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // Track which dropdown is currently open (by resume ID)
    const [activeMenuId, setActiveMenuId] = useState(null);

    // --- API CALLS ---
    const loadAllResumes = async () => {
        try {
            const token = getToken();
            const { data } = await clientServer.get("/resume/all", {
                params: { token },
            });
            setAllResumes(data.resumes || []);
        } catch (error) {
            console.error(error);
        }
    };

    const createResume = async (event) => {
        event.preventDefault();
        try {
            const token = getToken();
            const { data } = await clientServer.post("/resume/create", {
                title,
                token,
                template: selectedTemplate,
            });
            setAllResumes([...allResumes, data.resume]);
            setTitle("");
            setCreateStep(1);
            setSelectedTemplate("general");
            setShowCreateResume(false);
            router.push(`/resume-builder/${data.resume._id}`);
        } catch (error) {
            toast.error("Error creating resume");
        }
    };

    const uploadResume = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const token = getToken();
            const resumeText = await pdfToText(resumeFile);
            const { data } = await clientServer.post("/resume/ai/parse-text", {
                title,
                resumeText,
                token,
            });
            router.push(`/resume-builder/${data.resumeId}`);
        } catch (error) {
            toast.error("Failed to parse PDF");
        } finally {
            setIsLoading(false);
        }
    };

    const editTitle = async (event) => {
        event.preventDefault();
        try {
            const token = getToken();
            await clientServer.post("/resume/update", {
                resumeId: editResumeId,
                resumeData: { title },
                token,
            });
            setAllResumes(
                allResumes.map((r) =>
                    r._id === editResumeId ? { ...r, title } : r
                )
            );
            setTitle("");
            setEditResumeId("");
            toast.success("Title updated");
        } catch (e) {
            toast.error("Update failed");
        }
    };

    const initiateDelete = (id) => {
        setDeleteTargetId(id);
        setShowDeleteModal(true);
        setActiveMenuId(null); // Close menu
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            const token = getToken();
            await clientServer.post("/resume/delete", {
                resumeId: deleteTargetId,
                token,
            });
            setAllResumes(allResumes.filter((r) => r._id !== deleteTargetId));
            toast.success("Resume deleted");
            setShowDeleteModal(false);
            setDeleteTargetId(null);
        } catch (e) {
            toast.error("Delete failed");
        }
    };

    useEffect(() => {
        loadAllResumes();
    }, []);

    // --- RENDER ---
    return (
        <div
            className="min-h-screen transition-colors duration-300 font-sans"
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

            {/* Invisible backdrop to close menus when clicking outside */}
            {activeMenuId && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setActiveMenuId(null)}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-2">My Resumes</h1>
                <p className="mb-8 opacity-70">
                    Create, edit, and manage your professional documents.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-6 mb-8">
                    <button
                        onClick={() => setShowCreateResume(true)}
                        className="w-full sm:max-w-48 h-48 flex flex-col items-center justify-center rounded-xl gap-3 border-2 border-dashed transition-all duration-300 cursor-pointer group hover:scale-105"
                        style={{
                            backgroundColor: "var(--holo-glass)",
                            borderColor: "var(--holo-border)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <div
                            className="p-3 rounded-full shadow-sm"
                            style={{
                                background: "var(--holo-panel)",
                                color: "var(--neon-teal)",
                            }}
                        >
                            <Plus className="w-8 h-8" />
                        </div>
                        <p className="font-medium group-hover:text-[var(--neon-teal)] transition-colors">
                            Create New
                        </p>
                    </button>

                    <button
                        onClick={() => setShowUploadResume(true)}
                        className="w-full sm:max-w-48 h-48 flex flex-col items-center justify-center rounded-xl gap-3 border-2 border-dashed transition-all duration-300 cursor-pointer group hover:scale-105"
                        style={{
                            backgroundColor: "var(--holo-glass)",
                            borderColor: "var(--holo-border)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <div
                            className="p-3 rounded-full shadow-sm"
                            style={{
                                background: "var(--holo-panel)",
                                color: "var(--neon-violet)",
                            }}
                        >
                            <UploadCloud className="w-8 h-8" />
                        </div>
                        <p className="font-medium group-hover:text-[var(--neon-violet)] transition-colors">
                            Upload Existing
                        </p>
                    </button>

                    <button
                        onClick={() => router.push('/ai-tools')}
                        className="w-full sm:max-w-48 h-48 flex flex-col items-center justify-center rounded-xl gap-3 border-2 border-dashed transition-all duration-300 cursor-pointer group hover:scale-105"
                        style={{
                            backgroundColor: "var(--holo-glass)",
                            borderColor: "var(--holo-border)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <div
                            className="p-3 rounded-full shadow-sm"
                            style={{
                                background: "var(--holo-panel)",
                                color: "#f59e0b",
                            }}
                        >
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <p className="font-medium group-hover:text-[#f59e0b] transition-colors">
                            AI Career Tools
                        </p>
                    </button>
                </div>

                <hr
                    className="my-8 opacity-20"
                    style={{ borderColor: "var(--text-secondary)" }}
                />

                {/* --- RESUME GRID --- */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allResumes.map((resume, index) => {
                        const baseColor = baseColors[index % baseColors.length];
                        return (
                            <div
                                key={resume._id}
                                className="flex flex-col h-64 border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl group relative"
                                style={{
                                    backgroundColor: "var(--holo-panel)",
                                    borderColor: "var(--holo-border)",
                                }}
                            >
                                {/* 1. TOP RIGHT MENU (Three Dots) */}
                                <div className="absolute top-2 right-2 z-20">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(
                                                activeMenuId === resume._id
                                                    ? null
                                                    : resume._id
                                            );
                                        }}
                                        className="p-1.5 rounded-full transition-colors hover:bg-[var(--holo-bg)]"
                                        style={{
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {activeMenuId === resume._id && (
                                        <div
                                            className="absolute right-0 mt-1 w-32 rounded-lg shadow-lg border overflow-hidden animate-in fade-in zoom-in duration-200"
                                            style={{
                                                backgroundColor:
                                                    "var(--holo-panel)",
                                                borderColor:
                                                    "var(--holo-border)",
                                            }}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditResumeId(resume._id);
                                                    setTitle(resume.title);
                                                    setActiveMenuId(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--holo-bg)] transition-colors text-left"
                                                style={{
                                                    color: "var(--text-primary)",
                                                }}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />{" "}
                                                Rename
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    initiateDelete(resume._id);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--holo-bg)] transition-colors text-left text-red-500 hover:text-red-600"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />{" "}
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Main Body */}
                                <div
                                    onClick={() =>
                                        router.push(
                                            `/resume-builder/${resume._id}`
                                        )
                                    }
                                    className="flex-1 flex flex-col items-center justify-center cursor-pointer relative p-4 pt-8"
                                >
                                    <div
                                        className="absolute inset-0 opacity-5 pointer-events-none"
                                        style={{
                                            background: `linear-gradient(135deg, ${baseColor}, transparent)`,
                                        }}
                                    />

                                    <div
                                        className="p-4 rounded-full shadow-sm mb-3 transition-transform duration-300 group-hover:scale-110"
                                        style={{
                                            backgroundColor: "var(--holo-bg)",
                                        }}
                                    >
                                        <FilePenLine
                                            className="w-8 h-8"
                                            style={{ color: baseColor }}
                                        />
                                    </div>

                                    <p
                                        className="font-semibold text-center px-2 truncate w-full text-lg"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        {resume.title}
                                    </p>
                                </div>

                                {/* 3. Footer: template badge + date */}
                                <div
                                    className="px-4 py-3 border-t flex items-center justify-between"
                                    style={{
                                        borderColor: "var(--holo-border)",
                                        backgroundColor: "var(--holo-glass)",
                                    }}
                                >
                                    {/* Template badge */}
                                    <span
                                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: resume.template === "specialized"
                                                ? "rgba(139,92,246,0.15)"
                                                : "rgba(15,255,198,0.12)",
                                            color: resume.template === "specialized"
                                                ? "var(--neon-violet)"
                                                : "var(--neon-teal)",
                                            border: `1px solid ${ resume.template === "specialized" ? "rgba(139,92,246,0.3)" : "rgba(15,255,198,0.3)" }`,
                                        }}
                                    >
                                        {resume.template === "specialized" ? "Specialized" : "General"}
                                    </span>
                                    <span
                                        className="text-xs font-medium opacity-70"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        {new Date(resume.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- MODALS (Create, Upload, Edit, Delete) --- */}
                {/* (Keeping existing modal code unchanged as it works perfectly) */}

                {showCreateResume && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => { setShowCreateResume(false); setCreateStep(1); setTitle(""); }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative rounded-2xl shadow-2xl w-full animate-in fade-in zoom-in duration-200"
                            style={{
                                backgroundColor: "var(--holo-panel)",
                                border: "1px solid var(--holo-border)",
                                maxWidth: createStep === 1 ? "640px" : "420px",
                                transition: "max-width 0.3s ease",
                            }}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center px-8 pt-8 pb-6">
                                <div>
                                    {createStep === 2 && (
                                        <button
                                            onClick={() => setCreateStep(1)}
                                            className="flex items-center gap-1.5 text-sm mb-2 transition-opacity hover:opacity-70"
                                            style={{ color: "var(--text-secondary)" }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                            Back
                                        </button>
                                    )}
                                    <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                                        {createStep === 1 ? "Choose a Template" : "Name your Resume"}
                                    </h2>
                                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                                        {createStep === 1
                                            ? "Pick the layout that fits your style. You can switch it later."
                                            : `Using ${ selectedTemplate === "specialized" ? "Specialized" : "General" } template`
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setShowCreateResume(false); setCreateStep(1); setTitle(""); }}
                                    style={{ color: "var(--text-secondary)" }}
                                    className="ml-4 shrink-0"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="px-8 pb-8">
                                {/* ── STEP 1: Template Picker ── */}
                                {createStep === 1 && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* General Card */}
                                        <button
                                            onClick={() => { setSelectedTemplate("general"); setCreateStep(2); }}
                                            className="group text-left rounded-xl p-5 border-2 transition-all duration-200 hover:scale-[1.02]"
                                            style={{
                                                backgroundColor: "var(--holo-bg)",
                                                borderColor: "rgba(15,255,198,0.25)",
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--neon-teal)"}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(15,255,198,0.25)"}
                                        >
                                            {/* Mini preview */}
                                            <div className="rounded-lg mb-4 overflow-hidden" style={{ background: "#fff", padding: "10px", height: "120px" }}>
                                                <div style={{ width: "70%", height: "8px", background: "#1a1a1a", borderRadius: "4px", marginBottom: "5px" }} />
                                                <div style={{ width: "100%", height: "1px", background: "#BFBFBF", marginBottom: "4px" }} />
                                                <div style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
                                                    <div style={{ width: "40px", height: "6px", background: "#2E74B5", borderRadius: "3px" }} />
                                                    <div style={{ flex: 1, height: "6px", background: "#e5e7eb", borderRadius: "3px" }} />
                                                </div>
                                                {[1,2,3,4].map(i => (
                                                    <div key={i} style={{ display: "flex", gap: "4px", marginBottom: "2px" }}>
                                                        <div style={{ width: "50px", height: "5px", background: "#374151", borderRadius: "2px", fontWeight: "bold" }} />
                                                        <div style={{ flex: 1, height: "5px", background: "#e5e7eb", borderRadius: "2px" }} />
                                                    </div>
                                                ))}
                                                <div style={{ width: "100%", height: "1px", background: "#BFBFBF", marginTop: "6px" }} />
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-base font-bold" style={{ color: "var(--neon-teal)" }}>📄</span>
                                                <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>General</span>
                                            </div>
                                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                                Classic LPU-style with 7 skill categories. Best for technical roles with detailed skill breakdown.
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {["Languages","Frontend","Backend","DB & Cloud"].map(t => (
                                                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full"
                                                        style={{ background: "rgba(15,255,198,0.1)", color: "var(--neon-teal)", border: "1px solid rgba(15,255,198,0.2)" }}>
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </button>

                                        {/* Specialized Card */}
                                        <button
                                            onClick={() => { setSelectedTemplate("specialized"); setCreateStep(2); }}
                                            className="group text-left rounded-xl p-5 border-2 transition-all duration-200 hover:scale-[1.02]"
                                            style={{
                                                backgroundColor: "var(--holo-bg)",
                                                borderColor: "rgba(139,92,246,0.25)",
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--neon-violet)"}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)"}
                                        >
                                            {/* Mini preview */}
                                            <div className="rounded-lg mb-4 overflow-hidden" style={{ background: "#fff", padding: "10px", height: "120px" }}>
                                                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                                                    <div style={{ width: "60%", height: "8px", background: "#111", borderRadius: "4px", margin: "0 auto 4px" }} />
                                                    <div style={{ width: "80%", height: "5px", background: "#9ca3af", borderRadius: "3px", margin: "0 auto" }} />
                                                </div>
                                                <div style={{ width: "100%", height: "1.5px", background: "#111", margin: "5px 0 3px" }} />
                                                <div style={{ width: "40px", height: "6px", background: "#111", borderRadius: "3px", fontWeight: 900, marginBottom: "3px" }} />
                                                {[1,2,3].map(i => (
                                                    <div key={i} style={{ display: "flex", gap: "4px", marginBottom: "2px" }}>
                                                        <div style={{ width: "55px", height: "5px", background: "#374151", borderRadius: "2px" }} />
                                                        <div style={{ flex: 1, height: "5px", background: "#e5e7eb", borderRadius: "2px" }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-base font-bold" style={{ color: "var(--neon-violet)" }}>⭐</span>
                                                <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Specialized</span>
                                            </div>
                                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                                Modern centered header with 3 broad skill groups. Best for showcasing domain expertise.
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {["Languages","Tech/Frameworks","Domain Skills"].map(t => (
                                                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full"
                                                        style={{ background: "rgba(139,92,246,0.1)", color: "var(--neon-violet)", border: "1px solid rgba(139,92,246,0.2)" }}>
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {/* ── STEP 2: Title Input ── */}
                                {createStep === 2 && (
                                    <form onSubmit={createResume}>
                                        {/* Chosen template indicator */}
                                        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg"
                                            style={{ background: "var(--holo-bg)", border: "1px solid var(--holo-border)" }}>
                                            <span className="text-sm font-bold px-2 py-0.5 rounded-full"
                                                style={{
                                                    background: selectedTemplate === "specialized" ? "rgba(139,92,246,0.15)" : "rgba(15,255,198,0.12)",
                                                    color: selectedTemplate === "specialized" ? "var(--neon-violet)" : "var(--neon-teal)",
                                                    border: `1px solid ${ selectedTemplate === "specialized" ? "rgba(139,92,246,0.3)" : "rgba(15,255,198,0.3)" }`,
                                                }}
                                            >
                                                {selectedTemplate === "specialized" ? "⭐ Specialized" : "📄 General"}
                                            </span>
                                            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>template selected</span>
                                        </div>

                                        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                                            Resume Title
                                        </label>
                                        <input
                                            autoFocus
                                            onChange={(e) => setTitle(e.target.value)}
                                            value={title}
                                            type="text"
                                            placeholder="Ex: Full Stack Developer"
                                            className="w-full px-4 py-3 rounded-xl mb-5 outline-none transition-all focus:ring-2 focus:ring-[var(--neon-teal)]"
                                            style={{
                                                backgroundColor: "var(--holo-bg)",
                                                border: "1px solid var(--holo-border)",
                                                color: "var(--text-primary)",
                                            }}
                                            required
                                        />
                                        <button
                                            className="w-full py-3 font-semibold rounded-xl transition-all shadow-lg hover:opacity-90"
                                            style={{
                                                background: selectedTemplate === "specialized"
                                                    ? "var(--neon-violet)"
                                                    : "var(--neon-teal)",
                                                color: selectedTemplate === "specialized" ? "#fff" : "#000",
                                            }}
                                        >
                                            Create Resume →
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showUploadResume && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowUploadResume(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200"
                            style={{
                                backgroundColor: "var(--holo-panel)",
                                border: "1px solid var(--holo-border)",
                            }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2
                                    className="text-2xl font-bold"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    Upload & Parse
                                </h2>
                                <button
                                    onClick={() => setShowUploadResume(false)}
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={uploadResume}>
                                <input
                                    onChange={(e) => setTitle(e.target.value)}
                                    value={title}
                                    type="text"
                                    placeholder="Resume Title"
                                    className="w-full px-4 py-3 rounded-xl mb-4 outline-none transition-all focus:ring-2 focus:ring-[var(--neon-violet)]"
                                    style={{
                                        backgroundColor: "var(--holo-bg)",
                                        border: "1px solid var(--holo-border)",
                                        color: "var(--text-primary)",
                                    }}
                                    required
                                />
                                <label className="block w-full cursor-pointer mb-6">
                                    <div
                                        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 transition-colors`}
                                        style={{
                                            borderColor: resumeFile
                                                ? "var(--neon-violet)"
                                                : "var(--holo-border)",
                                            backgroundColor: "var(--holo-bg)",
                                        }}
                                    >
                                        {resumeFile ? (
                                            <>
                                                <FilePenLine
                                                    className="w-10 h-10"
                                                    style={{
                                                        color: "var(--neon-violet)",
                                                    }}
                                                />
                                                <p
                                                    className="font-medium text-center break-all"
                                                    style={{
                                                        color: "var(--neon-violet)",
                                                    }}
                                                >
                                                    {resumeFile.name}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud
                                                    className="w-12 h-12"
                                                    style={{
                                                        color: "var(--text-secondary)",
                                                    }}
                                                />
                                                <div
                                                    className="text-center"
                                                    style={{
                                                        color: "var(--text-secondary)",
                                                    }}
                                                >
                                                    <p className="font-medium">
                                                        Click to upload PDF
                                                    </p>
                                                    <p className="text-sm opacity-70">
                                                        Max size 5MB
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        hidden
                                        onChange={(e) =>
                                            setResumeFile(e.target.files[0])
                                        }
                                    />
                                </label>
                                <button
                                    disabled={isLoading || !resumeFile}
                                    className="w-full py-3 font-medium rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    style={{
                                        backgroundColor: "var(--neon-violet)",
                                        color: "#fff",
                                    }}
                                >
                                    {isLoading && (
                                        <LoaderCircle className="animate-spin w-5 h-5" />
                                    )}
                                    {isLoading
                                        ? "Processing AI..."
                                        : "Parse & Create"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {editResumeId && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setEditResumeId("")}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative rounded-2xl shadow-2xl w-full max-w-md p-8"
                            style={{
                                backgroundColor: "var(--holo-panel)",
                                border: "1px solid var(--holo-border)",
                            }}
                        >
                            <h2
                                className="text-xl font-bold mb-6"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Rename Resume
                            </h2>
                            <form onSubmit={editTitle}>
                                <input
                                    autoFocus
                                    onChange={(e) => setTitle(e.target.value)}
                                    value={title}
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl mb-6 outline-none transition-all focus:ring-2 focus:ring-[var(--neon-blue)]"
                                    style={{
                                        backgroundColor: "var(--holo-bg)",
                                        border: "1px solid var(--holo-border)",
                                        color: "var(--text-primary)",
                                    }}
                                    required
                                />
                                <button
                                    className="w-full py-3 font-medium rounded-xl transition-colors"
                                    style={{
                                        backgroundColor: "var(--neon-blue)",
                                        color: "#fff",
                                    }}
                                >
                                    Save Changes
                                </button>
                            </form>
                            <button
                                className="absolute top-6 right-6"
                                style={{ color: "var(--text-secondary)" }}
                                onClick={() => setEditResumeId("")}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}

                {showDeleteModal && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200"
                            style={{
                                backgroundColor: "var(--holo-panel)",
                                border: "1px solid var(--neon-pink)",
                                boxShadow: "0 0 40px rgba(236, 72, 153, 0.1)",
                            }}
                        >
                            <div className="flex justify-center mb-4">
                                <div className="p-4 rounded-full bg-red-500/10">
                                    <AlertTriangle
                                        className="w-10 h-10"
                                        style={{ color: "var(--neon-pink)" }}
                                    />
                                </div>
                            </div>
                            <h2
                                className="text-xl font-bold mb-2"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Delete Resume?
                            </h2>
                            <p
                                className="mb-6 text-sm"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                Are you sure you want to delete this resume?
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-6 py-2.5 font-medium rounded-xl transition-colors"
                                    style={{
                                        backgroundColor: "var(--holo-bg)",
                                        color: "var(--text-secondary)",
                                        border: "1px solid var(--holo-border)",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-6 py-2.5 font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20"
                                    style={{
                                        backgroundColor: "var(--neon-pink)",
                                        color: "#fff",
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

ResumeDashboard.getLayout = (page) => (
    <UserLayout>
        <DashboardLayout>{page}</DashboardLayout>
    </UserLayout>
);
export default ResumeDashboard;
