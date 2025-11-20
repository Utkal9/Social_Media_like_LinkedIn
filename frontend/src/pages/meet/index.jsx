import React, { useState, useEffect } from "react";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import styles from "./index.module.css";

// --- Icons ---
const VideoIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={styles.icon}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z"
        />
    </svg>
);

const KeyboardIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={styles.icon}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
        />
    </svg>
);
// --- End Icons ---

function MeetPage() {
    const [meetingCode, setMeetingCode] = useState("");
    const [returnUrl, setReturnUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setReturnUrl(`${window.location.origin}/dashboard`);
        }
    }, []);

    const handleJoinVideoCall = () => {
        if (!meetingCode.trim()) {
            alert("Please enter a meeting code.");
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
            <div className={styles.contentWrapper}>
                <div className={styles.actionSection}>
                    <div className={styles.header}>
                        <h1>Video Meetings</h1>
                        <p>
                            Connect with your professional network instantly.
                            Secure, high-quality video conferencing for
                            everyone.
                        </p>
                    </div>

                    <div className={styles.cardContainer}>
                        {/* Start New Meeting Card */}
                        <div className={styles.actionCard}>
                            <div className={styles.iconWrapperPrimary}>
                                <VideoIcon />
                            </div>
                            <div className={styles.cardText}>
                                <h3>New Meeting</h3>
                                <p>
                                    Create a new meeting link and share it with
                                    others.
                                </p>
                            </div>
                            <button
                                onClick={handleStartNewCall}
                                className={styles.primaryButton}
                            >
                                Start Instant Meeting
                            </button>
                        </div>

                        <div className={styles.divider}>
                            <span>OR</span>
                        </div>

                        {/* Join Meeting Card */}
                        <div className={styles.actionCard}>
                            <div className={styles.iconWrapperSecondary}>
                                <KeyboardIcon />
                            </div>
                            <div className={styles.cardText}>
                                <h3>Join with Code</h3>
                                <p>
                                    Enter the code provided by the meeting
                                    organizer.
                                </p>
                            </div>
                            <div className={styles.inputGroup}>
                                <input
                                    type="text"
                                    placeholder="Enter meeting code"
                                    value={meetingCode}
                                    onChange={(e) =>
                                        setMeetingCode(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        handleJoinVideoCall()
                                    }
                                />
                                <button
                                    onClick={handleJoinVideoCall}
                                    className={styles.secondaryButton}
                                    disabled={!meetingCode.trim()}
                                >
                                    Join
                                </button>
                            </div>
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
