// frontend/src/pages/my_connections/index.jsx

import {
    AcceptConnection,
    getMyConnectionRequests,
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
        dispatch(
            getMyConnectionRequests({ token: localStorage.getItem("token") })
        );
    }, [dispatch]);

    // Unified handler for Accept/Decline actions
    const handleConnectionAction = (requestId, action) => {
        dispatch(
            AcceptConnection({
                connectionId: requestId,
                token: localStorage.getItem("token"),
                action: action, // "accept" or "decline"
            })
        );
    };

    // Filter lists for cleaner rendering
    const pendingRequests = authState.connectionRequest.filter(
        (connection) => connection.status_accepted === null
    );
    const myNetwork = authState.connectionRequest.filter(
        (connection) => connection.status_accepted === true
    );

    // <UserLayout><DashboardLayout> ... </DashboardLayout></UserLayout> <-- REMOVED
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
            </div>

            {/* --- Tab Content --- */}
            <div className={styles.tabContent}>
                {activeTab === "received" && (
                    <div className={styles.contentGrid}>
                        {pendingRequests.length === 0 ? (
                            <p className={styles.noItemsMessage}>
                                No pending connection requests.
                            </p>
                        ) : (
                            pendingRequests.map((user) => (
                                <div
                                    className={styles.requestCard}
                                    key={user._id}
                                >
                                    {/* --- FIX: Removed ${BASE_URL}/ --- */}
                                    <img
                                        src={user.userId.profilePicture}
                                        alt=""
                                        className={styles.profilePicture}
                                        onClick={() =>
                                            router.push(
                                                `/view_profile/${user.userId.username}`
                                            )
                                        }
                                    />
                                    {/* --- END FIX --- */}
                                    <div className={styles.userInfo}>
                                        <h3
                                            onClick={() =>
                                                router.push(
                                                    `/view_profile/${user.userId.username}`
                                                )
                                            }
                                        >
                                            {user.userId.name}
                                        </h3>
                                        <p>@{user.userId.username}</p>
                                    </div>
                                    <div className={styles.buttonGroup}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleConnectionAction(
                                                    user._id,
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
                                                    user._id,
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
                                            `/view_profile/${user.userId.username}`
                                        )
                                    }
                                >
                                    {/* --- FIX: Removed ${BASE_URL}/ --- */}
                                    <img
                                        src={user.userId.profilePicture}
                                        alt=""
                                        className={styles.profilePictureSmall}
                                    />
                                    {/* --- END FIX --- */}
                                    <div className={styles.userInfo}>
                                        <h3>{user.userId.name}</h3>
                                        <p>@{user.userId.username}</p>
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

// ADDED THIS:
MyConnectionsPage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};
