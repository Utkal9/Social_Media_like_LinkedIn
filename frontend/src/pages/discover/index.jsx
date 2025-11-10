import {
    getAllUsers,
    sendConnectionRequest,
    getMyNetwork,
    getPendingIncomingRequests,
    getPendingSentRequests,
    respondToConnectionRequest,
} from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.css";
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
            // --- NEW: Dispatch all three ---
            dispatch(getMyNetwork({ token }));
            dispatch(getPendingIncomingRequests({ token }));
            dispatch(getPendingSentRequests({ token }));
        }
    }, [dispatch, authState.all_profiles_fetched]);

    const handleConnect = (targetUserId, currentStatus) => {
        const token = localStorage.getItem("token");
        if (currentStatus === "Connect") {
            dispatch(
                sendConnectionRequest({
                    token: token,
                    user_id: targetUserId,
                })
            );
        } else if (currentStatus === "Accept") {
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
            }
        }
        // "Pending" and "Connected" states have disabled buttons, so no action
    };
    const getConnectStatus = (targetUserId) => {
        // 1. Are we connected?
        const isConnected = authState.myNetwork.some(
            (user) => user._id === targetUserId
        );
        if (isConnected) return "Connected";

        // 2. Did THEY send us a request?
        const hasRequested = authState.pendingIncoming.some(
            (req) => req.requester._id === targetUserId
        );
        if (hasRequested) return "Accept"; // Offer to accept

        // 3. Did WE send a request?
        const isPending = authState.pendingSent.some(
            (req) => req.recipient._id === targetUserId
        );
        if (isPending) return "Pending";

        // 4. No connection status
        return "Connect";
    };
    const gridVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
            },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100, damping: 10 },
        },
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
                    const isFirstCard = index === 0;

                    return (
                        <motion.div
                            key={user._id}
                            className={`${styles.userCard} ${
                                isFirstCard ? styles.userCard_large : ""
                            }`}
                            variants={cardVariants}
                            whileHover={{
                                scale: 1.05,
                                rotateY: 5,
                                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.2)",
                                transition: {
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 10,
                                },
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className={styles.cardHeaderBackground}></div>
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
                            <div className={styles.userInfoContent}>
                                {" "}
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
                                <button
                                    onClick={
                                        () =>
                                            handleConnect(
                                                user.userId._id,
                                                connectStatus
                                            ) // --- PASS STATUS ---
                                    }
                                    className={`${styles.connectActionButton} ${
                                        styles[connectStatus.toLowerCase()]
                                    }`}
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
