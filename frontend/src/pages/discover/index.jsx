// frontend/src/pages/discover/index.jsx

import {
    getAllUsers,
    sendConnectionRequest,
    getConnectionsRequest,
    getMyConnectionRequests,
} from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.css";
// import { BASE_URL } from "@/config"; // <-- No longer needed
import { useRouter } from "next/router";
import { motion } from "framer-motion";

export default function Discoverpage() {
    const authState = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!authState.all_profiles_fetched) {
            dispatch(getAllUsers());
        }
        if (token) {
            dispatch(getConnectionsRequest({ token }));
            dispatch(getMyConnectionRequests({ token }));
        }
    }, [dispatch, authState.all_profiles_fetched]);

    const handleConnect = (targetUserId) => {
        dispatch(
            sendConnectionRequest({
                token: localStorage.getItem("token"),
                user_id: targetUserId,
            })
        );
    };

    // --- THIS FUNCTION IS NOW FIXED ---
    const getConnectStatus = (targetUserId) => {
        // 1. Are we already connected?
        // Check if I received a request and accepted it
        const connectedReceived = authState.connectionRequest.find(
            (req) =>
                req.userId._id === targetUserId && req.status_accepted === true
        );
        // Check if I sent a request and it was accepted
        const connectedSent = authState.connections.find(
            (req) =>
                req.connectionId._id === targetUserId &&
                req.status_accepted === true
        );

        if (connectedReceived || connectedSent) return "Connected";

        // 2. Did WE send a request that is pending?
        const isPending = authState.connections.find(
            (req) =>
                req.connectionId._id === targetUserId &&
                req.status_accepted === null
        );
        if (isPending) return "Pending";

        // 3. Did THEY send us a request that is pending?
        const hasRequested = authState.connectionRequest.find(
            (req) =>
                req.userId._id === targetUserId && req.status_accepted === null
        );
        if (hasRequested) return "Accept"; // Offer to accept if they sent it

        // 4. No connection status
        return "Connect";
    };
    // --- END OF FIX ---

    const gridVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08, // Slightly slower stagger for effect
            },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 }, // Start further down
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100, damping: 10 },
        }, // Spring for bouncier animation
    };

    const filteredUsers = authState.all_profiles_fetched
        ? authState.all_users.filter(
              (user) =>
                  authState.user &&
                  user.userId._id !== authState.user.userId._id
          )
        : [];

    return (
        <div className={styles.discoverPageWrapper}>
            <h2 className={styles.discoverTitle}>People You May Know</h2>

            <motion.div
                className={styles.discoverGrid}
                variants={gridVariants}
                initial="hidden"
                animate="visible"
            >
                {filteredUsers.length === 0 && (
                    <p className={styles.noUsersMessage}>
                        No users to discover right now.
                    </p>
                )}
                {filteredUsers.map((user, index) => {
                    const connectStatus = getConnectStatus(user.userId._id);
                    const isFirstCard = index === 0; // Identify the first card for "hero" styling

                    return (
                        <motion.div
                            key={user._id}
                            className={`${styles.userCard} ${
                                isFirstCard ? styles.userCard_large : ""
                            }`} // Apply large class to first card
                            variants={cardVariants}
                            whileHover={{
                                scale: 1.05, // Slightly more scale
                                rotateY: 5, // Subtle 3D tilt
                                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)", // More pronounced shadow
                                transition: {
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 10,
                                },
                            }}
                            whileTap={{ scale: 0.98 }} // Visual feedback on tap
                        >
                            <div className={styles.cardHeaderBackground}>
                                {/* NEW BACKGROUND ELEMENT */}
                                {/* You can put a pattern SVG here, or just use CSS gradient */}
                            </div>
                            {/* --- FIX: Removed ${BASE_URL}/ --- */}
                            <img
                                className={styles.userProfileImage}
                                src={user.userId.profilePicture}
                                alt={`${user.userId.name}'s profile`}
                                onClick={() => {
                                    router.push(
                                        `/view_profile/${user.userId.username}`
                                    );
                                }}
                            />
                            {/* --- END FIX --- */}
                            <div className={styles.userInfoContent}>
                                {" "}
                                {/* NEW WRAPPER FOR TEXT */}
                                <h3
                                    onClick={() => {
                                        router.push(
                                            `/view_profile/${user.userId.username}`
                                        );
                                    }}
                                >
                                    {user.userId.name}
                                </h3>
                                <p className={styles.usernameText}>
                                    @{user.userId.username}
                                </p>
                                {/* Display current post/bio for context */}
                                {user.currentPost && (
                                    <p className={styles.userBioSnippet}>
                                        {user.currentPost}
                                    </p>
                                )}
                                {user.bio && !user.currentPost && (
                                    <p className={styles.userBioSnippet}>
                                        {user.bio.substring(0, 70)}...
                                    </p>
                                )}{" "}
                                {/* Short snippet */}
                                <button
                                    onClick={() =>
                                        handleConnect(user.userId._id)
                                    }
                                    className={`${styles.connectActionButton} ${
                                        styles[connectStatus.toLowerCase()]
                                    }`} // Dynamic class for styling
                                    disabled={
                                        connectStatus !== "Connect" &&
                                        connectStatus !== "Accept"
                                    }
                                >
                                    {connectStatus === "Accept"
                                        ? "Accept Request"
                                        : connectStatus}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}

Discoverpage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};
