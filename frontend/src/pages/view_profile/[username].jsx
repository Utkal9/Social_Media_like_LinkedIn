// frontend/src/pages/view_profile/[username].jsx

import clientServer from "@/config"; // <-- BASE_URL not needed for images
import DashboardLayout from "@/layout/DashboardLayout"; // Import
import UserLayout from "@/layout/UserLayout"; // Import
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

// --- Icons ---
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
// --- End Icons ---

export default function ViewProfilePage({ userProfile }) {
    const router = useRouter();
    const postReducer = useSelector((state) => state.postReducer);
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);

    const [userPosts, setUserPosts] = useState([]);

    // State to hold the connection status
    const [connectStatus, setConnectStatus] = useState("Connect"); // 'Connect', 'Pending', 'Connected'

    const getUsersPost = async () => {
        await dispatch(getAllPosts());
        const token = localStorage.getItem("token");
        if (token) {
            await dispatch(getConnectionsRequest({ token }));
            await dispatch(getMyConnectionRequests({ token }));
        }
    };

    // Filter posts for this user
    useEffect(() => {
        let post = postReducer.posts.filter((post) => {
            return post.userId.username === router.query.username;
        });
        setUserPosts(post);
    }, [postReducer.posts, router.query.username]);

    // Determine connection status
    useEffect(() => {
        // 1. Check if they are in my network (I received request and accepted)
        const isConnected = authState.connectionRequest.some(
            (req) =>
                req.userId._id === userProfile.userId._id &&
                req.status_accepted === true
        );
        if (isConnected) {
            setConnectStatus("Connected");
            return;
        }

        // 2. Check if I sent a request that is pending
        const isPending = authState.connections.some(
            (req) =>
                req.connectionId._id === userProfile.userId._id &&
                req.status_accepted === null
        );
        if (isPending) {
            setConnectStatus("Pending");
            return;
        }

        // 3. Check if they sent me a request (I just need to accept)
        const hasRequested = authState.connectionRequest.some(
            (req) =>
                req.userId._id === userProfile.userId._id &&
                req.status_accepted === null
        );
        if (hasRequested) {
            setConnectStatus("Pending"); // Or "Accept"
            return;
        }

        setConnectStatus("Connect");
    }, [
        authState.connections,
        authState.connectionRequest,
        userProfile.userId._id,
    ]);

    // Fetch all posts and connection data on load
    useEffect(() => {
        getUsersPost();
    }, [dispatch]); // Added dispatch

    // Handle sending a connection request
    const handleConnect = () => {
        dispatch(
            sendConnectionRequest({
                token: localStorage.getItem("token"),
                user_id: userProfile.userId._id,
            })
        );
        setConnectStatus("Pending"); // Optimistically update UI
    };

    // Handle resume download
    const handleDownloadResume = async () => {
        const response = await clientServer.get(
            `/user/download_resume?id=${userProfile.userId._id}`
        );
        // --- FIX: The PDF URL is a FULL Cloudinary URL. Do not add BASE_URL. ---
        window.open(response.data.message, "_blank");
        // --- END FIX ---
    };

    // <UserLayout><DashboardLayout> ... </DashboardLayout></UserLayout> <-- REMOVED
    return (
        <div className={styles.container}>
            {/* --- 1. Profile Header Card --- */}
            <div className={styles.profileHeaderCard}>
                <div className={styles.backDropContainer}>
                    {/* --- FIX: Removed ${BASE_URL}/ --- */}
                    <img
                        src={userProfile.userId.profilePicture}
                        alt="backDrop"
                        className={styles.profilePic}
                    />
                    {/* --- END FIX --- */}
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
                                    : styles.connectedButton
                            }
                            disabled={connectStatus !== "Connect"}
                        >
                            {connectStatus}
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
                                {/* No Edit/Delete buttons */}
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
    );
}

// Server-side props remains the same
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

// ADDED THIS:
ViewProfilePage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};
