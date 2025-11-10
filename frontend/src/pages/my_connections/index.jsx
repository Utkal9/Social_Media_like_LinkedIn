// frontend/src/pages/my_connections/index.jsx

import {
    getMyNetwork,
    getPendingIncomingRequests,
    getPendingSentRequests,
    respondToConnectionRequest,
} from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout"; // Import
import UserLayout from "@/layout/UserLayout"; // Import
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.css";
// import { BASE_URL } from "@/config"; // <-- No longer needed
import { useRouter } from "next/router";

export default function MyConnectionsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const authState = useSelector((state) => state.auth);

    // State to manage active tab
    const [activeTab, setActiveTab] = useState("received");

    useEffect(() => {
        const token = localStorage.getItem("token");
        // --- NEW: Dispatch all three actions ---
        dispatch(getMyNetwork({ token }));
        dispatch(getPendingIncomingRequests({ token }));
        dispatch(getPendingSentRequests({ token }));
    }, [dispatch]);

    // Unified handler for Accept/Decline actions
    const handleConnectionAction = (requestId, action) => {
        dispatch(
            respondToConnectionRequest({
                requestId: requestId,
                token: localStorage.getItem("token"),
                action_type: action, // "accept" or "decline"
            })
        );
    };
    const pendingRequests = authState.pendingIncoming;
    const myNetwork = authState.myNetwork;
    const sentRequests = authState.pendingSent;
    return (
        <div className={styles.connectionsContainer}>
            <h2>Manage Connections</h2>

            {/* --- Tab Navigation --- */}
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
                    My Network {myNetwork.length > 0 && `(${myNetwork.length})`}
                </button>
                {/* --- NEW "SENT" TAB --- */}
                <button
                    className={
                        activeTab === "sent" ? styles.activeTab : styles.tab
                    }
                    onClick={() => setActiveTab("sent")}
                >
                    Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
                </button>
            </div>

            {/* --- Tab Content --- */}
            <div className={styles.tabContent}>
                {/* --- RECEIVED TAB --- */}
                {activeTab === "received" && (
                    <div className={styles.contentGrid}>
                        {pendingRequests.length === 0 ? (
                            <p className={styles.noItemsMessage}>
                                No pending connection requests.
                            </p>
                        ) : (
                            pendingRequests.map((request) => (
                                <div
                                    className={styles.requestCard}
                                    key={request._id}
                                >
                                    <img
                                        src={request.requester.profilePicture}
                                        alt=""
                                        className={styles.profilePicture}
                                        onClick={() =>
                                            router.push(
                                                `/view_profile/${request.requester.username}`
                                            )
                                        }
                                    />
                                    <div className={styles.userInfo}>
                                        <h3
                                            onClick={() =>
                                                router.push(
                                                    `/view_profile/${request.requester.username}`
                                                )
                                            }
                                        >
                                            {request.requester.name}
                                        </h3>
                                        <p>@{request.requester.username}</p>
                                    </div>
                                    <div className={styles.buttonGroup}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleConnectionAction(
                                                    request._id,
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
                                                    request._id,
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

                {/* --- MY NETWORK TAB --- */}
                {activeTab === "network" && (
                    <div className={styles.listGrid}>
                        {myNetwork.length === 0 ? (
                            <p className={styles.noItemsMessage}>
                                Your network is empty. Go discover people!
                            </p>
                        ) : (
                            myNetwork.map((user) => (
                                <div
                                    className={styles.networkCard}
                                    key={user._id}
                                    onClick={() =>
                                        router.push(
                                            `/view_profile/${user.username}`
                                        )
                                    }
                                >
                                    <img
                                        src={user.profilePicture}
                                        alt=""
                                        className={styles.profilePictureSmall}
                                    />
                                    <div className={styles.userInfo}>
                                        <h3>{user.name}</h3>
                                        <p>@{user.username}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- SENT TAB --- */}
                {activeTab === "sent" && (
                    <div className={styles.listGrid}>
                        {sentRequests.length === 0 ? (
                            <p className={styles.noItemsMessage}>
                                No pending sent requests.
                            </p>
                        ) : (
                            sentRequests.map((request) => (
                                <div
                                    className={styles.networkCard}
                                    key={request._id}
                                    onClick={() =>
                                        router.push(
                                            `/view_profile/${request.recipient.username}`
                                        )
                                    }
                                >
                                    <img
                                        src={request.recipient.profilePicture}
                                        alt=""
                                        className={styles.profilePictureSmall}
                                    />
                                    <div className={styles.userInfo}>
                                        <h3>{request.recipient.name}</h3>
                                        <p>@{request.recipient.username}</p>
                                    </div>
                                    {/* Optional: Add a "Withdraw" button here */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // You would need to create this action
                                            // It would be identical to "decline"
                                            handleConnectionAction(
                                                request._id,
                                                "decline"
                                            );
                                        }}
                                        className={styles.declineButton}
                                        style={{ marginLeft: "auto" }}
                                    >
                                        Withdraw
                                    </button>
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
