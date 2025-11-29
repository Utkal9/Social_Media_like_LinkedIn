import React, { useState } from "react";
import { useRouter } from "next/router";
import clientServer from "@/config";
import styles from "@/pages/login/style.module.css"; // Reusing login styles
import Head from "next/head";
import { useDispatch } from "react-redux";
import { reset } from "@/config/redux/reducer/authReducer";

// --- Icons ---
const WarningIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        width="60"
        height="60"
        style={{ color: "#ff4d7d" }}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
    </svg>
);

const TrashIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        width="20"
        height="20"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z"
        />
    </svg>
);

export default function ConfirmDeletePage() {
    const router = useRouter();
    const { token } = router.query;
    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleFinalDelete = async () => {
        setIsLoading(true);
        try {
            // 1. Call Backend to delete everything
            await clientServer.delete(`/confirm_delete_account/${token}`);

            // 2. Clear Local Storage
            localStorage.removeItem("token");
            localStorage.removeItem("tokenTimestamp");

            // 3. Reset Redux State
            dispatch(reset());

            setMessage("Account successfully deleted. Goodbye.");
            setIsError(false);

            // 4. Redirect to Login after 3 seconds
            setTimeout(() => {
                window.location.href = "/login";
            }, 3000);
        } catch (err) {
            setIsError(true);
            setMessage(
                err.response?.data?.message ||
                    "Deletion failed. Token may be invalid or expired."
            );
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authPageWrapper}>
            <Head>
                <title>Confirm Deletion | LinkUps</title>
            </Head>

            <div className={styles.ambientOrbTop}></div>
            <div className={styles.ambientOrbBottom}></div>

            <div className="container h-100 d-flex align-items-center justify-content-center">
                <div
                    className={styles.glassForm}
                    style={{ maxWidth: "500px", marginTop: "60px" }}
                >
                    <div className={styles.formHeader}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <div
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "50%",
                                    background: "rgba(255, 77, 125, 0.1)",
                                    border: "2px solid #ff4d7d",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow:
                                        "0 0 30px rgba(255, 77, 125, 0.3)",
                                }}
                            >
                                <WarningIcon />
                            </div>
                        </div>
                        <h1
                            className={styles.formTitle}
                            style={{ color: "#ff4d7d" }}
                        >
                            Final Warning
                        </h1>
                        <p className={styles.formSubtitle}>
                            You are about to permanently delete your account.
                        </p>
                    </div>

                    {!message ? (
                        <div style={{ textAlign: "center", padding: "0 10px" }}>
                            <p
                                style={{
                                    color: "var(--text-primary)",
                                    fontSize: "0.95rem",
                                    marginBottom: "20px",
                                    lineHeight: "1.6",
                                }}
                            >
                                This action will wipe all your data, including:
                            </p>
                            <ul
                                style={{
                                    textAlign: "left",
                                    color: "var(--text-secondary)",
                                    fontSize: "0.9rem",
                                    marginBottom: "30px",
                                    listStyle: "none",
                                    padding: "15px",
                                    background: "var(--holo-glass)",
                                    borderRadius: "8px",
                                    border: "1px solid var(--holo-border)",
                                }}
                            >
                                <li style={{ marginBottom: "8px" }}>
                                    ❌ Your Profile & Resume Data
                                </li>
                                <li style={{ marginBottom: "8px" }}>
                                    ❌ All your Posts & Comments
                                </li>
                                <li style={{ marginBottom: "8px" }}>
                                    ❌ All Connections & Messages
                                </li>
                                <li>❌ All Uploaded Images & Videos</li>
                            </ul>

                            <button
                                onClick={handleFinalDelete}
                                className={styles.btnNeon}
                                disabled={isLoading}
                                style={{
                                    backgroundColor: "#ff4d7d",
                                    boxShadow:
                                        "0 0 20px rgba(255, 77, 125, 0.4)",
                                    border: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "10px",
                                }}
                            >
                                {isLoading ? (
                                    "Deleting Data..."
                                ) : (
                                    <>
                                        <TrashIcon /> Confirm Final Deletion
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => router.push("/")}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-secondary)",
                                    marginTop: "20px",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    fontSize: "0.9rem",
                                }}
                            >
                                Cancel and Return to Safety
                            </button>
                        </div>
                    ) : (
                        <div
                            className={
                                isError ? styles.msgError : styles.msgSuccess
                            }
                            style={{ marginTop: "20px" }}
                        >
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
