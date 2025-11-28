import React, { useState } from "react";
import { useRouter } from "next/router";
import clientServer from "@/config";
import styles from "@/pages/login/style.module.css"; // Reusing login styles
import Head from "next/head";

export default function ResetPasswordPage() {
    const router = useRouter();
    const { token } = router.query; // Get token from URL

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(true);
            setMessage("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const res = await clientServer.put(`/reset_password/${token}`, {
                password,
            });
            setError(false);
            setMessage(res.data.message);
            // Redirect to login after 2 seconds
            setTimeout(() => router.push("/login"), 2000);
        } catch (err) {
            setError(true);
            setMessage(err.response?.data?.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authPageWrapper}>
            <Head>
                <title>Reset Password | LinkUps</title>
            </Head>
            <div className="container h-100 d-flex align-items-center justify-content-center">
                <div
                    className={styles.glassForm}
                    style={{ maxWidth: "400px", marginTop: "100px" }}
                >
                    <div className={styles.formHeader}>
                        <h1 className={styles.formTitle}>Reset Password</h1>
                        <p className={styles.formSubtitle}>
                            Enter your new secure password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className={styles.holoLabel}>
                                New Password
                            </label>
                            <input
                                className={styles.holoInput}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="mb-4">
                            <label className={styles.holoLabel}>
                                Confirm Password
                            </label>
                            <input
                                className={styles.holoInput}
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                                minLength={6}
                            />
                        </div>

                        {message && (
                            <div
                                className={
                                    error ? styles.msgError : styles.msgSuccess
                                }
                            >
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={styles.btnNeon}
                            disabled={isLoading}
                        >
                            {isLoading ? "Resetting..." : "Set New Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
