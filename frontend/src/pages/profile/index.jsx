// frontend/src/pages/profile/index.jsx

import React, { useEffect, useState } from "react";
import styles from "./index.module.css";
import { useDispatch, useSelector } from "react-redux";
import { getAboutUser } from "@/config/redux/action/authAction";
import clientServer from "@/config"; // <-- BASE_URL not needed for images
import UserLayout from "@/layout/UserLayout"; // Import
import DashboardLayout from "@/layout/DashboardLayout"; // Import
import { getAllPosts } from "@/config/redux/action/postAction";

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
// --- End Icons ---

export default function Profilepage() {
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const postReducer = useSelector((state) => state.postReducer);

    const [userProfile, setUserProfile] = useState(null); // Start as null
    const [userPosts, setUserPosts] = useState([]);

    // Modal State
    const [modalMode, setModalMode] = useState(null); // null, 'add-work', 'edit-work'
    const [selectedWorkItem, setSelectedWorkItem] = useState(null); // For editing
    const [workInput, setWorkInput] = useState({
        company: "",
        position: "",
        years: "",
    });
    const [profilePicError, setProfilePicError] = useState("");

    // Fetch data
    useEffect(() => {
        dispatch(getAboutUser({ token: localStorage.getItem("token") }));
        dispatch(getAllPosts());
    }, [dispatch]);

    // Set local profile state once auth data arrives
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

    // Handler for profile picture upload
    const updateProfilePicture = async (fileToUpload) => {
        try {
            const formData = new FormData();
            formData.append("profile_picture", fileToUpload);
            formData.append("token", localStorage.getItem("token"));

            await clientServer.post("/update_profile_picture", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            dispatch(getAboutUser({ token: localStorage.getItem("token") }));
        } catch (error) {
            console.error("Failed to upload picture:", error);
            setProfilePicError("Upload failed. Please try again.");
        }
    };

    // Handler for saving name, bio, etc.
    const updateProfileData = async () => {
        // 1. Update User (name)
        await clientServer.post("/user_update", {
            token: localStorage.getItem("token"),
            name: userProfile.userId.name,
        });
        // 2. Update Profile (bio, work, etc.)
        await clientServer.post("/update_profile_data", {
            token: localStorage.getItem("token"),
            bio: userProfile.bio,
            currentPost: userProfile.currentPost,
            pastWork: userProfile.pastWork,
            education: userProfile.education,
        });
        alert("Profile Updated!");
    };

    // Generic handler for text input changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        // This is complex because name is nested
        if (name === "name") {
            setUserProfile({
                ...userProfile,
                userId: { ...userProfile.userId, name: value },
            });
        } else {
            setUserProfile({ ...userProfile, [name]: value });
        }
    };

    // --- Modal Handlers ---
    const openModal = (mode, item = null, index = -1) => {
        setModalMode(mode);
        if (mode === "edit-work" && item) {
            setSelectedWorkItem({ ...item, index }); // Store item and its index
            setWorkInput(item);
        } else {
            setSelectedWorkItem(null);
            setWorkInput({ company: "", position: "", years: "" });
        }
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedWorkItem(null);
    };

    const handleWorkInputChange = (e) => {
        const { name, value } = e.target;
        setWorkInput({ ...workInput, [name]: value });
    };

    const handleWorkSave = () => {
        let updatedPastWork = [...userProfile.pastWork];
        if (modalMode === "edit-work") {
            // Update existing item
            updatedPastWork[selectedWorkItem.index] = workInput;
        } else {
            // Add new item
            updatedPastWork.push(workInput);
        }
        setUserProfile({ ...userProfile, pastWork: updatedPastWork });
        closeModal();
    };

    const handleWorkDelete = (index) => {
        if (
            window.confirm(
                "Are you sure you want to delete this work experience?"
            )
        ) {
            const updatedPastWork = userProfile.pastWork.filter(
                (_, i) => i !== index
            );
            setUserProfile({ ...userProfile, pastWork: updatedPastWork });
        }
    };

    if (!userProfile) {
        // <UserLayout><DashboardLayout> ... </DashboardLayout></UserLayout> <-- REMOVED
        return <h2>Loading Profile...</h2>;
    }

    // <UserLayout><DashboardLayout> ... </DashboardLayout></UserLayout> <-- REMOVED
    return (
        <>
            <div className={styles.container}>
                {/* --- 1. Profile Header Card --- */}
                <div className={styles.profileHeaderCard}>
                    <div className={styles.backDropContainer}>
                        <label
                            htmlFor="profilePictureUpload"
                            className={styles.backDrop_overlay}
                        >
                            <EditIcon /> <p>Edit</p>
                        </label>
                        <input
                            onChange={(e) => {
                                const file = e.target.files[0];
                                const TEN_MB = 10 * 1024 * 1024;

                                if (file && file.size > TEN_MB) {
                                    setProfilePicError(
                                        "File is too large. Please select a file under 10MB."
                                    );
                                    e.target.value = null; // reset input
                                } else if (file) {
                                    setProfilePicError(""); // Clear error
                                    updateProfilePicture(file); // Upload immediately
                                } else {
                                    setProfilePicError(""); // Clear error
                                }
                            }}
                            hidden
                            type="file"
                            id="profilePictureUpload"
                        />
                        {/* --- FIX: Removed ${BASE_URL}/ --- */}
                        <img
                            src={userProfile.userId.profilePicture}
                            alt="backDrop"
                            className={styles.profilePic}
                        />
                        {/* --- END FIX --- */}
                    </div>
                    {profilePicError && (
                        <p
                            style={{
                                color: "red",
                                fontSize: "0.9rem",
                                textAlign: "end",
                                marginTop: "0.5rem",
                            }}
                        >
                            {profilePicError}
                        </p>
                    )}
                    <div className={styles.profileHeaderContent}>
                        <button
                            className={styles.saveChangesButton}
                            onClick={updateProfileData}
                        >
                            Save Changes
                        </button>
                        <input
                            name="name"
                            className={styles.nameEdit}
                            type="text"
                            value={userProfile.userId.name}
                            onChange={handleProfileChange}
                        />
                        <p style={{ color: "grey" }}>
                            @{userProfile.userId.username}
                        </p>
                        <textarea
                            name="bio"
                            value={userProfile.bio}
                            onChange={handleProfileChange}
                            className={styles.bioEdit}
                            placeholder="Write your bio..."
                            rows={Math.max(
                                2,
                                Math.ceil(userProfile.bio.length / 80)
                            )}
                        />
                    </div>
                </div>

                {/* --- 2. Work History Card --- */}
                <div className={styles.profileSectionCard}>
                    <div className={styles.sectionHeader}>
                        <h4>Work History</h4>
                        <button
                            className={styles.iconButton}
                            onClick={() => openModal("add-work")}
                        >
                            <AddIcon />
                        </button>
                    </div>
                    <div className={styles.workHistoryContainer}>
                        {userProfile.pastWork.map((work, index) => (
                            <div key={index} className={styles.workHistoryCard}>
                                <div className={styles.workInfo}>
                                    <p className={styles.workPosition}>
                                        {work.position}
                                    </p>
                                    <p className={styles.workCompany}>
                                        {work.company}
                                    </p>
                                    <p className={styles.workYears}>
                                        {work.years} years
                                    </p>
                                </div>
                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.iconButton}
                                        onClick={() =>
                                            openModal("edit-work", work, index)
                                        }
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        className={styles.iconButton}
                                        onClick={() => handleWorkDelete(index)}
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- 3. Recent Activity Card --- */}
                <div className={styles.profileSectionCard}>
                    <div className={styles.sectionHeader}>
                        <h4>Recent Activity</h4>
                    </div>
                    <div className={styles.activityContainer}>
                        {userPosts.length > 0 ? (
                            userPosts.map((post) => (
                                <div className={styles.postCard} key={post._id}>
                                    <div className={styles.card}>
                                        {post.media && (
                                            /* --- FIX: Removed ${BASE_URL}/ --- */
                                            <img
                                                src={post.media}
                                                alt="Post media"
                                                className={styles.postCardImage}
                                            />
                                            /* --- END FIX --- */
                                        )}
                                        <p className={styles.postCardBody}>
                                            {post.body}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Re-usable Work Modal --- */}
            {(modalMode === "add-work" || modalMode === "edit-work") && (
                <div className={styles.modalBackdrop} onClick={closeModal}>
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>
                            {modalMode === "add-work"
                                ? "Add Work Experience"
                                : "Edit Work Experience"}
                        </h3>
                        <input
                            onChange={handleWorkInputChange}
                            name="company"
                            value={workInput.company}
                            className={styles.inputField}
                            type="text"
                            placeholder="Company (e.g., Google)"
                        />
                        <input
                            onChange={handleWorkInputChange}
                            name="position"
                            value={workInput.position}
                            className={styles.inputField}
                            type="text"
                            placeholder="Position (e.g., Software Engineer)"
                        />
                        <input
                            onChange={handleWorkInputChange}
                            name="years"
                            value={workInput.years}
                            className={styles.inputField}
                            type="number"
                            placeholder="Years (e.g., 2)"
                        />
                        <button
                            onClick={handleWorkSave}
                            className={styles.saveModalButton}
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

// ADDED THIS:
Profilepage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};
