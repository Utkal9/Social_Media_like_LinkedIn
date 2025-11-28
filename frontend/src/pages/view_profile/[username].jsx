// frontend/src/pages/view_profile/[username].jsx
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
    AcceptConnection,
} from "@/config/redux/action/authAction";
import { useSocket } from "@/context/SocketContext";

const DEFAULT_BG =
    "https://img.freepik.com/free-photo/3d-rendering-hexagonal-texture-background_23-2150796421.jpg?semt=ais_hybrid&w=740&q=80";

// --- Holo Icons ---
const MessageIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20">
        <path
            fillRule="evenodd"
            d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.915 6.109.203.163.3.413.216.66l-.774 2.234.574-.359Z"
            clipRule="evenodd"
        />
    </svg>
);
const VideoIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22">
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
    </svg>
);
const ConnectIcon = () => (
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
            d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3.75 15a6.75 6.75 0 0113.5 0v.75a8.625 8.625 0 01-17.25 0v-.75z"
        />
    </svg>
);
const CheckIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        width="18"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
        />
    </svg>
);
const ClockIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="18"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
    </svg>
);
const LinkIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="16"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
        />
    </svg>
);
const ExternalIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="14"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
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
const PhoneIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16">
        <path d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
        <path
            fillRule="evenodd"
            d="M8.625.75A3.375 3.375 0 0 0 5.25 4.125v15.75a3.375 3.375 0 0 0 3.375 3.375h6.75a3.375 3.375 0 0 0 3.375-3.375V4.125A3.375 3.375 0 0 0 15.375.75h-6.75ZM7.5 4.125C7.5 3.504 8.004 3 8.625 3h6.75c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 0 1 7.5 19.875V4.125Z"
            clipRule="evenodd"
        />
    </svg>
);
const CodeIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16">
        <path
            fillRule="evenodd"
            d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm14.25 6a.75.75 0 0 1-.22.53l-2.25 2.25a.75.75 0 1 1-1.06-1.06L15.44 12l-1.72-1.72a.75.75 0 1 1 1.06-1.06l2.25 2.25c.141.14.22.331.22.53Zm-10.28 0a.75.75 0 0 1 .22-.53l2.25-2.25a.75.75 0 1 1 1.06 1.06L8.56 12l1.72 1.72a.75.75 0 1 1-1.06 1.06l-2.25-2.25a.75.75 0 0 1-.22-.53Z"
            clipRule="evenodd"
        />
    </svg>
);

// --- Helper: Video Detection ---
const isVideo = (fileType, mediaUrl) => {
    if (fileType && fileType.startsWith("video/")) return true;
    if (mediaUrl) {
        const ext = mediaUrl.split(".").pop().toLowerCase();
        return ["mp4", "webm", "ogg", "mov"].includes(ext);
    }
    return false;
};

// --- Helper: Truncated Text ---
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

