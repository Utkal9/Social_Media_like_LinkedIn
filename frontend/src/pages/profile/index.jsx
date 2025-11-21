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

const isVideo = (fileType, mediaUrl) => {
    if (fileType && fileType.startsWith("video/")) return true;
    if (mediaUrl) {
        const ext = mediaUrl.split(".").pop().toLowerCase();
        return ["mp4", "webm", "ogg", "mov"].includes(ext);
    }
    return false;
};

// --- Icons ---
const AddIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="24"
    >
        <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
    </svg>
);
const EditIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="18"
    >
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
);
const DeleteIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="18"
    >
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
);
const CameraIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="20"
    >
        <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
        <path
            fillRule="evenodd"
            d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
            clipRule="evenodd"
        />
    </svg>
);
const CloseIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        width="20"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
        />
    </svg>
);
const DownloadIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        width="24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
    </svg>
);

const TruncatedText = ({ content, postId }) => {
    const router = useRouter();
    if (content.length <= 100)
        return <p className={styles.postCardBody}>{content}</p>;
    return (
        <p className={styles.postCardBody}>
            {content.substring(0, 100)}...
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

export default function Profilepage() {
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const postReducer = useSelector((state) => state.postReducer);

    const [userProfile, setUserProfile] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [modalMode, setModalMode] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalInput, setModalInput] = useState({});
    const [skillInput, setSkillInput] = useState("");
    const [showConnectionsModal, setShowConnectionsModal] = useState(false);

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
        }
    }, [authState.user, postReducer.posts]);

    const acceptedConnectionsList = useMemo(() => {
        const connections = Array.isArray(authState.connections)
            ? authState.connections
            : [];
        const connectionRequests = Array.isArray(authState.connectionRequest)
            ? authState.connectionRequest
            : [];

        const received = connections
            .filter((req) => req.status_accepted)
            .map((req) => req.userId);
        const sent = connectionRequests
            .filter((req) => req.status_accepted)
            .map((req) => req.connectionId);
        return [...received, ...sent].filter((u) => u);
    }, [authState.connections, authState.connectionRequest]);

    const connectionCount = acceptedConnectionsList.length;

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

    const syncProfileToBackend = async (updatedProfile) => {
        try {
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
            console.error("Sync failed", err);
            alert("Failed to save changes.");
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
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

    const handleSaveChanges = () => {
        syncProfileToBackend(userProfile);
        alert("Profile updated!");
    };

    // --- UPDATED DOWNLOAD HANDLER FOR DOCX ---
    const handleDownloadResume = async () => {
        if (!userProfile || !userProfile.userId?._id) return;
        try {
            const response = await clientServer.get(
                `/user/download_resume?id=${userProfile.userId._id}`,
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            // Change extension to .docx
            link.setAttribute(
                "download",
                `${userProfile.userId.username}_resume.docx`
            );
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert("Error: Could not generate resume.");
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
            syncProfileToBackend(updatedProfile);
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        const updatedSkills = userProfile.skills.filter(
            (s) => s !== skillToRemove
        );
        const updatedProfile = { ...userProfile, skills: updatedSkills };
        setUserProfile(updatedProfile);
        syncProfileToBackend(updatedProfile);
    };

    const openModal = (mode, item = null, index = -1) => {
        setModalMode(mode);
        setSelectedItem({ ...item, index });
        if (mode.includes("work"))
            setModalInput(
                item || {
                    company: "",
                    position: "",
                    years: "",
                    description: "",
                }
            );
        else if (mode.includes("edu"))
            setModalInput(
                item || {
                    school: "",
                    degree: "",
                    fieldOfStudy: "",
                    years: "",
                    grade: "",
                    location: "", // NEW
                }
            );
        else if (mode.includes("project"))
            setModalInput(
                item || { title: "", link: "", duration: "", description: "" }
            );
        else if (mode.includes("cert"))
            setModalInput(item || { name: "", link: "", date: "" });
        else if (mode.includes("achieve"))
            setModalInput(item || { title: "", description: "", date: "" }); // NEW
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedItem(null);
        setModalInput({});
    };

    const handleModalInputChange = (e) => {
        const { name, value } = e.target;
        setModalInput({ ...modalInput, [name]: value });
    };

    const handleModalSave = () => {
        let updatedProfile = { ...userProfile };
        const updateArray = (arrName) => {
            let arr = [...(updatedProfile[arrName] || [])];
            if (modalMode.includes("edit"))
                arr[selectedItem.index] = modalInput;
            else arr.push(modalInput);
            updatedProfile[arrName] = arr;
        };

        if (modalMode.includes("work")) updateArray("pastWork");
        else if (modalMode.includes("edu")) updateArray("education");
        else if (modalMode.includes("project")) updateArray("projects");
        else if (modalMode.includes("cert")) updateArray("certificates");
        else if (modalMode.includes("achieve")) updateArray("achievements");

        setUserProfile(updatedProfile);
        syncProfileToBackend(updatedProfile);
        closeModal();
    };

    const handleItemDelete = (type, index) => {
        if (window.confirm("Delete this item?")) {
            let updatedProfile = { ...userProfile };
            if (type === "work")
                updatedProfile.pastWork = updatedProfile.pastWork.filter(
                    (_, i) => i !== index
                );
            else if (type === "edu")
                updatedProfile.education = updatedProfile.education.filter(
                    (_, i) => i !== index
                );
            else if (type === "projects")
                updatedProfile.projects = updatedProfile.projects.filter(
                    (_, i) => i !== index
                );
            else if (type === "certificates")
                updatedProfile.certificates =
                    updatedProfile.certificates.filter((_, i) => i !== index);
            else if (type === "achievements")
                updatedProfile.achievements =
                    updatedProfile.achievements.filter((_, i) => i !== index);

            setUserProfile(updatedProfile);
            syncProfileToBackend(updatedProfile);
        }
    };

    if (!userProfile) return <h2>Loading Profile...</h2>;

    return (
        <div className={styles.container}>
            <div className={styles.profileHeaderCard}>
                <div
                    className={styles.backDropContainer}
                    style={{
                        backgroundImage: `url("${
                            userProfile.userId.backgroundPicture || DEFAULT_BG
                        }")`,
                    }}
                >
                    <button
                        onClick={handleDownloadResume}
                        title="Download Resume"
                        className={styles.downloadResumeBtn}
                    >
                        <DownloadIcon />
                    </button>

                    <label htmlFor="bgUpload" className={styles.editCoverBtn}>
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
                    <div className={styles.avatarSection}>
                        <div className={styles.profilePicWrapper}>
                            <img
                                src={userProfile.userId.profilePicture}
                                alt="Profile"
                                className={styles.profilePic}
                            />
                            <label
                                htmlFor="pfpUpload"
                                className={styles.editPfpBtn}
                            >
                                <EditIcon />
                            </label>
                            <input
                                id="pfpUpload"
                                type="file"
                                hidden
                                onChange={(e) =>
                                    e.target.files[0] &&
                                    uploadImage(e.target.files[0], "profile")
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.profileInfoSection}>
                    <div className={styles.infoTopRow}>
                        <button
                            className={styles.saveButton}
                            onClick={handleSaveChanges}
                        >
                            Save Changes
                        </button>
                    </div>
                    <div className={styles.mainInfo}>
                        <input
                            name="name"
                            className={styles.nameInput}
                            value={userProfile.userId.name}
                            onChange={handleProfileChange}
                            placeholder="Full Name"
                        />
                        <input
                            name="currentPost"
                            className={styles.headlineInput}
                            value={userProfile.currentPost}
                            onChange={handleProfileChange}
                            placeholder="Headline"
                        />

                        <div className={styles.metaInfo}>
                            <span className={styles.metaItem}>
                                @{userProfile.userId.username}
                            </span>
                            <span className={styles.dot}>•</span>
                            <span
                                className={styles.connectionCount}
                                onClick={() => setShowConnectionsModal(true)}
                            >
                                {connectionCount} connections
                            </span>
                            <span className={styles.dot}>•</span>
                            <input
                                name="email"
                                className={styles.emailInput}
                                value={userProfile.userId.email}
                                onChange={handleProfileChange}
                                placeholder="Email"
                            />
                        </div>

                        <div
                            style={{
                                marginTop: "10px",
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "10px",
                            }}
                        >
                            <input
                                className={styles.modalInput}
                                name="phoneNumber"
                                value={userProfile.phoneNumber || ""}
                                onChange={handleProfileChange}
                                placeholder="Phone Number"
                            />
                            <input
                                className={styles.modalInput}
                                name="linkedin"
                                value={userProfile.linkedin || ""}
                                onChange={handleProfileChange}
                                placeholder="LinkedIn URL"
                            />
                            <input
                                className={styles.modalInput}
                                name="github"
                                value={userProfile.github || ""}
                                onChange={handleProfileChange}
                                placeholder="GitHub URL"
                            />
                            <input
                                className={styles.modalInput}
                                name="leetcode"
                                value={userProfile.leetcode || ""}
                                onChange={handleProfileChange}
                                placeholder="LeetCode URL"
                            />
                        </div>

                        <textarea
                            name="bio"
                            value={userProfile.bio}
                            onChange={handleProfileChange}
                            className={styles.bioInput}
                            placeholder="Write about yourself..."
                        />
                    </div>
                </div>
            </div>

            {/* --- RESUME SPECIFIC SKILLS SECTION (NEW) --- */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Resume Specific Skills</h4>
                    <button
                        className={styles.saveButton}
                        style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                        onClick={handleSaveChanges}
                    >
                        Save
                    </button>
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                    }}
                >
                    <input
                        className={styles.modalInput}
                        name="skillLanguages"
                        placeholder="Languages (e.g. C++, Java)"
                        value={userProfile.skillLanguages || ""}
                        onChange={handleProfileChange}
                    />
                    <input
                        className={styles.modalInput}
                        name="skillCloudDevOps"
                        placeholder="Cloud & DevOps (e.g. AWS, Docker)"
                        value={userProfile.skillCloudDevOps || ""}
                        onChange={handleProfileChange}
                    />
                    <input
                        className={styles.modalInput}
                        name="skillFrameworks"
                        placeholder="Frameworks (e.g. React, Node)"
                        value={userProfile.skillFrameworks || ""}
                        onChange={handleProfileChange}
                    />
                    <input
                        className={styles.modalInput}
                        name="skillTools"
                        placeholder="Tools (e.g. Git, Postman)"
                        value={userProfile.skillTools || ""}
                        onChange={handleProfileChange}
                    />
                    <input
                        className={styles.modalInput}
                        name="skillSoft"
                        placeholder="Soft Skills (e.g. Leadership)"
                        value={userProfile.skillSoft || ""}
                        onChange={handleProfileChange}
                    />
                </div>
            </div>

            {/* General Skills (Legacy) */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Profile Skills</h4>
                </div>
                <div className={styles.skillsContainer}>
                    {userProfile.skills.map((skill, idx) => (
                        <span key={idx} className={styles.skillChip}>
                            {skill}
                            <button onClick={() => handleRemoveSkill(skill)}>
                                &times;
                            </button>
                        </span>
                    ))}
                    <div className={styles.addSkillWrapper}>
                        <input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && handleAddSkill()
                            }
                            placeholder="Add a skill..."
                        />
                        <button onClick={handleAddSkill}>
                            <AddIcon />
                        </button>
                    </div>
                </div>
            </div>

            {/* Work History */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Experience</h4>
                    <button
                        className={styles.iconBtn}
                        onClick={() => openModal("add-work")}
                    >
                        <AddIcon />
                    </button>
                </div>
                <div className={styles.listContainer}>
                    {userProfile.pastWork.map((work, index) => (
                        <div key={index} className={styles.listItem}>
                            <div className={styles.listInfo}>
                                <h5>{work.position}</h5>
                                <p>{work.company}</p>
                                <span>{work.years}</span>
                                <p
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#555",
                                    }}
                                >
                                    {work.description}
                                </p>
                            </div>
                            <div className={styles.listActions}>
                                <button
                                    onClick={() =>
                                        openModal("edit-work", work, index)
                                    }
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={() =>
                                        handleItemDelete("work", index)
                                    }
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Education */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Education</h4>
                    <button
                        className={styles.iconBtn}
                        onClick={() => openModal("add-edu")}
                    >
                        <AddIcon />
                    </button>
                </div>
                <div className={styles.listContainer}>
                    {userProfile.education.map((edu, index) => (
                        <div key={index} className={styles.listItem}>
                            <div className={styles.listInfo}>
                                <h5>{edu.school}</h5>
                                <p>
                                    {edu.degree}, {edu.fieldOfStudy}
                                </p>
                                <span>{edu.years}</span>
                                {edu.location && (
                                    <span style={{ color: "#333" }}>
                                        {edu.location}
                                    </span>
                                )}
                            </div>
                            <div className={styles.listActions}>
                                <button
                                    onClick={() =>
                                        openModal("edit-edu", edu, index)
                                    }
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={() =>
                                        handleItemDelete("edu", index)
                                    }
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Projects Section */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Projects</h4>
                    <button
                        className={styles.iconBtn}
                        onClick={() => openModal("add-project")}
                    >
                        <AddIcon />
                    </button>
                </div>
                <div className={styles.listContainer}>
                    {(userProfile.projects || []).map((proj, index) => (
                        <div key={index} className={styles.listItem}>
                            <div className={styles.listInfo}>
                                <h5>{proj.title}</h5>
                                <p
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#555",
                                    }}
                                >
                                    {proj.description}
                                </p>
                                <span
                                    style={{
                                        fontSize: "0.8rem",
                                        color: "#777",
                                    }}
                                >
                                    {proj.duration}
                                </span>
                                {proj.link && (
                                    <a
                                        href={proj.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            fontSize: "0.8rem",
                                            color: "#0a66c2",
                                            display: "block",
                                        }}
                                    >
                                        Link
                                    </a>
                                )}
                            </div>
                            <div className={styles.listActions}>
                                <button
                                    onClick={() =>
                                        openModal("edit-project", proj, index)
                                    }
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={() =>
                                        handleItemDelete("projects", index)
                                    }
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Certificates Section */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Certificates</h4>
                    <button
                        className={styles.iconBtn}
                        onClick={() => openModal("add-cert")}
                    >
                        <AddIcon />
                    </button>
                </div>
                <div className={styles.listContainer}>
                    {(userProfile.certificates || []).map((cert, index) => (
                        <div key={index} className={styles.listItem}>
                            <div className={styles.listInfo}>
                                <h5>{cert.name}</h5>
                                <span>{cert.date}</span>
                                {cert.link && (
                                    <a
                                        href={cert.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            fontSize: "0.8rem",
                                            color: "#0a66c2",
                                            marginLeft: "10px",
                                        }}
                                    >
                                        View
                                    </a>
                                )}
                            </div>
                            <div className={styles.listActions}>
                                <button
                                    onClick={() =>
                                        openModal("edit-cert", cert, index)
                                    }
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={() =>
                                        handleItemDelete("certificates", index)
                                    }
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Achievements Section */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Achievements</h4>
                    <button
                        className={styles.iconBtn}
                        onClick={() => openModal("add-achieve")}
                    >
                        <AddIcon />
                    </button>
                </div>
                <div className={styles.listContainer}>
                    {(userProfile.achievements || []).map((achieve, index) => (
                        <div key={index} className={styles.listItem}>
                            <div className={styles.listInfo}>
                                <h5>{achieve.title}</h5>
                                <span>{achieve.date}</span>
                                <p
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "#555",
                                    }}
                                >
                                    {achieve.description}
                                </p>
                            </div>
                            <div className={styles.listActions}>
                                <button
                                    onClick={() =>
                                        openModal(
                                            "edit-achieve",
                                            achieve,
                                            index
                                        )
                                    }
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={() =>
                                        handleItemDelete("achievements", index)
                                    }
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Recent Activity</h4>
                </div>
                <div className={styles.activityContainer}>
                    {userPosts.length > 0 ? (
                        userPosts.map((post) => (
                            <div
                                className={styles.postCard}
                                key={post._id}
                                onClick={() => router.push(`/post/${post._id}`)}
                            >
                                <div className={styles.mediaPreview}>
                                    {post.media ? (
                                        isVideo(post.fileType, post.media) ? (
                                            <video
                                                src={post.media}
                                                className={styles.postCardImage}
                                                muted
                                            />
                                        ) : (
                                            <img
                                                src={post.media}
                                                alt="Post media"
                                                className={styles.postCardImage}
                                            />
                                        )
                                    ) : (
                                        <div className={styles.textOnlyPreview}>
                                            <p>
                                                {post.body.substring(0, 100)}...
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.postCardFooter}>
                                    <TruncatedText
                                        content={post.body}
                                        postId={post._id}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: "#666", fontStyle: "italic" }}>
                            No recent activity.
                        </p>
                    )}
                </div>
            </div>

            {/* Main Edit Modal */}
            {modalMode && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div
                        className={styles.modalBox}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>
                            {modalMode.includes("add") ? "Add" : "Edit"} Item
                        </h3>

                        {modalMode.includes("work") && (
                            <>
                                <input
                                    className={styles.modalInput}
                                    name="position"
                                    value={modalInput.position || ""}
                                    onChange={handleModalInputChange}
                                    placeholder="Title (e.g. Manager)"
                                />
                                <input
                                    className={styles.modalInput}
                                    name="company"
                                    value={modalInput.company || ""}
                                    onChange={handleModalInputChange}
                                    placeholder="Company Name"
                                />
                                <input
                                    className={styles.modalInput}
                                    name="years"
                                    value={modalInput.years || ""}
                                    onChange={handleModalInputChange}
                                    placeholder="Years (e.g. 2020 - 2022)"
                                />
                                <textarea
                                    className={styles.modalInput}
                                    name="description"
                                    value={modalInput.description || ""}
                                    onChange={handleModalInputChange}
                                    placeholder="Description (Each line will be a bullet point)"
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
                                    placeholder="School / University"
                                />
                                {/* NEW LOCATION INPUT */}
                                <input
                                    className={styles.modalInput}
                                    name="location"
                                    value={modalInput.location || ""}
                                    onChange={handleModalInputChange}
                                    placeholder="Location (e.g. Punjab, India)"
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
                                    placeholder="Year (e.g. 2019 - 2023)"
                                />
                                <input
                                    className={styles.modalInput}
                                    name="grade"
                                    value={modalInput.grade || ""}
                                    onChange={handleModalInputChange}
                                    placeholder="Grade/CGPA"
                                />
                            </>
                        )}

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
                                    placeholder="Duration (e.g. Oct 2023)"
                                />
                                <textarea
                                    className={styles.modalInput}
                                    name="description"
                                    value={modalInput.description || ""}
                                    onChange={handleModalInputChange}
                                    placeholder="Description (Each line will be a bullet point)"
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
                                    placeholder="Achievement Title"
                                />
                                {/* NEW DATE INPUT */}
                                <input
                                    className={styles.modalInput}
                                    name="date"
                                    value={modalInput.date || ""}
                                    onChange={handleModalInputChange}
                                    placeholder="Date (e.g. Nov 2024)"
                                />

                                <textarea
                                    className={styles.modalInput}
                                    name="description"
                                    value={modalInput.description || ""}
                                    onChange={handleModalInputChange}
                                    placeholder="Details (Each line will be a bullet point)"
                                />
                            </>
                        )}

                        <button
                            className={styles.modalSaveBtn}
                            onClick={handleModalSave}
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}

            {/* Connections Modal */}
            {showConnectionsModal && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowConnectionsModal(false)}
                >
                    <div
                        className={styles.modalBox}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Connections</h3>
                            <button
                                onClick={() => setShowConnectionsModal(false)}
                                className={styles.closeIcon}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className={styles.connectionsList}>
                            {acceptedConnectionsList.length > 0 ? (
                                acceptedConnectionsList.map((conn) => (
                                    <div
                                        key={conn._id}
                                        className={styles.connectionItem}
                                        onClick={() => {
                                            setShowConnectionsModal(false);
                                            router.push(
                                                `/view_profile/${conn.username}`
                                            );
                                        }}
                                    >
                                        <img
                                            src={conn.profilePicture}
                                            alt={conn.name}
                                            className={styles.connectionAvatar}
                                        />
                                        <div>
                                            <p
                                                className={
                                                    styles.connectionName
                                                }
                                            >
                                                {conn.name}
                                            </p>
                                            <p
                                                className={
                                                    styles.connectionUsername
                                                }
                                            >
                                                @{conn.username}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.noConnectionsText}>
                                    No connections yet.
                                </p>
                            )}
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
