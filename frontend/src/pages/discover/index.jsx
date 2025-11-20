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
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useSocket } from "@/context/SocketContext";

export default function Discoverpage() {
    const authState = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();
    const { onlineStatuses } = useSocket() || {};

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

    const getConnectStatus = (targetUserId) => {
        // 1. Connected?
        const connectedReceived = authState.connectionRequest.find(
            (req) =>
                req.userId._id === targetUserId && req.status_accepted === true
        );
        const connectedSent = authState.connections.find(
            (req) =>
                req.connectionId._id === targetUserId &&
                req.status_accepted === true
        );
        if (connectedReceived || connectedSent) return "Connected";

        // 2. Pending (Sent by me)?
        const isPending = authState.connections.find(
            (req) =>
                req.connectionId._id === targetUserId &&
                req.status_accepted === null
        );
        if (isPending) return "Pending";

        // 3. Pending (Received from them)?
        const hasRequested = authState.connectionRequest.find(
            (req) =>
                req.userId._id === targetUserId && req.status_accepted === null
        );
        if (hasRequested) return "Accept";

        return "Connect";
    };

    const isUserOnline = (uid, defaultStatus) => {
        return onlineStatuses && onlineStatuses[uid]
            ? onlineStatuses[uid].isOnline
            : defaultStatus;
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
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
            <div className={styles.headerContainer}>
                <h2 className={styles.discoverTitle}>People You May Know</h2>
                <p className={styles.discoverSubtitle}>
                    Expand your professional network
                </p>
            </div>

            <motion.div
                className={styles.discoverGrid}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {filteredUsers.length === 0 && (
                    <div className={styles.noUsersMessage}>
                        <p>No new profiles to discover right now.</p>
                        <button onClick={() => dispatch(getAllUsers())}>
                            Refresh List
                        </button>
                    </div>
                )}

                {filteredUsers.map((user) => {
                    const connectStatus = getConnectStatus(user.userId._id);

                    return (
                        <motion.div
                            key={user._id}
                            className={styles.userCard}
                            variants={itemVariants}
                            whileHover={{ y: -4 }} // Subtle lift
                        >
                            {/* Banner Background */}
                            <div className={styles.cardHeaderBackground}></div>

                            {/* Avatar with Online Dot */}
                            <div
                                className={styles.avatarWrapper}
                                onClick={() =>
                                    router.push(
                                        `/view_profile/${user.userId.username}`
                                    )
                                }
                            >
                                <img
                                    className={styles.userProfileImage}
                                    src={user.userId.profilePicture}
                                    alt={user.userId.name}
                                />
                                {isUserOnline(
                                    user.userId._id,
                                    user.userId.isOnline
                                ) && <span className={styles.onlineDot}></span>}
                            </div>

                            {/* User Info */}
                            <div className={styles.userInfoContent}>
                                <h3
                                    onClick={() =>
                                        router.push(
                                            `/view_profile/${user.userId.username}`
                                        )
                                    }
                                >
                                    {user.userId.name}
                                </h3>
                                <p className={styles.usernameText}>
                                    @{user.userId.username}
                                </p>

                                {/* Bio / Headline */}
                                <div className={styles.bioContainer}>
                                    {user.currentPost ? (
                                        <p>{user.currentPost}</p>
                                    ) : user.bio ? (
                                        <p>
                                            {user.bio.length > 60
                                                ? user.bio.substring(0, 60) +
                                                  "..."
                                                : user.bio}
                                        </p>
                                    ) : (
                                        <p className={styles.placeholderBio}>
                                            No bio available
                                        </p>
                                    )}
                                </div>

                                {/* Connect Button */}
                                <button
                                    onClick={() =>
                                        handleConnect(user.userId._id)
                                    }
                                    className={`${styles.connectBtn} ${
                                        styles[connectStatus.toLowerCase()]
                                    }`}
                                    disabled={
                                        connectStatus !== "Connect" &&
                                        connectStatus !== "Accept"
                                    }
                                >
                                    {connectStatus === "Accept"
                                        ? "Accept"
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
