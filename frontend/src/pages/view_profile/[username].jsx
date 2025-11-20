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
} from "@/config/redux/action/authAction";
import { useSocket } from "@/context/SocketContext";

// --- Icons ---
const DownloadIcon = () => (
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
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
    </svg>
);

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
// --- End Icons ---

// --- Helper Component for Text Truncation ---
const TruncatedText = ({ content, postId }) => {
    const router = useRouter();
    // Limit set to 300 characters (approx 40-60 words) for a clean preview card
    const MAX_LENGTH = 300;

    if (content.length <= MAX_LENGTH) {
        return <p className={styles.postCardBody}>{content}</p>;
    }

    return (
        <p className={styles.postCardBody}>
            {content.substring(0, MAX_LENGTH)}...
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

    const [userPosts, setUserPosts] = useState([]);
    const [connectStatus, setConnectStatus] = useState("Connect");
    const isOwnProfile =
        authState.user && authState.user.userId._id === userProfile.userId._id;

    const getUsersPost = async () => {
        await dispatch(getAllPosts());
        const token = localStorage.getItem("token");
        if (token) {
            await dispatch(getConnectionsRequest({ token }));
            await dispatch(getMyConnectionRequests({ token }));
        }
    };

    useEffect(() => {
        let post = postReducer.posts.filter((post) => {
            return post.userId.username === router.query.username;
        });
        setUserPosts(post);
    }, [postReducer.posts, router.query.username]);

    useEffect(() => {
        if (isOwnProfile) return;
        const isConnectedRec = authState.connectionRequest.some(
            (req) =>
                req.userId._id === userProfile.userId._id &&
                req.status_accepted === true
        );
        const isConnectedSent = authState.connections.some(
            (req) =>
                req.connectionId._id === userProfile.userId._id &&
                req.status_accepted === true
        );
        if (isConnectedRec || isConnectedSent) {
            setConnectStatus("Connected");
            return;
        }
        const isPending = authState.connections.some(
            (req) =>
                req.connectionId._id === userProfile.userId._id &&
                req.status_accepted === null
        );
        if (isPending) {
            setConnectStatus("Pending");
            return;
        }
        const hasRequested = authState.connectionRequest.some(
            (req) =>
                req.userId._id === userProfile.userId._id &&
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
        userProfile.userId._id,
        isOwnProfile,
    ]);

    useEffect(() => {
        getUsersPost();
    }, [dispatch]);

    const handleConnect = () => {
        dispatch(
            sendConnectionRequest({
                token: localStorage.getItem("token"),
                user_id: userProfile.userId._id,
            })
        );
        setConnectStatus("Pending");
    };

    const handleDownloadResume = async () => {
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
                `${userProfile.userId.username}_resume.pdf`
            );
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download resume:", error);
            alert("Error: Could not generate resume.");
        }
    };
    const handleMessage = () => {
        router.push(`/messaging?chatWith=${userProfile.userId.username}`);
    };

    const isOnline =
        onlineStatuses && onlineStatuses[userProfile.userId._id]
            ? onlineStatuses[userProfile.userId._id].isOnline
            : userProfile.userId.isOnline;

    return (
        <div className={styles.container}>
            <div className={styles.profileHeaderCard}>
                <div className={styles.backDropContainer}>
                    <div className={styles.avatarWrapper}>
                        <img
                            src={userProfile.userId.profilePicture}
                            alt="backDrop"
                            className={styles.profilePic}
                        />
                        {isOnline && <span className={styles.onlineDot}></span>}
                    </div>
                </div>
                <div className={styles.profileHeaderContent}>
                    <div className={styles.profileHeaderActions}>
                        <button
                            className={styles.iconActionButton}
                            onClick={handleDownloadResume}
                            title="Download Resume"
                        >
                            <DownloadIcon />
                        </button>
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
                        {userProfile.userId.name}
                    </h2>
                    <p className={styles.usernameDisplay}>
                        @{userProfile.userId.username}
                    </p>
                    <p className={styles.bioDisplay}>{userProfile.bio}</p>
                </div>
            </div>
            {/* ... sections for Work History and Activity ... */}
            <div className={styles.profileSectionCard}>
                <div className={styles.sectionHeader}>
                    <h4>Work History</h4>
                </div>
                <div className={styles.workHistoryContainer}>
                    {userProfile.pastWork.length > 0 ? (
                        userProfile.pastWork.map((work, index) => (
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
                            </div>
                        ))
                    ) : (
                        <p>No work history provided.</p>
                    )}
                </div>
            </div>
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
                                        <img
                                            src={post.media}
                                            alt="Post media"
                                            className={styles.postCardImage}
                                        />
                                    )}
                                    {/* Use the TruncatedText component here */}
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
ViewProfilePage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};
