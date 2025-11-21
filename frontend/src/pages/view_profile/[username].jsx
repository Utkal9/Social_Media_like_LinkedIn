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
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        style={{ width: "20px", height: "20px" }}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
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
// Contact Icons
const PhoneIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
    >
        <path d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
        <path
            fillRule="evenodd"
            d="M8.625.75A3.375 3.375 0 0 0 5.25 4.125v15.75a3.375 3.375 0 0 0 3.375 3.375h6.75a3.375 3.375 0 0 0 3.375-3.375V4.125A3.375 3.375 0 0 0 15.375.75h-6.75ZM7.5 4.125C7.5 3.504 8.004 3 8.625 3h6.75c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 0 1 7.5 19.875V4.125Z"
            clipRule="evenodd"
        />
    </svg>
);
const LinkIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
    >
        <path
            fillRule="evenodd"
            d="M19.902 4.098a3.75 3.75 0 0 0-5.304 0l-4.5 4.5a3.75 3.75 0 0 0 1.035 6.037.75.75 0 0 1-.646 1.353 5.25 5.25 0 0 1-1.449-8.45l4.5-4.5a5.25 5.25 0 1 1 7.424 7.424l-1.757 1.757a.75.75 0 1 1-1.06-1.06l1.757-1.757a3.75 3.75 0 0 0 0-5.304Zm-7.389 4.291a3.75 3.75 0 0 0 5.304 0l4.5 4.5a3.75 3.75 0 0 0-1.035-6.037.75.75 0 0 1 .646-1.353 5.25 5.25 0 0 1 1.449 8.45l-4.5 4.5a5.25 5.25 0 1 1-7.424-7.424l1.757-1.757a.75.75 0 1 1 1.06 1.06l-1.757-1.757a3.75 3.75 0 0 0 0 5.304Z"
            clipRule="evenodd"
        />
    </svg>
);
const CodeIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
    >
        <path
            fillRule="evenodd"
            d="M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm14.25 6a.75.75 0 0 1-.22.53l-2.25 2.25a.75.75 0 1 1-1.06-1.06L15.44 12l-1.72-1.72a.75.75 0 1 1 1.06-1.06l2.25 2.25c.141.14.22.331.22.53Zm-10.28 0a.75.75 0 0 1 .22-.53l2.25-2.25a.75.75 0 1 1 1.06 1.06L8.56 12l1.72 1.72a.75.75 0 1 1-1.06 1.06l-2.25-2.25a.75.75 0 0 1-.22-.53Z"
            clipRule="evenodd"
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
                    <div className={styles.headerActionsContainer}>
                        {!isOwnProfile && (
                            <button
                                className={styles.headerActionBtn}
                                onClick={handleMessage}
                                title="Message"
                            >
                                <MessageIcon />
                            </button>
                        )}
                        {!isOwnProfile && (
                            <button
                                onClick={handleConnect}
                                className={`${styles.connectBtn} ${
                                    styles[connectStatus.toLowerCase()]
                                }`}
                                disabled={connectStatus !== "Connect"}
                            >
                                {connectStatus}
                            </button>
                        )}
                    </div>
                    <div className={styles.avatarSection}>
                        <div className={styles.profilePicWrapper}>
                            <img
                                src={localProfile.userId.profilePicture}
                                alt="Profile"
                                className={styles.profilePic}
                            />
                            {isOnline && (
                                <span className={styles.onlineDot}></span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.profileInfoSection}>
                    <div className={styles.mainInfo}>
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
                            <span>•</span>
                            <span>{localProfile.userId.email}</span>
                        </div>

                        {/* Contact Grid */}
                        <div className={styles.contactGrid}>
                            {localProfile.phoneNumber && (
                                <div className={styles.contactItem}>
                                    <PhoneIcon /> {localProfile.phoneNumber}
                                </div>
                            )}
                            {localProfile.linkedin && (
                                <div className={styles.contactItem}>
                                    <LinkIcon />{" "}
                                    <a
                                        href={localProfile.linkedin}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        LinkedIn
                                    </a>
                                </div>
                            )}
                            {localProfile.github && (
                                <div className={styles.contactItem}>
                                    <CodeIcon />{" "}
                                    <a
                                        href={localProfile.github}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        GitHub
                                    </a>
                                </div>
                            )}
                            {localProfile.leetcode && (
                                <div className={styles.contactItem}>
                                    <CodeIcon />{" "}
                                    <a
                                        href={localProfile.leetcode}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        LeetCode
                                    </a>
                                </div>
                            )}
                        </div>

                        <p className={styles.bioDisplay}>{localProfile.bio}</p>
                    </div>
                </div>
            </div>

            {/* --- RESUME SKILLS (Read Only) --- */}
            {(localProfile.skillLanguages ||
                localProfile.skillCloudDevOps ||
                localProfile.skillFrameworks ||
                localProfile.skillTools ||
                localProfile.skillSoft) && (
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h4>Technical Skills</h4>
                    </div>
                    <div className={styles.resumeSkillsGrid}>
                        {localProfile.skillLanguages && (
                            <div className={styles.skillRow}>
                                <span className={styles.skillLabel}>
                                    Languages:
                                </span>
                                <span className={styles.skillValue}>
                                    {localProfile.skillLanguages}
                                </span>
                            </div>
                        )}
                        {localProfile.skillCloudDevOps && (
                            <div className={styles.skillRow}>
                                <span className={styles.skillLabel}>
                                    Cloud/DevOps:
                                </span>
                                <span className={styles.skillValue}>
                                    {localProfile.skillCloudDevOps}
                                </span>
                            </div>
                        )}
                        {localProfile.skillFrameworks && (
                            <div className={styles.skillRow}>
                                <span className={styles.skillLabel}>
                                    Frameworks:
                                </span>
                                <span className={styles.skillValue}>
                                    {localProfile.skillFrameworks}
                                </span>
                            </div>
                        )}
                        {localProfile.skillTools && (
                            <div className={styles.skillRow}>
                                <span className={styles.skillLabel}>
                                    Tools:
                                </span>
                                <span className={styles.skillValue}>
                                    {localProfile.skillTools}
                                </span>
                            </div>
                        )}
                        {localProfile.skillSoft && (
                            <div className={styles.skillRow}>
                                <span className={styles.skillLabel}>
                                    Soft Skills:
                                </span>
                                <span className={styles.skillValue}>
                                    {localProfile.skillSoft}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* General Skills */}
            {localProfile.skills && localProfile.skills.length > 0 && (
                <div className={styles.sectionCard}>
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
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Experience</h4>
                </div>
                <div className={styles.listContainer}>
                    {localProfile.pastWork.length > 0 ? (
                        localProfile.pastWork.map((work, index) => (
                            <div key={index} className={styles.listItem}>
                                <div className={styles.listInfo}>
                                    <h5>{work.position}</h5>
                                    <p>{work.company}</p>
                                    <span>{work.years}</span>
                                    <div className={styles.description}>
                                        {work.description}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: "#777" }}>No experience listed.</p>
                    )}
                </div>
            </div>

            {/* Education */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Education</h4>
                </div>
                <div className={styles.listContainer}>
                    {localProfile.education.length > 0 ? (
                        localProfile.education.map((edu, index) => (
                            <div key={index} className={styles.listItem}>
                                <div className={styles.listInfo}>
                                    <h5>{edu.school}</h5>
                                    <p>
                                        {edu.degree}{" "}
                                        {edu.fieldOfStudy
                                            ? `, ${edu.fieldOfStudy}`
                                            : ""}
                                    </p>
                                    <span>{edu.years}</span>
                                    {edu.location && (
                                        <span style={{ color: "#444" }}>
                                            {edu.location}
                                        </span>
                                    )}
                                    {edu.grade && (
                                        <span>Grade: {edu.grade}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: "#777" }}>No education listed.</p>
                    )}
                </div>
            </div>

            {/* Projects */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Projects</h4>
                </div>
                <div className={styles.listContainer}>
                    {localProfile.projects &&
                    localProfile.projects.length > 0 ? (
                        localProfile.projects.map((proj, index) => (
                            <div key={index} className={styles.listItem}>
                                <div className={styles.listInfo}>
                                    <h5>{proj.title}</h5>
                                    <span>{proj.duration}</span>
                                    {proj.link && (
                                        <a
                                            href={proj.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: "#0a66c2" }}
                                        >
                                            View Project
                                        </a>
                                    )}
                                    <div
                                        className={styles.description}
                                        style={{ marginTop: "5px" }}
                                    >
                                        {proj.description}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: "#777" }}>No projects listed.</p>
                    )}
                </div>
            </div>

            {/* Certificates & Achievements */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1.5rem",
                }}
            >
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h4>Certificates</h4>
                    </div>
                    <div className={styles.listContainer}>
                        {localProfile.certificates &&
                        localProfile.certificates.length > 0 ? (
                            localProfile.certificates.map((cert, index) => (
                                <div key={index} className={styles.listItem}>
                                    <div className={styles.listInfo}>
                                        <h5>{cert.name}</h5>
                                        <span>{cert.date}</span>
                                        {cert.link && (
                                            <a
                                                href={cert.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ color: "#0a66c2" }}
                                            >
                                                View Credential
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: "#777" }}>No certificates.</p>
                        )}
                    </div>
                </div>

                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h4>Achievements</h4>
                    </div>
                    <div className={styles.listContainer}>
                        {localProfile.achievements &&
                        localProfile.achievements.length > 0 ? (
                            localProfile.achievements.map((ach, index) => (
                                <div key={index} className={styles.listItem}>
                                    <div className={styles.listInfo}>
                                        <h5>{ach.title}</h5>
                                        <span>{ach.date}</span>
                                        <p className={styles.description}>
                                            {ach.description}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: "#777" }}>No achievements.</p>
                        )}
                    </div>
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
                                                alt="Post"
                                                className={styles.postCardImage}
                                            />
                                        )
                                    ) : (
                                        <div className={styles.textOnlyPreview}>
                                            <p>
                                                {post.body.substring(0, 80)}...
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
                        <p style={{ color: "#777", fontStyle: "italic" }}>
                            No recent activity.
                        </p>
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
