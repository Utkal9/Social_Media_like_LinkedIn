import clientServer from "@/config";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useState } from "react";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAllPosts } from "@/config/redux/action/postAction";
import {
    getMyNetwork,
    getPendingIncomingRequests,
    getPendingSentRequests,
    sendConnectionRequest,
    respondToConnectionRequest,
} from "@/config/redux/action/authAction";
const DownloadIcon = () => (
    <svg
        style={{ width: "1.2em" }}
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

export default function ViewProfilePage({ userProfile }) {
    const router = useRouter();
    const postReducer = useSelector((state) => state.postReducer);
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);

    const [userPosts, setUserPosts] = useState([]);

    // State to hold the connection status
    const [connectStatus, setConnectStatus] = useState("Connect"); // 'Connect', 'Pending', 'Accept', 'Connected'

    const getUsersPost = async () => {
        await dispatch(getAllPosts());
        const token = localStorage.getItem("token");
        if (token) {
            dispatch(getMyNetwork({ token }));
            dispatch(getPendingIncomingRequests({ token }));
            dispatch(getPendingSentRequests({ token }));
        }
    };

    // Filter posts for this user
    useEffect(() => {
        let post = postReducer.posts.filter((post) => {
            return post.userId.username === router.query.username;
        });
        setUserPosts(post);
    }, [postReducer.posts, router.query.username]);
    useEffect(() => {
        const targetUserId = userProfile.userId._id;

        // 1. Are we connected?
        const isConnected = authState.myNetwork.some(
            (user) => user._id === targetUserId
        );
        if (isConnected) {
            setConnectStatus("Connected");
            return;
        }

        // 2. Did THEY send us a request?
        const hasRequested = authState.pendingIncoming.some(
            (req) => req.requester._id === targetUserId
        );
        if (hasRequested) {
            setConnectStatus("Accept"); // Offer to accept
            return;
        }

        // 3. Did WE send a request?
        const isPending = authState.pendingSent.some(
            (req) => req.recipient._id === targetUserId
        );
        if (isPending) {
            setConnectStatus("Pending");
            return;
        }

        // 4. No connection status
        setConnectStatus("Connect");
    }, [
        authState.myNetwork,
        authState.pendingIncoming,
        authState.pendingSent,
        userProfile.userId._id,
    ]);
    // Fetch all posts and connection data on load
    useEffect(() => {
        getUsersPost();
    }, [dispatch]);
    const handleConnect = () => {
        const token = localStorage.getItem("token");
        const targetUserId = userProfile.userId._id;

        if (connectStatus === "Connect") {
            dispatch(
                sendConnectionRequest({
                    token: token,
                    user_id: targetUserId,
                })
            );
            setConnectStatus("Pending"); // Optimistically update UI
        } else if (connectStatus === "Accept") {
            // Find the request ID from the incoming list
            const request = authState.pendingIncoming.find(
                (req) => req.requester._id === targetUserId
            );
            if (request) {
                dispatch(
                    respondToConnectionRequest({
                        token: token,
                        requestId: request._id,
                        action_type: "accept",
                    })
                );
                setConnectStatus("Connected"); // Optimistically update UI
            }
        }
    };
    // Handle resume download
    const handleDownloadResume = async () => {
        const response = await clientServer.get(
            `/user/download_resume?id=${userProfile.userId._id}`
        );
        window.open(response.data.message, "_blank");
    };

    return (
        <div className={styles.container}>
            {/* --- 1. Profile Header Card --- */}
            <div className={styles.profileHeaderCard}>
                <div className={styles.backDropContainer}>
                    <img
                        src={userProfile.userId.profilePicture}
                        alt="backDrop"
                        className={styles.profilePic}
                    />
                </div>
                <div className={styles.profileHeaderContent}>
                    <div className={styles.profileHeaderActions}>
                        <button
                            className={styles.downloadButton}
                            onClick={handleDownloadResume}
                        >
                            <DownloadIcon />
                            <span>Download Resume</span>
                        </button>
                        <button
                            onClick={handleConnect}
                            className={
                                connectStatus === "Connect"
                                    ? styles.connectBtn
                                    : connectStatus === "Accept"
                                    ? styles.acceptBtn // Optional: Add a green 'accept' style
                                    : styles.connectedButton // Use for 'Pending' and 'Connected'
                            }
                            disabled={
                                connectStatus === "Pending" ||
                                connectStatus === "Connected"
                            }
                        >
                            {connectStatus === "Accept"
                                ? "Accept Request"
                                : connectStatus}
                        </button>
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

            {/* --- 2. Work History Card --- */}
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
                                        <img
                                            src={post.media}
                                            alt="Post media"
                                            className={styles.postCardImage}
                                        />
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
    );
}
export async function getServerSideProps(context) {
    console.log("From View");
    console.log(context.query.username);
    const request = await clientServer.get(
        "/user/get_profile_based_on_username",
        {
            params: {
                username: context.query.username,
            },
        }
    );
    return { props: { userProfile: request.data.profile } };
}

ViewProfilePage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};
