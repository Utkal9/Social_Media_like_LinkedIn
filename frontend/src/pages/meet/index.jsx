// frontend/src/pages/meet/index.jsx
import React, { useState, useEffect } from "react";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import styles from "./index.module.css";
import { useRouter } from "next/router";

// --- Holo Icons ---
const VideoIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="32">
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
const LinkIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
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
    const [meetingCode, setMeetingCode] = useState("");
    const [returnUrl, setReturnUrl] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            setReturnUrl(`${window.location.origin}/dashboard`);
        }
    }, []);

    const handleJoinVideoCall = () => {
        if (!meetingCode.trim()) {
            alert("Please enter a secure channel code.");
            return;
        }
        const baseUrl = `${
            process.env.NEXT_PUBLIC_VIDEO_CALL_URL
        }/${meetingCode.trim()}`;
        const finalUrl = `${baseUrl}?redirect_url=${encodeURIComponent(
            returnUrl
        )}`;
        window.open(finalUrl, "_blank");
    };

    const handleStartNewCall = () => {
        const newRoomId = crypto.randomUUID();
        const baseUrl = `${process.env.NEXT_PUBLIC_VIDEO_CALL_URL}/${newRoomId}`;
        const finalUrl = `${baseUrl}?redirect_url=${encodeURIComponent(
            returnUrl
        )}`;
        window.open(finalUrl, "_blank");
    };

    return (
        <div className={styles.meetContainer}>
            <div className={styles.ambientGlow}></div>

            <div className={styles.contentWrapper}>
                {/* Header Section */}
                <div className={styles.header}>
                    <div className={styles.badge}>
                        <span className={styles.liveDot}></span> Live Uplink
                    </div>
                    <h1>Secure Video Interface</h1>
                    <p>Initialize high-fidelity holographic communication.</p>
                </div>

                {/* Cards Container (Vertical Stack) */}
                <div className={styles.cardStack}>
                    {/* Card 1: Host */}
                    <div className={styles.actionCard}>
                        <div className={styles.cardGlowPrimary}></div>
                        <div className={styles.cardBody}>
                            <div className={styles.iconBoxPrimary}>
                                <VideoIcon />
                            </div>
                            <div className={styles.textContent}>
                                <h3>Initialize Session</h3>
                                <p>Generate a new encrypted room.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleStartNewCall}
                            className={styles.primaryBtn}
                        >
                            Start Meeting <ArrowRightIcon />
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <span>OR</span>
                    </div>

                    {/* Card 2: Join */}
                    <div className={styles.actionCard}>
                        <div className={styles.cardGlowSecondary}></div>
                        <div className={styles.cardBody}>
                            <div className={styles.iconBoxSecondary}>
                                <LinkIcon />
                            </div>
                            <div className={styles.textContent}>
                                <h3>Join Channel</h3>
                                <p>Enter destination code.</p>
                            </div>
                        </div>

                        <div className={styles.inputArea}>
                            <div className={styles.inputWrapper}>
                                <div className={styles.inputIcon}>
                                    <KeyboardIcon />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter Code (e.g. room-123)"
                                    value={meetingCode}
                                    onChange={(e) =>
                                        setMeetingCode(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        handleJoinVideoCall()
                                    }
                                />
                            </div>
                            <button
                                onClick={handleJoinVideoCall}
                                className={styles.joinBtn}
                                disabled={!meetingCode.trim()}
                            >
                                Connect
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

MeetPage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};

export default MeetPage;