export default function ViewProfilePage({ userProfile }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const postReducer = useSelector((state) => state.postReducer);
    const authState = useSelector((state) => state.auth);
    const { socket, onlineStatuses } = useSocket() || {};

    const [localProfile, setLocalProfile] = useState(userProfile);
    const [userPosts, setUserPosts] = useState([]);
    const [connectStatus, setConnectStatus] = useState("Connect");
    const [showConnectionsModal, setShowConnectionsModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    const isOwnProfile =
        authState.user && authState.user.userId._id === localProfile.userId._id;

    useEffect(() => {
        setLocalProfile(userProfile);
    }, [userProfile]);

    useEffect(() => {
        if (postReducer.posts.length > 0) {
            const posts = postReducer.posts.filter(
                (post) => post.userId.username === router.query.username
            );
            setUserPosts(posts);
        }
    }, [postReducer.posts, router.query.username]);

    useEffect(() => {
        if (isOwnProfile) return;
        const requestsReceived = Array.isArray(authState.connectionRequest)
            ? authState.connectionRequest
            : [];
        const requestsSent = Array.isArray(authState.connections)
            ? authState.connections
            : [];

        const isConnected =
            requestsReceived.some(
                (r) =>
                    r.userId?._id === localProfile.userId._id &&
                    r.status_accepted
            ) ||
            requestsSent.some(
                (r) =>
                    r.connectionId?._id === localProfile.userId._id &&
                    r.status_accepted
            );

        if (isConnected) {
            setConnectStatus("Connected");
            return;
        }

        const isPending = requestsSent.some(
            (r) =>
                r.connectionId?._id === localProfile.userId._id &&
                r.status_accepted === null
        );
        if (isPending) {
            setConnectStatus("Pending");
            return;
        }

        const hasRequested = requestsReceived.some(
            (r) =>
                r.userId?._id === localProfile.userId._id &&
                r.status_accepted === null
        );
        if (hasRequested) {
            setConnectStatus("Accept");
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

    const handleMessage = () => {
        router.push(`/messaging?chatWith=${localProfile.userId.username}`);
    };

    // --- UPDATED VIDEO CALL LOGIC ---
    const handleStartVideoCall = () => {
        const currentUser = authState.user?.userId;
        const targetUserId = localProfile.userId._id;

        if (!currentUser || !targetUserId || !socket) return;

        const roomId = [currentUser._id, targetUserId].sort().join("-");

        // --- FIX: Use router.push + Return URL ---
        const currentPath = router.asPath;
        router.push(
            `/meet/${roomId}?returnTo=${encodeURIComponent(currentPath)}`
        );

        const roomUrl = `${window.location.origin}/meet/${roomId}`;
        socket.emit("start-call", {
            fromUser: currentUser,
            toUserId: targetUserId,
            roomUrl: roomUrl,
        });
    };

    const isOnline =
        onlineStatuses && onlineStatuses[localProfile.userId._id]
            ? onlineStatuses[localProfile.userId._id].isOnline
            : localProfile.userId.isOnline;

    return (
        <div className={styles.profilePage}>
            {/* --- Header Card --- */}
            <div className={styles.headerCard}>
                <div
                    className={styles.coverImage}
                    style={{
                        backgroundImage: `url("${
                            localProfile.userId.backgroundPicture || DEFAULT_BG
                        }")`,
                    }}
                ></div>

                <div className={styles.headerContent}>
                    <div
                        className={styles.avatarContainer}
                        onClick={() => setShowImageModal(true)}
                        style={{ cursor: "pointer" }}
                        title="View Profile Picture"
                    >
                        <img
                            src={localProfile.userId.profilePicture}
                            alt="Profile"
                            className={styles.avatarImg}
                        />
                        {isOnline && <span className={styles.onlineDot}></span>}
                    </div>

                    <div className={styles.identitySection}>
                        <div className={styles.identityTop}>
                            <div className={styles.nameWrapper}>
                                <h1 className={styles.userName}>
                                    {localProfile.userId.name}
                                </h1>
                                <p className={styles.userHeadline}>
                                    {localProfile.currentPost || "No Headline"}
                                </p>
                            </div>

                            {!isOwnProfile && (
                                <div className={styles.headerActions}>
                                    {/* Icon Group (Message + Video) */}
                                    <div className={styles.iconGroup}>
                                        <button
                                            onClick={handleMessage}
                                            className={styles.iconBtn}
                                            title="Message"
                                        >
                                            <MessageIcon />
                                        </button>
                                        {connectStatus === "Connected" && (
                                            <button
                                                onClick={handleStartVideoCall}
                                                className={styles.iconBtn}
                                                title="Video Call"
                                            >
                                                <VideoIcon />
                                            </button>
                                        )}
                                    </div>

                                    {/* Main Connection Button */}
                                    <button
                                        onClick={handleConnect}
                                        className={`${styles.primaryBtn} ${
                                            styles[connectStatus.toLowerCase()]
                                        }`}
                                        disabled={
                                            connectStatus !== "Connect" &&
                                            connectStatus !== "Accept"
                                        }
                                    >
                                        {connectStatus === "Connect" && (
                                            <>
                                                <ConnectIcon /> Connect
                                            </>
                                        )}
                                        {connectStatus === "Pending" && (
                                            <>
                                                <ClockIcon /> Pending
                                            </>
                                        )}
                                        {connectStatus === "Connected" && (
                                            <>
                                                <CheckIcon /> Connected
                                            </>
                                        )}
                                        {connectStatus === "Accept" &&
                                            "Accept Request"}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className={styles.metaData}>
                            <span>@{localProfile.userId.username}</span>
                            <span className={styles.dot}>•</span>
                            <span
                                className={styles.connectionCount}
                                onClick={() => setShowConnectionsModal(true)}
                            >
                                {localProfile.connectionCount || 0} connections
                            </span>
                        </div>

                        <div className={styles.contactGrid}>
                            {localProfile.phoneNumber && (
                                <div className={styles.contactPill}>
                                    <PhoneIcon /> {localProfile.phoneNumber}
                                </div>
                            )}
                            {localProfile.linkedin && (
                                <a
                                    href={localProfile.linkedin}
                                    target="_blank"
                                    className={styles.contactPill}
                                >
                                    <LinkIcon /> LinkedIn
                                </a>
                            )}
                            {localProfile.github && (
                                <a
                                    href={localProfile.github}
                                    target="_blank"
                                    className={styles.contactPill}
                                >
                                    <CodeIcon /> GitHub
                                </a>
                            )}
                            {localProfile.leetcode && (
                                <a
                                    href={localProfile.leetcode}
                                    target="_blank"
                                    className={styles.contactPill}
                                >
                                    <CodeIcon /> LeetCode
                                </a>
                            )}
                        </div>

                        {localProfile.bio && (
                            <div className={styles.bioBox}>
                                {localProfile.bio}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.gridLayout}>
                {/* --- Left Column: Main Info --- */}
                <div className={styles.mainColumn}>
                    {/* Experience */}
                    <div className={styles.dataCard}>
                        <h4 className={styles.cardTitle}>Experience</h4>
                        <div className={styles.timeline}>
                            {localProfile.pastWork.length > 0 ? (
                                localProfile.pastWork.map((work, i) => (
                                    <div
                                        key={i}
                                        className={styles.timelineItem}
                                    >
                                        <div className={styles.timelineContent}>
                                            <h4>
                                                {work.position}{" "}
                                                <span>@ {work.company}</span>
                                            </h4>
                                            <small>{work.years}</small>
                                            <p>{work.description}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.emptyText}>
                                    No experience listed.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Projects */}
                    <div className={styles.dataCard}>
                        <h4 className={styles.cardTitle}>Projects</h4>
                        <div className={styles.projectList}>
                            {localProfile.projects &&
                            localProfile.projects.length > 0 ? (
                                localProfile.projects.map((proj, i) => (
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
                                                className={styles.projectLink}
                                            >
                                                <LinkIcon /> Code
                                            </a>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className={styles.emptyText}>
                                    No projects listed.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Education */}
                    <div className={styles.dataCard}>
                        <h4 className={styles.cardTitle}>Education</h4>
                        <div className={styles.timeline}>
                            {localProfile.education.length > 0 ? (
                                localProfile.education.map((edu, i) => (
                                    <div
                                        key={i}
                                        className={styles.timelineItem}
                                    >
                                        <div className={styles.timelineContent}>
                                            <h4>{edu.school}</h4>
                                            <p>
                                                {edu.degree}, {edu.fieldOfStudy}
                                            </p>
                                            <small>{edu.years}</small>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.emptyText}>
                                    No education listed.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Certificates & Achievements */}
                    <div className={styles.splitRow}>
                        <div className={styles.dataCard}>
                            <h4 className={styles.cardTitle}>Certificates</h4>
                            {localProfile.certificates &&
                            localProfile.certificates.length > 0 ? (
                                localProfile.certificates.map((cert, i) => (
                                    <div key={i} className={styles.miniItem}>
                                        <h5>{cert.name}</h5>
                                        <div className={styles.miniItemMeta}>
                                            <small>{cert.date}</small>
                                            {cert.link && (
                                                <a
                                                    href={cert.link}
                                                    target="_blank"
                                                    className={styles.viewLink}
                                                >
                                                    View <ExternalIcon />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.emptyText}>None.</p>
                            )}
                        </div>
                        <div className={styles.dataCard}>
                            <h4 className={styles.cardTitle}>Achievements</h4>
                            {localProfile.achievements &&
                            localProfile.achievements.length > 0 ? (
                                localProfile.achievements.map((ach, i) => (
                                    <div key={i} className={styles.miniItem}>
                                        <h5>{ach.title}</h5>
                                        <small>{ach.date}</small>
                                        <p
                                            style={{
                                                fontSize: "0.85rem",
                                                color: "#aaa",
                                                marginTop: "4px",
                                            }}
                                        >
                                            {ach.description}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.emptyText}>None.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Right Column: Skills + Recent Activity (Sidebar) --- */}
                <div className={styles.sideColumn}>
                    <div className={styles.dataCard}>
                        <h4 className={styles.cardTitle}>Tech Stack</h4>
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
                                if (!localProfile[field]) return null;
                                return (
                                    <div
                                        key={field}
                                        className={styles.stackItem}
                                    >
                                        <label>{labels[field]}</label>
                                        <p>{localProfile[field]}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {localProfile.skills && localProfile.skills.length > 0 && (
                        <div className={styles.dataCard}>
                            <h4 className={styles.cardTitle}>General Skills</h4>
                            <div className={styles.skillsWrapper}>
                                {localProfile.skills.map((skill, i) => (
                                    <span key={i} className={styles.skillTag}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Activity (Moved to Side Column) */}
                    <div className={styles.dataCard}>
                        <h4 className={styles.cardTitle}>Recent Activity</h4>
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
                                                    {post.fileType &&
                                                    post.fileType.startsWith(
                                                        "video"
                                                    ) ? (
                                                        <video
                                                            src={post.media}
                                                            muted
                                                            className={
                                                                styles.mediaImg
                                                            }
                                                        />
                                                    ) : (
                                                        <img
                                                            src={post.media}
                                                            alt="Post"
                                                            className={
                                                                styles.mediaImg
                                                            }
                                                        />
                                                    )}
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
                                                    `/dashboard?username=${localProfile.userId.username}`
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

            {/* --- Connections Modal --- */}
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

            {/* --- NEW: Image Modal (Lightbox) --- */}
            {showImageModal && (
                <div
                    className={styles.imageModalOverlay}
                    onClick={() => setShowImageModal(false)}
                >
                    <div
                        className={styles.imageModalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={localProfile.userId.profilePicture}
                            alt="Profile Large"
                        />
                        <button
                            className={styles.closeImageBtn}
                            onClick={() => setShowImageModal(false)}
                        >
                            <CloseIcon />
                        </button>
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
