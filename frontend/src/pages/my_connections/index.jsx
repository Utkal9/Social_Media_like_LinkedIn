// frontend/src/pages/my_connections/index.jsx

import {
    AcceptConnection,
    getMyConnectionRequests,
    getConnectionsRequest,
} from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.css";
import { useRouter } from "next/router";

export default function MyConnectionsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const authState = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState("received");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // 1. Fetch requests sent TO me
            dispatch(getMyConnectionRequests({ token }));
            // 2. Fetch requests sent BY me
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

    // --- LOGIC START ---

    // 1. Pending Requests (Received Only)
    const pendingRequests = authState.connectionRequest.filter(
        (connection) => connection.status_accepted === null
    );

    // 2. Accepted Connections (Both directions)
    // Direction A: Someone sent to me, I accepted
    const receivedAccepted = authState.connectionRequest.filter(
        (connection) => connection.status_accepted === true
    );
    // Direction B: I sent to someone, they accepted
    const sentAccepted = authState.connections.filter(
        (connection) => connection.status_accepted === true
    );

    // 3. Merge into a unique Map to remove duplicates
    // We use the User ID as the key
    const networkMap = new Map();

    receivedAccepted.forEach((req) => {
        if (req.userId) {
            networkMap.set(req.userId._id, req.userId);
        }
    });

    sentAccepted.forEach((req) => {
        if (req.connectionId) {
            networkMap.set(req.connectionId._id, req.connectionId);
        }
    });

    // Convert Map values back to an array for rendering
    const myNetworkList = Array.from(networkMap.values());

    // --- LOGIC END ---

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
                                    <img
                                        src={req.userId.profilePicture}
                                        alt=""
                                        className={styles.profilePicture}
                                        onClick={() =>
                                            router.push(
                                                `/view_profile/${req.userId.username}`
                                            )
                                        }
                                    />
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
