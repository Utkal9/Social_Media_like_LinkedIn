import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import styles from "./style.module.css";
import { loginUser, registerUser } from "@/config/redux/action/authAction";
import { emptyMessage } from "@/config/redux/reducer/authReducer";
import clientServer, { BASE_URL } from "@/config"; // Import BASE_URL

// --- Icons ---
const GoogleIcon = () => (
    <svg
        viewBox="0 0 24 24"
        style={{ width: "20px", height: "20px", marginRight: "10px" }}
    >
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-.97 2.53-1.9 3.31v2.77h3.57c2.08-1.92 3.28-4.7 3.28-8.09z"
        ></path>
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        ></path>
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        ></path>
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        ></path>
        <path fill="none" d="M1 1h22v22H1z"></path>
    </svg>
);

// --- LOGO ---
const LogoIcon = () => (
    <img
        src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1440,h=756,fit=crop,f=jpeg/A3Q7xGO4EOc9ZVJo/chatgpt-image-aug-11-2025-10_04_14-pm-YleQ8RV01OtW9GKv.png"
        alt="Logo"
        style={{
            width: "48px",
            height: "48px",
            objectFit: "cover",
            borderRadius: "8px",
            marginBottom: "10px",
        }}
    />
);
// --- End Icons ---

function LoginComponent() {
    const authState = useSelector((state) => state.auth);
    const router = useRouter();
    const dispatch = useDispatch();

    // States: "login", "register", "forgot"
    const [viewState, setViewState] = useState("login");

    // Form Data
    const [signInData, setSignInData] = useState({ email: "", password: "" });
    const [signUpData, setSignUpData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
    });
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotMessage, setForgotMessage] = useState("");

    // Redirect if already logged in
    useEffect(() => {
        if (authState.loggedIn || localStorage.getItem("token")) {
            router.push("/dashboard");
        }
    }, [authState.loggedIn, router]);

    // Clear messages when switching forms
    useEffect(() => {
        dispatch(emptyMessage());
        setForgotMessage("");
    }, [viewState, dispatch]);

    const handleSignInChange = (e) => {
        setSignInData({ ...signInData, [e.target.name]: e.target.value });
    };

    const handleSignUpChange = (e) => {
        setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
    };

    const handleSignInSubmit = (e) => {
        e.preventDefault();
        dispatch(loginUser(signInData));
    };

    const handleSignUpSubmit = (e) => {
        e.preventDefault();
        dispatch(registerUser(signUpData));
    };

    // --- Feature: Forgot Password Submit ---
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        try {
            // Call Backend API
            const response = await clientServer.post("/forgot_password", {
                email: forgotEmail,
            });
            setForgotMessage(response.data.message); // "Reset link sent"
        } catch (error) {
            setForgotMessage(
                error.response?.data?.message || "Something went wrong"
            );
        }
    };

    // --- Feature: Google Sign In ---
    const handleGoogleSignIn = () => {
        // This uses the BASE_URL which is environment-aware (localhost or production)
        // Ensure your backend has a route handling /auth/google
        // window.location.href = `${BASE_URL}/auth/google`;

        alert(`To enable Google Sign-In, you need to configure a Google Cloud Project and set up backend routes.
        
        If configured, this button would redirect to:
        ${BASE_URL || "http://localhost:9090"}/auth/google`);
    };

    // Get the correct message to display (Auth Redux or Local Forgot State)
    const authMessage =
        viewState === "forgot"
            ? forgotMessage
            : authState.message?.message || authState.message;
    const messageIsError =
        authState.isError ||
        (authMessage &&
            typeof authMessage === "string" &&
            !authMessage.toLowerCase().includes("success") &&
            !authMessage.toLowerCase().includes("sent"));

    return (
        <div className={styles.pageContainer}>
            <div className={styles.formCard}>
                <div className={styles.formHeader}>
                    <LogoIcon />
                    <h1>
                        {viewState === "login" && "Welcome Back"}
                        {viewState === "register" && "Create Account"}
                        {viewState === "forgot" && "Reset Password"}
                    </h1>
                    <p>
                        {viewState === "login" &&
                            "Sign in to your Pro Connect account"}
                        {viewState === "register" &&
                            "Join the next-gen professional network"}
                        {viewState === "forgot" &&
                            "Enter your email to recover your account"}
                    </p>
                </div>

                {/* --- LOGIN VIEW --- */}
                {viewState === "login" && (
                    <form
                        className={styles.formContent}
                        onSubmit={handleSignInSubmit}
                    >
                        <button
                            type="button"
                            className={styles.socialButton}
                            onClick={handleGoogleSignIn}
                        >
                            <GoogleIcon />
                            Sign in with Google
                        </button>
                        <div className={styles.divider}>
                            <span>or</span>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={signInData.email}
                                onChange={handleSignInChange}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={signInData.password}
                                onChange={handleSignInChange}
                                required
                            />
                        </div>

                        {authMessage && (
                            <p
                                className={
                                    messageIsError
                                        ? styles.errorMessage
                                        : styles.successMessage
                                }
                            >
                                {authMessage}
                            </p>
                        )}

                        <span
                            className={styles.forgotPassword}
                            onClick={() => setViewState("forgot")}
                            style={{ cursor: "pointer" }}
                        >
                            Forgot your password?
                        </span>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={authState.isLoading}
                        >
                            {authState.isLoading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>
                )}

                {/* --- REGISTER VIEW --- */}
                {viewState === "register" && (
                    <form
                        className={styles.formContent}
                        onSubmit={handleSignUpSubmit}
                    >
                        <div className={styles.inputGroup}>
                            <label htmlFor="name">Name</label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                placeholder="Your Name"
                                value={signUpData.name}
                                onChange={handleSignUpChange}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                name="username"
                                placeholder="yourusername"
                                value={signUpData.username}
                                onChange={handleSignUpChange}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email-signup">Email</label>
                            <input
                                id="email-signup"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={signUpData.email}
                                onChange={handleSignUpChange}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="password-signup">Password</label>
                            <input
                                id="password-signup"
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={signUpData.password}
                                onChange={handleSignUpChange}
                                required
                            />
                        </div>

                        {authMessage && (
                            <p
                                className={
                                    messageIsError
                                        ? styles.errorMessage
                                        : styles.successMessage
                                }
                            >
                                {authMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={authState.isLoading}
                        >
                            {authState.isLoading
                                ? "Creating..."
                                : "Create Account"}
                        </button>
                    </form>
                )}

                {/* --- FORGOT PASSWORD VIEW --- */}
                {viewState === "forgot" && (
                    <form
                        className={styles.formContent}
                        onSubmit={handleForgotSubmit}
                    >
                        <div className={styles.inputGroup}>
                            <label htmlFor="forgot-email">Email</label>
                            <input
                                id="forgot-email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                            />
                        </div>

                        {authMessage && (
                            <p
                                className={
                                    messageIsError
                                        ? styles.errorMessage
                                        : styles.successMessage
                                }
                            >
                                {authMessage}
                            </p>
                        )}

                        <button type="submit" className={styles.submitButton}>
                            Send Reset Link
                        </button>

                        <div style={{ textAlign: "center", marginTop: "10px" }}>
                            <span
                                onClick={() => setViewState("login")}
                                style={{
                                    color: "#0a66c2",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                }}
                            >
                                Back to Login
                            </span>
                        </div>
                    </form>
                )}

                {/* Footer Links */}
                <div className={styles.formFooter}>
                    {viewState === "login" && (
                        <p>
                            Don't have an account?{" "}
                            <span onClick={() => setViewState("register")}>
                                Sign Up
                            </span>
                        </p>
                    )}
                    {viewState === "register" && (
                        <p>
                            Already have an account?{" "}
                            <span onClick={() => setViewState("login")}>
                                Sign In
                            </span>
                        </p>
                    )}
                    {viewState === "forgot" && (
                        <p>
                            Remembered your password?{" "}
                            <span onClick={() => setViewState("login")}>
                                Sign In
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LoginComponent;
