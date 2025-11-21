import clientServer from "@/config";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useState } from "react";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAllPosts } from "@/config/redux/action/postAction";
import {
    getConnectionsRequest,
    getMyConnectionRequests,
    sendConnectionRequest,
    getAboutUser,
} from "@/config/redux/action/authAction";
import { useSocket } from "@/context/SocketContext";

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
const MessageIcon = () => (
    <svg
        style={{ width: "1.2em", height: "1.2em" }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
        />
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

const TruncatedText = ({ content, postId }) => {
    const router = useRouter();
    if (content.length <= 300)
        return <p className={styles.postCardBody}>{content}</p>;
    return (
        <p className={styles.postCardBody}>
            {content.substring(0, 300)}...
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

export default function ViewProfilePage({ userProfile }) {
    const router = useRouter();
    const postReducer = useSelector((state) => state.postReducer);
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const { onlineStatuses } = useSocket() || {};

    const [localProfile, setLocalProfile] = useState(userProfile);
    const [userPosts, setUserPosts] = useState([]);
    const [connectStatus, setConnectStatus] = useState("Connect");
    const [showConnectionsModal, setShowConnectionsModal] = useState(false);

    const isOwnProfile =
        authState.user && authState.user.userId._id === localProfile.userId._id;

    useEffect(() => {
        setLocalProfile(userProfile);
    }, [userProfile]);

    useEffect(() => {
        let post = postReducer.posts.filter((post) => {
            return post.userId.username === router.query.username;
        });
        setUserPosts(post);
    }, [postReducer.posts, router.query.username]);

    useEffect(() => {
        if (isOwnProfile) return;

        // --- FIX: Safety Check for Arrays ---
        const requestsReceived = Array.isArray(authState.connectionRequest)
            ? authState.connectionRequest
            : [];
        const requestsSent = Array.isArray(authState.connections)
            ? authState.connections
            : [];

        const isConnectedRec = requestsReceived.some(
            (req) =>
                req.userId?._id === localProfile.userId._id &&
                req.status_accepted === true
        );
        const isConnectedSent = requestsSent.some(
            (req) =>
                req.connectionId?._id === localProfile.userId._id &&
                req.status_accepted === true
        );
        if (isConnectedRec || isConnectedSent) {
            setConnectStatus("Connected");
            return;
        }

        const isPending = requestsSent.some(
            (req) =>
                req.connectionId?._id === localProfile.userId._id &&
                req.status_accepted === null
        );
        if (isPending) {
            setConnectStatus("Pending");
            return;
        }

        const hasRequested = requestsReceived.some(
            (req) =>
                req.userId?._id === localProfile.userId._id &&
                req.status_accepted === null
        );
        if (hasRequested) {
            setConnectStatus("Pending");
            return;
        }

        setConnectStatus("Connect");
    }, [
        authState.connections,
        authState.connectionRequest,
        localProfile.userId._id,
        isOwnProfile,
    ]);

    useEffect(() => {
        dispatch(getAllPosts());
        const token = localStorage.getItem("token");
        if (token) {
            dispatch(getConnectionsRequest({ token }));
            dispatch(getMyConnectionRequests({ token }));
        }
    }, [dispatch]);

    const handleConnect = () => {
        dispatch(
            sendConnectionRequest({
                token: localStorage.getItem("token"),
                user_id: localProfile.userId._id,
            })
        );
        setConnectStatus("Pending");
    };

    const uploadBackground = async (file) => {
        try {
            const formData = new FormData();
            formData.append("background_picture", file);
            formData.append("token", localStorage.getItem("token"));
            const response = await clientServer.post(
                "/update_background_picture",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            setLocalProfile((prev) => ({
                ...prev,
                userId: {
                    ...prev.userId,
                    backgroundPicture: response.data.url,
                },
            }));
            dispatch(getAboutUser({ token: localStorage.getItem("token") }));
        } catch (error) {
            alert("Failed to upload background.");
        }
    };

    const handleMessage = () => {
        router.push(`/messaging?chatWith=${localProfile.userId.username}`);
    };

    const isOnline =
        onlineStatuses && onlineStatuses[localProfile.userId._id]
            ? onlineStatuses[localProfile.userId._id].isOnline
            : localProfile.userId.isOnline;

    return (
        <div className={styles.container}>
            <div className={styles.profileHeaderCard}>
                <div
                    className={styles.backDropContainer}
                    style={{
                        backgroundImage: `url("${
                            localProfile.userId.backgroundPicture || DEFAULT_BG
                        }")`,
                    }}
                >
                    {isOwnProfile && (
                        <>
                            <label
                                htmlFor="bgUpload"
                                className={styles.editCoverBtn}
                            >
                                <CameraIcon />
                            </label>
                            <input
                                id="bgUpload"
                                type="file"
                                hidden
                                onChange={(e) =>
                                    e.target.files[0] &&
                                    uploadBackground(e.target.files[0])
                                }
                            />
                        </>
                    )}
                    <div className={styles.avatarWrapper}>
                        <img
                            src={localProfile.userId.profilePicture}
                            alt="Profile"
                            className={styles.profilePic}
                        />
                        {isOnline && <span className={styles.onlineDot}></span>}
                    </div>
                </div>
                <div className={styles.profileHeaderContent}>
                    <div className={styles.profileHeaderActions}>
                        {!isOwnProfile && (
                            <button
                                className={styles.iconActionButton}
                                onClick={handleMessage}
                                title="Message"
                            >
                                <MessageIcon />
                            </button>
                        )}
                        {!isOwnProfile && (
                            <button
                                onClick={handleConnect}
                                className={
                                    connectStatus === "Connect"
                                        ? styles.connectBtn
                                        : styles.connectedButton
                                }
                                disabled={connectStatus !== "Connect"}
                            >
                                {connectStatus}
                            </button>
                        )}
                    </div>
                    <h2 className={styles.nameDisplay}>
                        {localProfile.userId.name}
                    </h2>
                    <p className={styles.usernameDisplay}>
                        @{localProfile.userId.username}
                    </p>

                    <div className={styles.metaInfo}>
                        <span
                            className={styles.connectionCount}
                            onClick={() => setShowConnectionsModal(true)}
                        >
                            {localProfile.connectionCount || 0} connections
                        </span>
                    </div>

                    {/* Contact Info Display - Visible to everyone now */}
                    <div
                        style={{
                            display: "flex",
                            gap: "15px",
                            marginTop: "10px",
                            fontSize: "0.9rem",
                            color: "#555",
                            flexWrap: "wrap",
                        }}
                    >
                        {localProfile.phoneNumber && (
                            <span>📞 {localProfile.phoneNumber}</span>
                        )}
                        {localProfile.linkedin && (
                            <a
                                href={localProfile.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    color: "#0a66c2",
                                    textDecoration: "none",
                                }}
                            >
                                LinkedIn
                            </a>
                        )}
                        {localProfile.github && (
                            <a
                                href={localProfile.github}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    color: "#333",
                                    textDecoration: "none",
                                }}
                            >
                                GitHub
                            </a>
                        )}
                        {localProfile.leetcode && (
                            <a
                                href={localProfile.leetcode}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    color: "#e67e22",
                                    textDecoration: "none",
                                }}
                            >
                                LeetCode
                            </a>
                        )}
                    </div>

                    <p className={styles.bioDisplay}>{localProfile.bio}</p>
                </div>
            </div>

            {/* Skills */}
            {localProfile.skills && localProfile.skills.length > 0 && (
                <div className={styles.profileSectionCard}>
                    <div className={styles.sectionHeader}>
                        <h4>Skills</h4>
                    </div>
                    <div className={styles.skillsContainer}>
                        {localProfile.skills.map((skill, idx) => (
                            <span key={idx} className={styles.skillChip}>
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Work History */}
            <div className={styles.profileSectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Work History</h4>
                </div>
                <div className={styles.workHistoryContainer}>
                    {localProfile.pastWork.length > 0 ? (
                        localProfile.pastWork.map((work, index) => (
                            <div key={index} className={styles.workHistoryCard}>
                                <div className={styles.workInfo}>
                                    <p className={styles.workPosition}>
                                        {work.position}
                                    </p>
                                    <p className={styles.workCompany}>
                                        {work.company}
                                    </p>
                                    <p className={styles.workYears}>
                                        {work.years}
                                    </p>
                                    {work.description && (
                                        <p
                                            style={{
                                                fontSize: "0.85rem",
                                                color: "#555",
                                                marginTop: "4px",
                                            }}
                                        >
                                            {work.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No work history provided.</p>
                    )}
                </div>
            </div>

            {/* Education */}
            <div className={styles.profileSectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Education</h4>
                </div>
                <div className={styles.workHistoryContainer}>
                    {localProfile.education.length > 0 ? (
                        localProfile.education.map((edu, index) => (
                            <div key={index} className={styles.workHistoryCard}>
                                <div className={styles.workInfo}>
                                    <p className={styles.workPosition}>
                                        {edu.school}
                                    </p>
                                    <p className={styles.workCompany}>
                                        {edu.degree}
                                        {edu.fieldOfStudy
                                            ? `, ${edu.fieldOfStudy}`
                                            : ""}
                                    </p>
                                    <p className={styles.workYears}>
                                        {edu.years}
                                    </p>
                                    {edu.grade && (
                                        <p
                                            style={{
                                                fontSize: "0.85rem",
                                                color: "#555",
                                            }}
                                        >
                                            Grade: {edu.grade}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No education provided.</p>
                    )}
                </div>
            </div>

            {/* Projects Section (NEW) */}
            <div className={styles.profileSectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Projects</h4>
                </div>
                <div className={styles.workHistoryContainer}>
                    {localProfile.projects &&
                    localProfile.projects.length > 0 ? (
                        localProfile.projects.map((proj, index) => (
                            <div key={index} className={styles.workHistoryCard}>
                                <div className={styles.workInfo}>
                                    <p className={styles.workPosition}>
                                        {proj.title}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "0.9rem",
                                            color: "#555",
                                        }}
                                    >
                                        {proj.description}
                                    </p>
                                    <p className={styles.workYears}>
                                        {proj.duration}
                                    </p>
                                    {proj.link && (
                                        <a
                                            href={proj.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                fontSize: "0.85rem",
                                                color: "#0a66c2",
                                            }}
                                        >
                                            View Project
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No projects added.</p>
                    )}
                </div>
            </div>

            {/* Certificates Section (NEW) */}
            <div className={styles.profileSectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Certificates</h4>
                </div>
                <div className={styles.workHistoryContainer}>
                    {localProfile.certificates &&
                    localProfile.certificates.length > 0 ? (
                        localProfile.certificates.map((cert, index) => (
                            <div key={index} className={styles.workHistoryCard}>
                                <div className={styles.workInfo}>
                                    <p className={styles.workPosition}>
                                        {cert.name}
                                    </p>
                                    <p className={styles.workYears}>
                                        {cert.date}
                                    </p>
                                    {cert.link && (
                                        <a
                                            href={cert.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                                fontSize: "0.85rem",
                                                color: "#0a66c2",
                                                marginLeft: "10px",
                                            }}
                                        >
                                            View Credential
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No certificates added.</p>
                    )}
                </div>
            </div>

            {/* Achievements Section (NEW) */}
            <div className={styles.profileSectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Achievements</h4>
                </div>
                <div className={styles.workHistoryContainer}>
                    {localProfile.achievements &&
                    localProfile.achievements.length > 0 ? (
                        localProfile.achievements.map((achieve, index) => (
                            <div key={index} className={styles.workHistoryCard}>
                                <div className={styles.workInfo}>
                                    <p className={styles.workPosition}>
                                        {achieve.title}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "0.9rem",
                                            color: "#555",
                                        }}
                                    >
                                        {achieve.description}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No achievements added.</p>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.profileSectionCard}>
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
                        <p>No recent activity.</p>
                    )}
                </div>
            </div>

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
                            {localProfile.connectionList &&
                            localProfile.connectionList.length > 0 ? (
                                localProfile.connectionList.map((conn) => (
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

export async function getServerSideProps(context) {
    try {
        const request = await clientServer.get(
            "/user/get_profile_based_on_username",
            { params: { username: context.query.username } }
        );
        return { props: { userProfile: request.data.profile } };
    } catch (error) {
        return { notFound: true };
    }
}

ViewProfilePage.getLayout = (page) => (
    <UserLayout>
        <DashboardLayout>{page}</DashboardLayout>
    </UserLayout>
);
