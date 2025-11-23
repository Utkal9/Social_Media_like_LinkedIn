// frontend/src/pages/profile/index.jsx
import React, { useEffect, useState, useMemo } from "react";
import styles from "./index.module.css";
import { useDispatch, useSelector } from "react-redux";
import {
    getAboutUser,
    getConnectionsRequest,
    getMyConnectionRequests,
} from "@/config/redux/action/authAction";
import clientServer from "@/config";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import { getAllPosts } from "@/config/redux/action/postAction";
import { useRouter } from "next/router";

const DEFAULT_BG =
    "https://img.freepik.com/free-photo/3d-rendering-hexagonal-texture-background_23-2150796421.jpg?semt=ais_hybrid&w=740&q=80";

// --- Holo Icons ---
const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18">
        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
);
const SaveIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18">
        <path
            fillRule="evenodd"
            d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
            clipRule="evenodd"
        />
    </svg>
);
const CameraIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20">
        <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
        <path
            fillRule="evenodd"
            d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
        />
    </svg>
);
const AddIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20">
        <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
    </svg>
);
const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
);
const DownloadIcon = () => (
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
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
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

const TruncatedText = ({ content, postId }) => {
    const router = useRouter();
    const maxLength = 60;
    if (content.length <= maxLength)
        return <p className={styles.postBody}>{content}</p>;
    return (
        <p className={styles.postBody}>
            {content.substring(0, maxLength)}...
            <span
                className={styles.readMore}
                onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/post/${postId}`);
                }}
            >
                more
            </span>
        </p>
    );
};

// --- RESTORED & UPGRADED LOGIC ---
const calculateProfileCompletion = (profile) => {
    if (!profile || !profile.userId) return { percentage: 0, missing: [] };

    let score = 0;
    const totalPoints = 20; // Total weighted points
    const missing = [];

    // 1. Basic Contact Details (5 points)
    if (profile.userId.name) score++;
    else missing.push("Full Name");
    if (profile.userId.email) score++;
    else missing.push("Email");
    if (profile.phoneNumber) score++;
    else missing.push("Mobile Number");
    if (profile.github) score++;
    else missing.push("GitHub Profile Link");
    if (profile.leetcode) score++;
    else missing.push("LeetCode Profile Link");

    // 2. Resume Specific Skills (5 points) - One in each field
    if (profile.skillLanguages) score++;
    else missing.push("Skills: Languages");
    if (profile.skillCloudDevOps) score++;
    else missing.push("Skills: Cloud/DevOps");
    if (profile.skillFrameworks) score++;
    else missing.push("Skills: Frameworks");
    if (profile.skillTools) score++;
    else missing.push("Skills: Tools");
    if (profile.skillSoft) score++;
    else missing.push("Skills: Soft Skills");

    // 3. Projects (Minimum 2) (10 points total) - Adjusted weight slightly for balance
    const projects = profile.projects || [];

    // Base point for having at least 2 projects
    if (projects.length >= 2) {
        score += 2; // Weighted heavier
    } else {
        missing.push(`Add ${2 - projects.length} more Project(s)`);
    }

    // Details check for the first 2 projects
    for (let i = 0; i < 2; i++) {
        const proj = projects[i];
        if (proj) {
            // Description length check (approx 3 lines ~ 80 chars for validation)
            if (proj.description && proj.description.length >= 80) {
                score += 2;
            } else {
                missing.push(
                    `Project ${i + 1}: Description too short (min 80 chars)`
                );
            }

            // Link check
            if (proj.link) {
                score += 1;
            } else {
                missing.push(`Project ${i + 1}: Missing GitHub/Live Link`);
            }

            // Timeline check
            if (proj.duration) {
                score += 1;
            } else {
                missing.push(`Project ${i + 1}: Missing Duration`);
            }
        } else {
            // Project missing entirely
        }
    }

    const percentage = Math.round((score / totalPoints) * 100);
    return { percentage: Math.min(percentage, 100), missing }; // Cap at 100
};

export default function Profilepage() {
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const postReducer = useSelector((state) => state.postReducer);
    const router = useRouter();

    const [userProfile, setUserProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [skillInput, setSkillInput] = useState("");
    const [completionStats, setCompletionStats] = useState({
        percentage: 0,
        missing: [],
    });
    const [showConnectionsModal, setShowConnectionsModal] = useState(false);
    const [userPosts, setUserPosts] = useState([]);

    const [modalMode, setModalMode] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalInput, setModalInput] = useState({});

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            dispatch(getAboutUser({ token }));
            dispatch(getAllPosts());
            dispatch(getConnectionsRequest({ token }));
            dispatch(getMyConnectionRequests({ token }));
        }
    }, [dispatch]);

    useEffect(() => {
        if (authState.user) {
            setUserProfile(authState.user);
            const posts = postReducer.posts.filter(
                (post) =>
                    post.userId.username === authState.user.userId.username
            );
            setUserPosts(posts);
            setCompletionStats(calculateProfileCompletion(authState.user));
        }
    }, [authState.user, postReducer.posts]);

    const acceptedConnectionsList = useMemo(() => {
        const sent = Array.isArray(authState.connections)
            ? authState.connections
            : [];
        const received = Array.isArray(authState.connectionRequest)
            ? authState.connectionRequest
            : [];
        const sentAccepted = sent
            .filter((r) => r.status_accepted === true)
            .map((r) => r.connectionId);
        const receivedAccepted = received
            .filter((r) => r.status_accepted === true)
            .map((r) => r.userId);
        return [...sentAccepted, ...receivedAccepted].filter((u) => u);
    }, [authState.connections, authState.connectionRequest]);

    const syncProfileToBackend = async (updatedProfile) => {
        try {
            setCompletionStats(calculateProfileCompletion(updatedProfile));
            await clientServer.post("/user_update", {
                token: localStorage.getItem("token"),
                name: updatedProfile.userId.name,
                username: updatedProfile.userId.username,
                email: updatedProfile.userId.email,
            });
            await clientServer.post("/update_profile_data", {
                token: localStorage.getItem("token"),
                ...updatedProfile,
            });
            dispatch(getAboutUser({ token: localStorage.getItem("token") }));
        } catch (err) {
            alert("Failed to save changes.");
        }
    };

    const handleProfileChange = (e) => {
        let { name, value } = e.target;
        if (name === "phoneNumber") {
            value = value.replace(/[^0-9+ ]/g, "");
        }
        let updatedProfile;
        if (["name", "username", "email"].includes(name)) {
            updatedProfile = {
                ...userProfile,
                userId: { ...userProfile.userId, [name]: value },
            };
        } else {
            updatedProfile = { ...userProfile, [name]: value };
        }
        setUserProfile(updatedProfile);
    };

    const toggleEditMode = () => {
        if (isEditing) syncProfileToBackend(userProfile);
        setIsEditing(!isEditing);
    };

    const uploadImage = async (file, type) => {
        try {
            const formData = new FormData();
            formData.append(
                type === "profile" ? "profile_picture" : "background_picture",
                file
            );
            formData.append("token", localStorage.getItem("token"));
            const endpoint =
                type === "profile"
                    ? "/update_profile_picture"
                    : "/update_background_picture";
            await clientServer.post(endpoint, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            dispatch(getAboutUser({ token: localStorage.getItem("token") }));
        } catch (error) {
            alert("Upload failed.");
        }
    };

    const handleAddSkill = () => {
        if (
            skillInput.trim() &&
            !userProfile.skills.includes(skillInput.trim())
        ) {
            const updatedSkills = [...userProfile.skills, skillInput.trim()];
            const updatedProfile = { ...userProfile, skills: updatedSkills };
            setUserProfile(updatedProfile);
            setSkillInput("");
            if (!isEditing) syncProfileToBackend(updatedProfile);
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        const updatedSkills = userProfile.skills.filter(
            (s) => s !== skillToRemove
        );
        const updatedProfile = { ...userProfile, skills: updatedSkills };
        setUserProfile(updatedProfile);
        if (!isEditing) syncProfileToBackend(updatedProfile);
    };

    // --- UPDATED DOWNLOAD HANDLER ---
    const handleDownloadResume = async () => {
        if (completionStats.percentage < 90) {
            // Visual feedback is already in the tooltip, but keep safe guard
            return;
        }
        if (!userProfile?.userId?._id) return;
        try {
            const response = await clientServer.get(
                `/user/download_resume?id=${userProfile.userId._id}`,
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `${userProfile.userId.username}_resume.docx`
            );
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            alert("Generation failed.");
        }
    };

    const openModal = (mode, item = null, index = -1) => {
        setModalMode(mode);
        setSelectedItem({ ...item, index });
        setModalInput(item || {});
    };
    const closeModal = () => {
        setModalMode(null);
        setSelectedItem(null);
        setModalInput({});
    };
    const handleModalInputChange = (e) =>
        setModalInput({ ...modalInput, [e.target.name]: e.target.value });

    const handleModalSave = () => {
        let updated = { ...userProfile };
        const updateArray = (arrName) => {
            let arr = [...(updated[arrName] || [])];
            if (modalMode.includes("edit"))
                arr[selectedItem.index] = modalInput;
            else arr.push(modalInput);
            updated[arrName] = arr;
        };
        if (modalMode.includes("work")) updateArray("pastWork");
        else if (modalMode.includes("edu")) updateArray("education");
        else if (modalMode.includes("project")) updateArray("projects");
        else if (modalMode.includes("cert")) updateArray("certificates");
        else if (modalMode.includes("achieve")) updateArray("achievements");

        setUserProfile(updated);
        syncProfileToBackend(updated);
        closeModal();
    };

    const handleItemDelete = (type, index) => {
        if (window.confirm("Delete this item?")) {
            let updated = { ...userProfile };
            const map = {
                work: "pastWork",
                edu: "education",
                projects: "projects",
                cert: "certificates",
                achieve: "achievements",
            };
            const key = map[type];
            updated[key] = updated[key].filter((_, i) => i !== index);
            setUserProfile(updated);
            syncProfileToBackend(updated);
        }
    };

    if (!userProfile)
        return <div className={styles.loading}>Loading Identity...</div>;

    // Color Logic for Ring
    const strokeColor =
        completionStats.percentage >= 90
            ? "var(--neon-teal)" // Ready
            : "var(--neon-pink)"; // Incomplete

    return (
        <div className={styles.profilePage}>
            {/* --- Header Card --- */}
            <div className={styles.headerCard}>
                <div
                    className={styles.coverImage}
                    style={{
                        backgroundImage: `url("${
                            userProfile.userId.backgroundPicture || DEFAULT_BG
                        }")`,
                    }}
                >
                    {/* --- UPDATED: Resume Ring & Tooltip --- */}
                    <div className={styles.resumeActionWrapper}>
                        {/* The Ring SVG */}
                        <svg viewBox="0 0 36 36" className={styles.progressSvg}>
                            <path
                                className={styles.circleBg}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className={styles.circleFg}
                                strokeDasharray={`${completionStats.percentage}, 100`}
                                stroke={strokeColor}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>

                        {/* Download Button */}
                        <button
                            onClick={handleDownloadResume}
                            className={styles.downloadResumeBtn}
                            disabled={completionStats.percentage < 90}
                        >
                            <DownloadIcon />
                        </button>

                        {/* Hover Tooltip with Missing Items */}
                        <div className={styles.completionTooltip}>
                            <h5>
                                {completionStats.percentage}% Ready
                                <span
                                    style={{
                                        color:
                                            completionStats.percentage >= 90
                                                ? "var(--neon-teal)"
                                                : "var(--neon-pink)",
                                    }}
                                >
                                    {completionStats.percentage >= 90
                                        ? "Unlocked"
                                        : "Locked"}
                                </span>
                            </h5>
                            {completionStats.missing.length > 0 ? (
                                <ul>
                                    {completionStats.missing.map(
                                        (item, idx) => (
                                            <li key={idx}>{item}</li>
                                        )
                                    )}
                                </ul>
                            ) : (
                                <p
                                    style={{
                                        fontSize: "0.8rem",
                                        color: "#aaa",
                                        margin: 0,
                                    }}
                                >
                                    Profile complete! You can now generate your
                                    Holo-Resume.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Image Upload Buttons */}
                    {isEditing && (
                        <>
                            <label
                                htmlFor="bgUpload"
                                className={styles.uploadBtnCover}
                            >
                                <CameraIcon />
                            </label>
                            <input
                                id="bgUpload"
                                type="file"
                                hidden
                                onChange={(e) =>
                                    e.target.files[0] &&
                                    uploadImage(e.target.files[0], "background")
                                }
                            />
                        </>
                    )}
                </div>

                <div className={styles.headerContent}>
                    <div className={styles.avatarContainer}>
                        <img
                            src={userProfile.userId.profilePicture}
                            alt="Avatar"
                            className={styles.avatarImg}
                        />
                        {isEditing && (
                            <>
                                <label
                                    htmlFor="pfpUpload"
                                    className={styles.uploadBtnAvatar}
                                >
                                    <EditIcon />
                                </label>
                                <input
                                    id="pfpUpload"
                                    type="file"
                                    hidden
                                    onChange={(e) =>
                                        e.target.files[0] &&
                                        uploadImage(
                                            e.target.files[0],
                                            "profile"
                                        )
                                    }
                                />
                            </>
                        )}
                    </div>

                    <div className={styles.identitySection}>
                        <div className={styles.identityTop}>
                            <div className={styles.nameWrapper}>
                                {isEditing ? (
                                    <input
                                        name="name"
                                        className={styles.editName}
                                        value={userProfile.userId.name}
                                        onChange={handleProfileChange}
                                        placeholder="Full Name"
                                    />
                                ) : (
                                    <h1 className={styles.viewName}>
                                        {userProfile.userId.name}
                                    </h1>
                                )}
                                {isEditing ? (
                                    <input
                                        name="currentPost"
                                        className={styles.editHeadline}
                                        value={userProfile.currentPost}
                                        onChange={handleProfileChange}
                                        placeholder="Headline"
                                    />
                                ) : (
                                    <p className={styles.viewHeadline}>
                                        {userProfile.currentPost ||
                                            "No Headline"}
                                    </p>
                                )}
                            </div>

                            <div className={styles.headerActions}>
                                <button
                                    onClick={toggleEditMode}
                                    className={
                                        isEditing
                                            ? styles.saveModeBtn
                                            : styles.editModeBtn
                                    }
                                >
                                    {isEditing ? (
                                        <>
                                            <SaveIcon /> Save
                                        </>
                                    ) : (
                                        <>
                                            <EditIcon /> Edit
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className={styles.metaData}>
                            <span className={styles.metaItem}>
                                @{userProfile.userId.username}
                            </span>
                            <span className={styles.metaDivider}>•</span>
                            <span
                                className={styles.linkAction}
                                onClick={() => setShowConnectionsModal(true)}
                            >
                                {acceptedConnectionsList.length} Connections
                            </span>
                        </div>

                        <div className={styles.contactGrid}>
                            {isEditing ? (
                                <>
                                    <input
                                        name="phoneNumber"
                                        className={styles.editInput}
                                        value={userProfile.phoneNumber || ""}
                                        onChange={handleProfileChange}
                                        placeholder="Phone Number"
                                    />
                                    <input
                                        name="linkedin"
                                        className={styles.editInput}
                                        value={userProfile.linkedin || ""}
                                        onChange={handleProfileChange}
                                        placeholder="LinkedIn URL"
                                    />
                                    <input
                                        name="github"
                                        className={styles.editInput}
                                        value={userProfile.github || ""}
                                        onChange={handleProfileChange}
                                        placeholder="GitHub URL"
                                    />
                                    <input
                                        name="leetcode"
                                        className={styles.editInput}
                                        value={userProfile.leetcode || ""}
                                        onChange={handleProfileChange}
                                        placeholder="LeetCode URL"
                                    />
                                </>
                            ) : (
                                <>
                                    {userProfile.phoneNumber && (
                                        <span className={styles.contactPill}>
                                            📞 {userProfile.phoneNumber}
                                        </span>
                                    )}
                                    {userProfile.linkedin && (
                                        <a
                                            href={userProfile.linkedin}
                                            target="_blank"
                                            className={styles.contactPill}
                                        >
                                            🔗 LinkedIn
                                        </a>
                                    )}
                                    {userProfile.github && (
                                        <a
                                            href={userProfile.github}
                                            target="_blank"
                                            className={styles.contactPill}
                                        >
                                            🐙 GitHub
                                        </a>
                                    )}
                                    {userProfile.leetcode && (
                                        <a
                                            href={userProfile.leetcode}
                                            target="_blank"
                                            className={styles.contactPill}
                                        >
                                            💻 LeetCode
                                        </a>
                                    )}
                                </>
                            )}
                        </div>

                        <div className={styles.bioSection}>
                            {isEditing ? (
                                <textarea
                                    name="bio"
                                    className={styles.editBio}
                                    value={userProfile.bio}
                                    onChange={handleProfileChange}
                                    placeholder="Summary..."
                                />
                            ) : (
                                <p className={styles.viewBio}>
                                    {userProfile.bio || "No bio added."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.gridLayout}>
                {/* --- LEFT COLUMN: Main Content --- */}
                <div className={styles.mainColumn}>
                    {/* Experience */}
                    <div className={styles.dataCard}>
                        <div className={styles.cardHeaderRow}>
                            <div className={styles.cardTitle}>Experience</div>
                            {isEditing && (
                                <button
                                    className={styles.addBtn}
                                    onClick={() => openModal("add-work")}
                                >
                                    <AddIcon />
                                </button>
                            )}
                        </div>
                        <div className={styles.timeline}>
                            {(userProfile.pastWork || []).map((work, i) => (
                                <div key={i} className={styles.timelineItem}>
                                    <div className={styles.timelineContent}>
                                        <h4>
                                            {work.position}{" "}
                                            <span>@ {work.company}</span>
                                        </h4>
                                        <small>{work.years}</small>
                                        <p>{work.description}</p>
                                    </div>
                                    {isEditing && (
                                        <div className={styles.itemActions}>
                                            <button
                                                onClick={() =>
                                                    openModal(
                                                        "edit-work",
                                                        work,
                                                        i
                                                    )
                                                }
                                                className={styles.actionIconBtn}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleItemDelete("work", i)
                                                }
                                                className={`${styles.actionIconBtn} ${styles.delBtn}`}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Projects */}
                    <div className={styles.dataCard}>
                        <div className={styles.cardHeaderRow}>
                            <div className={styles.cardTitle}>Projects</div>
                            {isEditing && (
                                <button
                                    className={styles.addBtn}
                                    onClick={() => openModal("add-project")}
                                >
                                    <AddIcon />
                                </button>
                            )}
                        </div>
                        <div className={styles.projectList}>
                            {(userProfile.projects || []).map((proj, i) => (
                                <div key={i} className={styles.projectItem}>
                                    <div className={styles.projectHeader}>
                                        <h5>{proj.title}</h5>
                                        <span>{proj.duration}</span>
                                    </div>
                                    <p>{proj.description}</p>
                                    {proj.link && (
                                        <a
                                            href={proj.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={styles.projectLink}
                                        >
                                            View Code
                                        </a>
                                    )}
                                    {isEditing && (
                                        <div className={styles.itemActions}>
                                            <button
                                                onClick={() =>
                                                    openModal(
                                                        "edit-project",
                                                        proj,
                                                        i
                                                    )
                                                }
                                                className={styles.actionIconBtn}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleItemDelete(
                                                        "projects",
                                                        i
                                                    )
                                                }
                                                className={`${styles.actionIconBtn} ${styles.delBtn}`}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Education */}
                    <div className={styles.dataCard}>
                        <div className={styles.cardHeaderRow}>
                            <div className={styles.cardTitle}>Education</div>
                            {isEditing && (
                                <button
                                    className={styles.addBtn}
                                    onClick={() => openModal("add-edu")}
                                >
                                    <AddIcon />
                                </button>
                            )}
                        </div>
                        <div className={styles.timeline}>
                            {(userProfile.education || []).map((edu, i) => (
                                <div key={i} className={styles.timelineItem}>
                                    <div className={styles.timelineContent}>
                                        <h4>{edu.school}</h4>
                                        <p>
                                            {edu.degree}, {edu.fieldOfStudy}
                                        </p>
                                        <small>{edu.years}</small>
                                    </div>
                                    {isEditing && (
                                        <div className={styles.itemActions}>
                                            <button
                                                onClick={() =>
                                                    openModal(
                                                        "edit-edu",
                                                        edu,
                                                        i
                                                    )
                                                }
                                                className={styles.actionIconBtn}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleItemDelete("edu", i)
                                                }
                                                className={`${styles.actionIconBtn} ${styles.delBtn}`}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Certificates */}
                    <div className={styles.dataCard}>
                        <div className={styles.cardHeaderRow}>
                            <div className={styles.cardTitle}>Certificates</div>
                            {isEditing && (
                                <button
                                    className={styles.addBtn}
                                    onClick={() => openModal("add-cert")}
                                >
                                    <AddIcon />
                                </button>
                            )}
                        </div>
                        <div className={styles.timeline}>
                            {(userProfile.certificates || []).map((cert, i) => (
                                <div key={i} className={styles.timelineItem}>
                                    <div className={styles.timelineContent}>
                                        <h4>{cert.name}</h4>
                                        <small>{cert.date}</small>
                                        {cert.link && (
                                            <a
                                                href={cert.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={styles.projectLink}
                                            >
                                                View Credential
                                            </a>
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div className={styles.itemActions}>
                                            <button
                                                onClick={() =>
                                                    openModal(
                                                        "edit-cert",
                                                        cert,
                                                        i
                                                    )
                                                }
                                                className={styles.actionIconBtn}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleItemDelete("cert", i)
                                                }
                                                className={`${styles.actionIconBtn} ${styles.delBtn}`}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className={styles.dataCard}>
                        <div className={styles.cardHeaderRow}>
                            <div className={styles.cardTitle}>Achievements</div>
                            {isEditing && (
                                <button
                                    className={styles.addBtn}
                                    onClick={() => openModal("add-achieve")}
                                >
                                    <AddIcon />
                                </button>
                            )}
                        </div>
                        <div className={styles.timeline}>
                            {(userProfile.achievements || []).map((ach, i) => (
                                <div key={i} className={styles.timelineItem}>
                                    <div className={styles.timelineContent}>
                                        <h4>{ach.title}</h4>
                                        <small>{ach.date}</small>
                                        <p>{ach.description}</p>
                                    </div>
                                    {isEditing && (
                                        <div className={styles.itemActions}>
                                            <button
                                                onClick={() =>
                                                    openModal(
                                                        "edit-achieve",
                                                        ach,
                                                        i
                                                    )
                                                }
                                                className={styles.actionIconBtn}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleItemDelete(
                                                        "achieve",
                                                        i
                                                    )
                                                }
                                                className={`${styles.actionIconBtn} ${styles.delBtn}`}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: Skills + Activity --- */}
                <div className={styles.sideColumn}>
                    {/* Tech Stack */}
                    <div className={styles.dataCard}>
                        <div className={styles.cardTitle}>
                            Tech Stack (Resume)
                        </div>
                        <div className={styles.stackList}>
                            {[
                                "skillLanguages",
                                "skillCloudDevOps",
                                "skillFrameworks",
                                "skillTools",
                                "skillSoft",
                            ].map((field) => {
                                const labels = {
                                    skillLanguages: "Languages",
                                    skillCloudDevOps: "Cloud/DevOps",
                                    skillFrameworks: "Frameworks",
                                    skillTools: "Tools",
                                    skillSoft: "Soft Skills",
                                };
                                return (
                                    <div
                                        key={field}
                                        className={styles.stackItem}
                                    >
                                        <label>{labels[field]}</label>
                                        {isEditing ? (
                                            <textarea
                                                name={field}
                                                className={styles.editTextarea}
                                                value={userProfile[field] || ""}
                                                onChange={handleProfileChange}
                                                placeholder={`e.g. Item 1, Item 2...`}
                                            />
                                        ) : (
                                            <p className={styles.viewStackText}>
                                                {userProfile[field] || "—"}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* General Skills */}
                    <div className={styles.dataCard}>
                        <div className={styles.cardTitle}>General Skills</div>
                        <div className={styles.skillsWrapper}>
                            {userProfile.skills.map((skill, i) => (
                                <span key={i} className={styles.skillTag}>
                                    {skill}
                                    {isEditing && (
                                        <button
                                            onClick={() =>
                                                handleRemoveSkill(skill)
                                            }
                                        >
                                            &times;
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>
                        {isEditing && (
                            <div className={styles.addSkillBox}>
                                <input
                                    value={skillInput}
                                    onChange={(e) =>
                                        setSkillInput(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && handleAddSkill()
                                    }
                                    placeholder="Add Skill"
                                />
                                <button onClick={handleAddSkill}>
                                    <AddIcon />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity (Sidebar) */}
                    <div className={styles.dataCard}>
                        <div className={styles.cardHeaderRow}>
                            <div className={styles.cardTitle}>
                                Recent Activity
                            </div>
                        </div>
                        <div className={styles.activityGrid}>
                            {userPosts.length > 0 ? (
                                <>
                                    {userPosts.slice(0, 4).map((post) => (
                                        <div
                                            key={post._id}
                                            className={styles.activityCard}
                                            onClick={() =>
                                                router.push(`/post/${post._id}`)
                                            }
                                        >
                                            {post.media ? (
                                                <div
                                                    className={
                                                        styles.mediaPreview
                                                    }
                                                >
                                                    <img
                                                        src={post.media}
                                                        alt="Post"
                                                        className={
                                                            styles.mediaImg
                                                        }
                                                    />
                                                </div>
                                            ) : null}
                                            <div className={styles.textPreview}>
                                                <TruncatedText
                                                    content={post.body}
                                                    postId={post._id}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {userPosts.length > 4 && (
                                        <button
                                            className={styles.viewAllBtn}
                                            onClick={() =>
                                                router.push(
                                                    `/dashboard?username=${userProfile.userId.username}`
                                                )
                                            }
                                        >
                                            View All Activity
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className={styles.emptyText}>
                                    No recent activity.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Connections List Modal --- */}
            {showConnectionsModal && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowConnectionsModal(false)}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxHeight: "70vh" }}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Connections</h3>
                            <button
                                onClick={() => setShowConnectionsModal(false)}
                                className={styles.closeBtn}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div
                            className={styles.connectionsList}
                            style={{ overflowY: "auto", padding: 10 }}
                        >
                            {acceptedConnectionsList.length > 0 ? (
                                acceptedConnectionsList.map((conn) => (
                                    <div
                                        key={conn._id}
                                        className={styles.connectionItem}
                                        onClick={() =>
                                            router.push(
                                                `/view_profile/${conn.username}`
                                            )
                                        }
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 12,
                                            padding: 10,
                                            cursor: "pointer",
                                            borderBottom:
                                                "1px solid rgba(255,255,255,0.05)",
                                        }}
                                    >
                                        <img
                                            src={conn.profilePicture}
                                            alt={conn.name}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                            }}
                                        />
                                        <div>
                                            <h4
                                                style={{
                                                    margin: 0,
                                                    color: "#fff",
                                                    fontSize: "0.95rem",
                                                }}
                                            >
                                                {conn.name}
                                            </h4>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    color: "#888",
                                                    fontSize: "0.8rem",
                                                }}
                                            >
                                                @{conn.username}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p
                                    className={styles.emptyText}
                                    style={{ textAlign: "center" }}
                                >
                                    No connections yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Edit Modal --- */}
            {modalMode && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h3>
                                {modalMode.includes("add")
                                    ? "Add Entry"
                                    : "Edit Entry"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className={styles.closeBtn}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            {modalMode.includes("work") && (
                                <>
                                    <input
                                        className={styles.modalInput}
                                        name="position"
                                        value={modalInput.position || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Position"
                                    />
                                    <input
                                        className={styles.modalInput}
                                        name="company"
                                        value={modalInput.company || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Company"
                                    />
                                    <input
                                        className={styles.modalInput}
                                        name="years"
                                        value={modalInput.years || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Duration (e.g. 2022 - 2023)"
                                    />
                                    <textarea
                                        className={styles.modalTextarea}
                                        name="description"
                                        value={modalInput.description || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Description"
                                    />
                                </>
                            )}
                            {/* ... Other modal cases (project, edu, cert, achieve) ... */}
                            {modalMode.includes("project") && (
                                <>
                                    <input
                                        className={styles.modalInput}
                                        name="title"
                                        value={modalInput.title || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Project Title"
                                    />
                                    <input
                                        className={styles.modalInput}
                                        name="link"
                                        value={modalInput.link || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Project Link"
                                    />
                                    <input
                                        className={styles.modalInput}
                                        name="duration"
                                        value={modalInput.duration || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Date"
                                    />
                                    <textarea
                                        className={styles.modalTextarea}
                                        name="description"
                                        value={modalInput.description || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="What did you build?"
                                    />
                                </>
                            )}
                            {modalMode.includes("edu") && (
                                <>
                                    <input
                                        className={styles.modalInput}
                                        name="school"
                                        value={modalInput.school || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="School"
                                    />
                                    <input
                                        className={styles.modalInput}
                                        name="degree"
                                        value={modalInput.degree || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Degree"
                                    />
                                    <input
                                        className={styles.modalInput}
                                        name="fieldOfStudy"
                                        value={modalInput.fieldOfStudy || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Field of Study"
                                    />
                                    <input
                                        className={styles.modalInput}
                                        name="years"
                                        value={modalInput.years || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Graduation Year"
                                    />
                                </>
                            )}
                            {modalMode.includes("cert") && (
                                <>
                                    <input
                                        className={styles.modalInput}
                                        name="name"
                                        value={modalInput.name || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Certificate Name"
                                    />
                                    <input
                                        className={styles.modalInput}
                                        name="link"
                                        value={modalInput.link || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Credential URL"
                                    />
                                    <input
                                        className={styles.modalInput}
                                        name="date"
                                        value={modalInput.date || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Date Issued"
                                    />
                                </>
                            )}
                            {modalMode.includes("achieve") && (
                                <>
                                    <input
                                        className={styles.modalInput}
                                        name="title"
                                        value={modalInput.title || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Title"
                                    />
                                    <input
                                        className={styles.modalInput}
                                        name="date"
                                        value={modalInput.date || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Date"
                                    />
                                    <textarea
                                        className={styles.modalTextarea}
                                        name="description"
                                        value={modalInput.description || ""}
                                        onChange={handleModalInputChange}
                                        placeholder="Details"
                                    />
                                </>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                onClick={handleModalSave}
                                className={styles.confirmBtn}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

Profilepage.getLayout = (page) => (
    <UserLayout>
        <DashboardLayout>{page}</DashboardLayout>
    </UserLayout>
);
