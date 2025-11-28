// frontend/src/pages/my_connections/index.jsx
import {
    AcceptConnection,
    getMyConnectionRequests,
    getConnectionsRequest,
} from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.css";
import { useRouter } from "next/router";

const VIDEO_CALL_URL = "http://localhost:3000";

// --- Holo Icons ---
const MessageIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path
            fillRule="evenodd"
            d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.915 6.109.203.163.3.413.216.66l-.774 2.234.574-.359Z"
            clipRule="evenodd"
        />
    </svg>
);
const VideoIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
    </svg>
);
const CheckIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        width="16"
        height="16"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
        />
    </svg>
);
const XIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        width="16"
        height="16"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
        />
    </svg>
);

export default function MyConnectionsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { socket, onlineStatuses } = useSocket() || {};
    const authState = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState("received");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            dispatch(getMyConnectionRequests({ token }));
            dispatch(getConnectionsRequest({ token }));
        }
    }, [dispatch]);

    const handleConnectionAction = (requestId, action) => {
        dispatch(
            AcceptConnection({
                connectionId: requestId,
                token: localStorage.getItem("token"),
                action: action,
            })
        );
    };

    const handleStartOneOnOneCall = (connectionUser) => {
        const currentUser = authState.user?.userId;
        const connectionUserId = connectionUser._id;
        if (!currentUser || !connectionUserId || !socket) return;

        const roomId = [currentUser._id, connectionUserId].sort().join("-");

        // --- FIX: Use router.push + Return URL ---
        const currentPath = router.asPath;
        router.push(
            `/meet/${roomId}?returnTo=${encodeURIComponent(currentPath)}`
        );

        const roomUrl = `${window.location.origin}/meet/${roomId}`;
        socket.emit("start-call", {
            fromUser: currentUser,
            toUserId: connectionUserId,
            roomUrl: roomUrl,
        });
    };

    const handleMessageUser = (username) => {
        router.push(`/messaging?chatWith=${username}`);
    };

    const isUserOnline = (uid, defaultStatus) => {
        return onlineStatuses && onlineStatuses[uid]
            ? onlineStatuses[uid].isOnline
            : defaultStatus;
    };

    const receivedRequests = Array.isArray(authState.connectionRequest)
        ? authState.connectionRequest
        : [];
    const sentRequests = Array.isArray(authState.connections)
        ? authState.connections
        : [];

    const pendingRequests = receivedRequests.filter(
        (connection) => connection.status_accepted === null
    );
    const receivedAccepted = receivedRequests.filter(
        (connection) => connection.status_accepted === true
    );
    const sentAccepted = sentRequests.filter(
        (connection) => connection.status_accepted === true
    );

    const networkMap = new Map();
    receivedAccepted.forEach((req) => {
        if (req.userId) networkMap.set(req.userId._id, req.userId);
    });
    sentAccepted.forEach((req) => {
        if (req.connectionId)
            networkMap.set(req.connectionId._id, req.connectionId);
    });
    const myNetworkList = Array.from(networkMap.values());

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Network Command</h2>
                <p>Manage incoming signals and established connections.</p>
            </div>

            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tab} ${
                        activeTab === "received" ? styles.activeTab : ""
                    }`}
                    onClick={() => setActiveTab("received")}
                >
                    Incoming Signals{" "}
                    {pendingRequests.length > 0 && (
                        <span className={styles.badge}>
                            {pendingRequests.length}
                        </span>
                    )}
                </button>
                <button
                    className={`${styles.tab} ${
                        activeTab === "network" ? styles.activeTab : ""
                    }`}
                    onClick={() => setActiveTab("network")}
                >
                    Active Nodes ({myNetworkList.length})
                </button>
            </div>

            <div className={styles.contentArea}>
                {activeTab === "received" && (
                    <div className={styles.requestGrid}>
                        {pendingRequests.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No incoming signals detected.</p>
                            </div>
                        ) : (
                            pendingRequests.map((req) => (
                                <div
                                    className={styles.requestCard}
                                    key={req._id}
                                >
                                    <div className={styles.cardHeader}>
                                        <div
                                            className={styles.avatarContainer}
                                            onClick={() =>
                                                router.push(
                                                    `/view_profile/${req.userId.username}`
                                                )
                                            }
                                        >
                                            <img
                                                src={req.userId.profilePicture}
                                                alt=""
                                                className={
                                                    styles.profilePicture
                                                }
                                            />
                                            {isUserOnline(
                                                req.userId._id,
                                                req.userId.isOnline
                                            ) && (
                                                <span
                                                    className={styles.onlineDot}
                                                ></span>
                                            )}
                                        </div>
                                        <div className={styles.userInfo}>
                                            <h3
                                                onClick={() =>
                                                    router.push(
                                                        `/view_profile/${req.userId.username}`
                                                    )
                                                }
                                            >
                                                {req.userId.name}
                                            </h3>
                                            <p>@{req.userId.username}</p>
                                        </div>
                                    </div>
                                    <div className={styles.buttonGroup}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleConnectionAction(
                                                    req._id,
                                                    "decline"
                                                );
                                            }}
                                            className={styles.declineButton}
                                        >
                                            <XIcon /> Ignore
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleConnectionAction(
                                                    req._id,
                                                    "accept"
                                                );
                                            }}
                                            className={styles.acceptButton}
                                        >
                                            <CheckIcon /> Connect
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "network" && (
                    <div className={styles.networkList}>
                        {myNetworkList.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>
                                    Network empty. Initialize new connections in
                                    Discover.
                                </p>
                                <button
                                    className={styles.discoverBtn}
                                    onClick={() => router.push("/discover")}
                                >
                                    Go to Discover
                                </button>
                            </div>
                        ) : (
                            myNetworkList.map((user) => (
                                <div
                                    className={styles.networkRow}
                                    key={user._id}
                                >
                                    <div
                                        className={styles.rowLeft}
                                        onClick={() =>
                                            router.push(
                                                `/view_profile/${user.username}`
                                            )
                                        }
                                    >
                                        <div
                                            className={
                                                styles.avatarContainerSmall
                                            }
                                        >
                                            <img
                                                src={user.profilePicture}
                                                alt=""
                                                className={
                                                    styles.profilePictureSmall
                                                }
                                            />
                                            {isUserOnline(
                                                user._id,
                                                user.isOnline
                                            ) && (
                                                <span
                                                    className={
                                                        styles.onlineDotSmall
                                                    }
                                                ></span>
                                            )}
                                        </div>
                                        <div className={styles.rowInfo}>
                                            <h3>{user.name}</h3>
                                            <p>@{user.username}</p>
                                        </div>
                                    </div>
                                    <div className={styles.rowActions}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMessageUser(
                                                    user.username
                                                );
                                            }}
                                        >
                                            <MessageIcon />
                                        </button>
                                        <button
                                            className={styles.actionBtnPrimary}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartOneOnOneCall(user);
                                            }}
                                        >
                                            <VideoIcon />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

MyConnectionsPage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};
