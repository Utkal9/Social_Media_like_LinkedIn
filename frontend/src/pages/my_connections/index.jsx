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

const VIDEO_CALL_URL =
    process.env.NEXT_PUBLIC_VIDEO_CALL_URL || "http://localhost:3001";

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
        const baseRoomUrl = `${VIDEO_CALL_URL}/${roomId}`;
        const returnUrl = `${window.location.origin}/dashboard`;
        const roomUrlWithRedirect = `${baseRoomUrl}?redirect_url=${encodeURIComponent(
            returnUrl
        )}`;
        socket.emit("start-call", {
            fromUser: currentUser,
            toUserId: connectionUserId,
            roomUrl: roomUrlWithRedirect,
        });
        window.open(roomUrlWithRedirect, "_blank");
    };

    const handleMessageUser = (username) => {
        router.push(`/messaging?chatWith=${username}`);
    };

    const isUserOnline = (uid, defaultStatus) => {
        return onlineStatuses && onlineStatuses[uid]
            ? onlineStatuses[uid].isOnline
            : defaultStatus;
    };

    // --- FIX: Safe Array Handling ---
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
        <div className={styles.connectionsContainer}>
            <h2>Manage Connections</h2>
            <div className={styles.tabContainer}>
                <button
                    className={
                        activeTab === "received" ? styles.activeTab : styles.tab
                    }
                    onClick={() => setActiveTab("received")}
                >
                    Received{" "}
                    {pendingRequests.length > 0 &&
                        `(${pendingRequests.length})`}
                </button>
                <button
                    className={
                        activeTab === "network" ? styles.activeTab : styles.tab
                    }
                    onClick={() => setActiveTab("network")}
                >
                    My Network{" "}
                    {myNetworkList.length > 0 && `(${myNetworkList.length})`}
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === "received" && (
                    <div className={styles.contentGrid}>
                        {pendingRequests.length === 0 ? (
                            <p className={styles.noItemsMessage}>
                                No pending connection requests.
                            </p>
                        ) : (
                            pendingRequests.map((req) => (
                                <div
                                    className={styles.requestCard}
                                    key={req._id}
                                >
                                    <div
                                        className={styles.avatarContainer}
                                        onClick={() =>
                                            router.push(
                                                `/view_profile/${req.userId.username}`
                                            )
                                        }
                                        style={{ cursor: "pointer" }}
                                    >
                                        <img
                                            src={req.userId.profilePicture}
                                            alt=""
                                            className={styles.profilePicture}
                                        />
                                        {isUserOnline(
                                            req.userId._id,
                                            req.userId.isOnline
                                        ) && (
                                            <span
                                                className={
                                                    styles.onlineDotLarge
                                                }
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
                                            Decline
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
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "network" && (
                    <div className={styles.listGrid}>
                        {myNetworkList.length === 0 ? (
                            <p className={styles.noItemsMessage}>
                                Your network is empty. Go discover people!
                            </p>
                        ) : (
                            myNetworkList.map((user) => (
                                <div
                                    className={styles.networkCard}
                                    key={user._id}
                                    onClick={() =>
                                        router.push(
                                            `/view_profile/${user.username}`
                                        )
                                    }
                                >
                                    <div className={styles.networkCardInfo}>
                                        <div className={styles.avatarContainer}>
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
                                        <div className={styles.userInfo}>
                                            <h3>{user.name}</h3>
                                            <p>@{user.username}</p>
                                        </div>
                                    </div>
                                    <div className={styles.actionsGroup}>
                                        <button
                                            className={
                                                styles.actionBtnSecondary
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMessageUser(
                                                    user.username
                                                );
                                            }}
                                        >
                                            Message
                                        </button>
                                        <button
                                            className={styles.actionBtnPrimary}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartOneOnOneCall(user);
                                            }}
                                        >
                                            Call
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
