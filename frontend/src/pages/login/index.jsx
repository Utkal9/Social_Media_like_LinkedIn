// frontend/src/pages/login/index.jsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import styles from "./style.module.css";
import { loginUser, registerUser } from "@/config/redux/action/authAction";
import { emptyMessage } from "@/config/redux/reducer/authReducer";
import clientServer from "@/config";
import Head from "next/head";

// --- Icons ---
const GoogleIcon = () => (
    <svg
        viewBox="0 0 24 24"
        style={{ width: "20px", height: "20px", marginRight: "10px" }}
    >
        <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        />
        <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

export default function LoginComponent() {
    const authState = useSelector((state) => state.auth);
    const router = useRouter();
    const dispatch = useDispatch();

    const [viewState, setViewState] = useState("login");
    const [signInData, setSignInData] = useState({ email: "", password: "" });
    const [signUpData, setSignUpData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
    });
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    useEffect(() => {
        if (authState.loggedIn || localStorage.getItem("token")) {
            router.push("/");
        }
    }, [authState.loggedIn, router]);

    useEffect(() => {
        dispatch(emptyMessage());
        setForgotMessage("");
        // If moving away from login, reset the success message
        if (viewState !== "login") {
            setRegistrationSuccess(false);
        }
    }, [viewState, dispatch]);

    const handleSignInChange = (e) =>
        setSignInData({ ...signInData, [e.target.name]: e.target.value });
    const handleSignUpChange = (e) =>
        setSignUpData({ ...signUpData, [e.target.name]: e.target.value });

    const handleSignInSubmit = (e) => {
        e.preventDefault();
        dispatch(loginUser(signInData));
    };

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(registerUser(signUpData));
        // --- NEW: Auto-switch to Login on Success ---
        if (result.meta.requestStatus === "fulfilled") {
            setRegistrationSuccess(true);
            setViewState("login");
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await clientServer.post("/forgot_password", {
                email: forgotEmail,
            });
            setForgotMessage(response.data.message);
        } catch (error) {
            setForgotMessage(error.response?.data?.message || "Request failed");
        }
    };

    const authMessage =
        viewState === "forgot"
            ? forgotMessage
            : authState.message?.message || authState.message;

    const isError =
        authState.isError ||
        (authMessage &&
            !authMessage.toLowerCase().includes("success") &&
            !authMessage.toLowerCase().includes("sent"));

    return (
        <div className={styles.authPageWrapper}>
            <Head>
                <title>Login | LinkUps</title>
            </Head>

            <div className={styles.ambientOrbTop}></div>
            <div className={styles.ambientOrbBottom}></div>

            <div className="container h-100 d-flex align-items-center justify-content-center">
                <div className={`row w-100 ${styles.authCardContainer}`}>
                    {/* LEFT SIDE: Visual (Updated Text) */}
                    <div
                        className={`col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center ${styles.visualPanel}`}
                    >
                        <div className={styles.hologramEffect}>
                            <div className={styles.scanline}></div>
                            <img
                                src="/images/homemain_connection.jpg"
                                alt="LinkUps Network"
                                className={styles.visualImage}
                            />
                        </div>
                        <div className="mt-4 text-center">
                            <h2 className={styles.visualTitle}>
                                Welcome to LinkUps
                            </h2>
                            <p className={styles.visualText}>
                                Connect, collaborate, and grow your professional
                                network in a secure environment.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Form */}
                    <div className="col-lg-6 col-12 d-flex align-items-center justify-content-center position-relative">
                        <div className={styles.glassForm}>
                            <div className={styles.formHeader}>
                                <div className={styles.loginLogo}>
                                    <span>Link</span>Ups
                                </div>
                                <h1 className={styles.formTitle}>
                                    {viewState === "login" && "Welcome Back"}
                                    {viewState === "register" &&
                                        "Create Account"}
                                    {viewState === "forgot" && "Reset Password"}
                                </h1>
                                <p className={styles.formSubtitle}>
                                    {viewState === "login" &&
                                        "Please login to continue"}
                                    {viewState === "register" &&
                                        "Join our professional community"}
                                    {viewState === "forgot" &&
                                        "Enter email to reset password"}
                                </p>
                            </div>

                            {/* Login */}
                            {viewState === "login" && (
                                <form onSubmit={handleSignInSubmit}>
                                    <button
                                        type="button"
                                        className={styles.socialBtn}
                                        onClick={() =>
                                            alert("Feature Coming Soon")
                                        }
                                    >
                                        <GoogleIcon /> Continue with Google
                                    </button>
                                    <div className={styles.divider}>
                                        <span>OR</span>
                                    </div>
                                    <div className="mb-3">
                                        <label className={styles.holoLabel}>
                                            Email Address
                                        </label>
                                        <input
                                            className={styles.holoInput}
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            onChange={handleSignInChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className={styles.holoLabel}>
                                            Password
                                        </label>
                                        <input
                                            className={styles.holoInput}
                                            name="password"
                                            type="password"
                                            placeholder="Enter your password"
                                            onChange={handleSignInChange}
                                            required
                                        />
                                    </div>

                                    {/* Success Message from Auto-Switch */}
                                    {registrationSuccess && (
                                        <div className={styles.msgSuccess}>
                                            Registration Successful! Please
                                            login.
                                        </div>
                                    )}

                                    {authMessage && !registrationSuccess && (
                                        <div
                                            className={
                                                isError
                                                    ? styles.msgError
                                                    : styles.msgSuccess
                                            }
                                        >
                                            {authMessage}
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-end mb-4">
                                        <span
                                            className={styles.linkAction}
                                            onClick={() =>
                                                setViewState("forgot")
                                            }
                                        >
                                            Forgot Password?
                                        </span>
                                    </div>
                                    <button
                                        type="submit"
                                        className={styles.btnNeon}
                                        disabled={authState.isLoading}
                                    >
                                        {authState.isLoading
                                            ? "Logging in..."
                                            : "Login"}
                                    </button>
                                </form>
                            )}

                            {/* Register */}
                            {viewState === "register" && (
                                <form onSubmit={handleSignUpSubmit}>
                                    <div className="mb-3">
                                        <label className={styles.holoLabel}>
                                            Full Name
                                        </label>
                                        <input
                                            className={styles.holoInput}
                                            name="name"
                                            type="text"
                                            placeholder="John Doe"
                                            onChange={handleSignUpChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className={styles.holoLabel}>
                                            Username
                                        </label>
                                        <input
                                            className={styles.holoInput}
                                            name="username"
                                            type="text"
                                            placeholder="johndoe123"
                                            onChange={handleSignUpChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className={styles.holoLabel}>
                                            Email
                                        </label>
                                        <input
                                            className={styles.holoInput}
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            onChange={handleSignUpChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className={styles.holoLabel}>
                                            Password
                                        </label>
                                        <input
                                            className={styles.holoInput}
                                            name="password"
                                            type="password"
                                            placeholder="Create a password"
                                            onChange={handleSignUpChange}
                                            required
                                        />
                                    </div>
                                    {authMessage && (
                                        <div
                                            className={
                                                isError
                                                    ? styles.msgError
                                                    : styles.msgSuccess
                                            }
                                        >
                                            {authMessage}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className={styles.btnNeon}
                                        disabled={authState.isLoading}
                                    >
                                        {authState.isLoading
                                            ? "Creating Account..."
                                            : "Sign Up"}
                                    </button>
                                </form>
                            )}

                            {/* Forgot */}
                            {viewState === "forgot" && (
                                <form onSubmit={handleForgotSubmit}>
                                    <div className="mb-4">
                                        <label className={styles.holoLabel}>
                                            Registered Email
                                        </label>
                                        <input
                                            className={styles.holoInput}
                                            value={forgotEmail}
                                            onChange={(e) =>
                                                setForgotEmail(e.target.value)
                                            }
                                            type="email"
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>
                                    {authMessage && (
                                        <div
                                            className={
                                                isError
                                                    ? styles.msgError
                                                    : styles.msgSuccess
                                            }
                                        >
                                            {authMessage}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className={styles.btnNeon}
                                    >
                                        Send Reset Link
                                    </button>
                                    <div className="text-center mt-3">
                                        <span
                                            className={styles.linkAction}
                                            onClick={() =>
                                                setViewState("login")
                                            }
                                        >
                                            Return to Login
                                        </span>
                                    </div>
                                </form>
                            )}

                            <div className={styles.formFooter}>
                                {viewState === "login" && (
                                    <p>
                                        Don't have an account?{" "}
                                        <span
                                            className={styles.linkHighlight}
                                            onClick={() =>
                                                setViewState("register")
                                            }
                                        >
                                            Sign Up
                                        </span>
                                    </p>
                                )}
                                {viewState === "register" && (
                                    <p>
                                        Already have an account?{" "}
                                        <span
                                            className={styles.linkHighlight}
                                            onClick={() =>
                                                setViewState("login")
                                            }
                                        >
                                            Login
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
