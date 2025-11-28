// frontend/src/pages/meet/index.jsx
import React, { useState, useEffect } from "react";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import Head from "next/head";

// Icons (Keep existing icons)
const VideoIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24">
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
    </svg>
);
const KeyboardIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="20"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
        />
    </svg>
);
const PlusIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        width="20"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
        />
    </svg>
);
const ArrowRightIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        width="18"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
        />
    </svg>
);

function MeetPage() {
    const [roomId, setRoomId] = useState("");
    const router = useRouter();

    const handleCreateMeeting = () => {
        const newRoomId = Math.random().toString(36).substring(2, 9);
        router.push(`/meet/${newRoomId}`); // <--- CHANGED: Internal Route
    };

    const handleJoinMeeting = () => {
        if (!roomId.trim()) return;
        router.push(`/meet/${roomId.trim()}`); // <--- CHANGED: Internal Route
    };

    return (
        <div className={styles.meetContainer}>
            <Head>
                <title>Meet | LinkUps</title>
            </Head>
            <div className={styles.bgGlow}></div>

            <div className={styles.mainWrapper}>
                <div className={styles.headerSection}>
                    <div className={styles.badge}>
                        <span className={styles.liveDot}></span> Live Uplink
                    </div>
                    <h1 className={styles.title}>
                        LinkUps <span className={styles.highlight}>Meet</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Secure, high-fidelity video conferencing.
                    </p>
                </div>

                <div className={styles.actionGrid}>
                    {/* Create */}
                    <div className={styles.glassCard}>
                        <div
                            className={styles.cardIconWrapper}
                            style={{
                                background:
                                    "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                            }}
                        >
                            <VideoIcon />
                        </div>
                        <h3 className={styles.cardTitle}>New Meeting</h3>
                        <p className={styles.cardDesc}>Create a secure room.</p>
                        <button
                            onClick={handleCreateMeeting}
                            className={styles.primaryBtn}
                        >
                            <PlusIcon /> Start Instant Meeting
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <span>OR</span>
                    </div>

                    {/* Join */}
                    <div className={styles.glassCard}>
                        <div
                            className={styles.cardIconWrapper}
                            style={{
                                background:
                                    "linear-gradient(135deg, #0fffc6, #059669)",
                            }}
                        >
                            <KeyboardIcon />
                        </div>
                        <h3 className={styles.cardTitle}>Join Meeting</h3>
                        <p className={styles.cardDesc}>
                            Enter a code to connect.
                        </p>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="Enter Room ID"
                                className={styles.inputField}
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleJoinMeeting()
                                }
                            />
                            <button
                                onClick={handleJoinMeeting}
                                className={styles.joinBtn}
                                disabled={!roomId.trim()}
                            >
                                <ArrowRightIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

MeetPage.getLayout = (page) => (
    <UserLayout>
        <DashboardLayout>{page}</DashboardLayout>
    </UserLayout>
);
export default MeetPage;
