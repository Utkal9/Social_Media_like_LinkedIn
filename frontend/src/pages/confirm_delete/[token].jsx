import React, { useState } from "react";
import { useRouter } from "next/router";
import clientServer from "@/config";
import styles from "@/pages/login/style.module.css"; // Reusing login styles for consistency
import Head from "next/head";
import { useDispatch } from "react-redux";
import { reset } from "@/config/redux/reducer/authReducer"; // To logout user

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
            await clientServer.delete(`/confirm_delete_account/${token}`);

            // Cleanup Frontend
            localStorage.removeItem("token");
            localStorage.removeItem("tokenTimestamp");
            dispatch(reset()); // Reset Redux Auth state

            setMessage("Account successfully deleted. Redirecting...");
            setIsError(false);

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
                <title>Delete Account | LinkUps</title>
            </Head>
            <div className="container h-100 d-flex align-items-center justify-content-center">
                <div
                    className={styles.glassForm}
                    style={{
                        maxWidth: "450px",
                        marginTop: "100px",
                        textAlign: "center",
                    }}
                >
                    <div className={styles.formHeader}>
                        <h1
                            className={styles.formTitle}
                            style={{ color: "#ff4d7d" }}
                        >
                            Final Warning
                        </h1>
                        <p className={styles.formSubtitle}>
                            You are about to permanently delete your account and
                            all associated data.
                        </p>
                    </div>

                    {!message ? (
                        <div style={{ padding: "20px 0" }}>
                            <div
                                className={styles.hologramEffect}
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    margin: "0 auto 20px",
                                    borderColor: "#ff4d7d",
                                }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#ff4d7d"
                                    strokeWidth={1.5}
                                    width="40"
                                    height="40"
                                    style={{ margin: "20px" }}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97z"
                                    />
                                </svg>
                            </div>

                            <button
                                onClick={handleFinalDelete}
                                className={styles.btnNeon}
                                disabled={isLoading}
                                style={{
                                    backgroundColor: "#ff4d7d",
                                    boxShadow:
                                        "0 0 15px rgba(255, 77, 125, 0.4)",
                                }}
                            >
                                {isLoading
                                    ? "Deleting..."
                                    : "Confirm Final Deletion"}
                            </button>

                            <button
                                onClick={() => router.push("/")}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#ccc",
                                    marginTop: "15px",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div
                            className={
                                isError ? styles.msgError : styles.msgSuccess
                            }
                        >
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
