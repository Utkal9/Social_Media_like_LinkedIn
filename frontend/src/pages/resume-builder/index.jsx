// frontend/src/pages/resume-builder/index.jsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import styles from "./index.module.css";
import clientServer from "@/config"; // Using your axios config

// --- ICONS ---
const PlusIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="40"
        height="40"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
        />
    </svg>
);
const FileIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        width="40"
        height="40"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
    </svg>
);
const TrashIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="20"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        />
    </svg>
);
const CloseIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
        />
    </svg>
);

export default function ResumeDashboard() {
    const router = useRouter();
    const [resumes, setResumes] = useState([]);

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [newResumeTitle, setNewResumeTitle] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Resumes on Load
    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await clientServer.get("/resume/all", {
                    params: { token },
                });
                setResumes(res.data.resumes || []);
            } catch (err) {
                console.error("Failed to load resumes", err);
                // Fallback for UI demo if backend is offline
                // setResumes([{ _id: "demo1", title: "Full Stack Developer", updatedAt: new Date() }]);
            }
        };
        fetchResumes();
    }, []);

    // 1. Handle "Create New" Click
    const handleCreateClick = () => {
        setNewResumeTitle("");
        setShowCreateModal(true);
    };

    // 2. Submit New Resume -> REDIRECT to Editor
    const handleCreateSubmit = async () => {
        if (!newResumeTitle.trim()) return;
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");

            // Call Backend to Create
            const res = await clientServer.post("/resume/create", {
                token,
                title: newResumeTitle,
            });

            // If successful, redirect to the [id].jsx page
            if (res.data && res.data.resumeId) {
                router.push(`/resume-builder/${res.data.resumeId}`);
            } else if (res.data && res.data.resume && res.data.resume._id) {
                router.push(`/resume-builder/${res.data.resume._id}`);
            }
        } catch (error) {
            console.error("Create failed", error);
            // Fallback: If backend is not ready, we can't redirect because [id].jsx will 404
            alert(
                "Could not create resume on server. Check backend connection."
            );
        } finally {
            setIsLoading(false);
            setShowCreateModal(false);
        }
    };

    // 3. Open Existing Resume
    const handleOpenResume = (id) => {
        router.push(`/resume-builder/${id}`);
    };

    // 4. Delete Logic
    const handleDeleteClick = (e, resume) => {
        e.stopPropagation();
        setDeleteTarget(resume);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const token = localStorage.getItem("token");
            await clientServer.post("/resume/delete", {
                token,
                resumeId: deleteTarget._id,
            });
            setResumes(resumes.filter((r) => r._id !== deleteTarget._id));
        } catch (err) {
            console.error("Delete failed", err);
        }
        setShowDeleteModal(false);
        setDeleteTarget(null);
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>My Resumes | LinkUps</title>
            </Head>

            <h1 className={styles.pageTitle}>Resume Studio</h1>
            <p className={styles.pageSubtitle}>
                Manage and edit your professional documents
            </p>

            <div className={styles.grid}>
                {/* Create New Card */}
                <div
                    className={`${styles.card} ${styles.createCard}`}
                    onClick={handleCreateClick}
                >
                    <div className={styles.iconWrapper}>
                        <PlusIcon />
                    </div>
                    <h3>Create New</h3>
                </div>

                {/* Resume List */}
                {resumes.map((resume) => (
                    <div
                        key={resume._id}
                        className={styles.resumeCard}
                        onClick={() => handleOpenResume(resume._id)} // <--- CLICK TO OPEN EDITOR
                    >
                        <div className={styles.cardHeader}>
                            <div className={styles.fileIconBox}>
                                <FileIcon />
                            </div>
                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => handleDeleteClick(e, resume)}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                        <div className={styles.cardBody}>
                            <h4>{resume.title}</h4>
                            <span>
                                Last edited:{" "}
                                {new Date(
                                    resume.updatedAt
                                ).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- CUSTOM NEON MODAL (Create) --- */}
            {showCreateModal && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Name Your Resume</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className={styles.closeBtn}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <label className={styles.inputLabel}>
                                Resume Title
                            </label>
                            <input
                                autoFocus
                                className={styles.inputField}
                                placeholder="e.g. Senior Dev Application"
                                value={newResumeTitle}
                                onChange={(e) =>
                                    setNewResumeTitle(e.target.value)
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleCreateSubmit()
                                }
                            />
                            <button
                                onClick={handleCreateSubmit}
                                className={styles.primaryBtn}
                                disabled={isLoading}
                            >
                                {isLoading ? "Creating..." : "Create & Edit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CUSTOM NEON MODAL (Delete) --- */}
            {showDeleteModal && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                        style={{ textAlign: "center", maxWidth: "350px" }}
                    >
                        <div
                            className={styles.modalHeader}
                            style={{
                                justifyContent: "center",
                                borderBottom: "none",
                                paddingBottom: 0,
                            }}
                        >
                            <div className={styles.warningIconWrapper}>
                                <TrashIcon />
                            </div>
                        </div>
                        <h3
                            style={{
                                color: "var(--neon-pink)",
                                margin: "15px 0 10px",
                            }}
                        >
                            Delete Resume?
                        </h3>
                        <p
                            style={{
                                color: "var(--text-secondary)",
                                marginBottom: "25px",
                                fontSize: "0.9rem",
                            }}
                        >
                            Are you sure you want to delete{" "}
                            <strong>"{deleteTarget?.title}"</strong>?
                        </p>
                        <div className={styles.buttonGroup}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className={styles.secondaryBtn}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className={styles.dangerBtn}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

ResumeDashboard.getLayout = (page) => (
    <UserLayout>
        <DashboardLayout>{page}</DashboardLayout>
    </UserLayout>
);
