import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import styles from "./style.module.css";
import { loginUser, registerUser } from "@/config/redux/action/authAction";
import { emptyMessage } from "@/config/redux/reducer/authReducer";

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

const LogoIcon = () => (
    <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM12 10.5c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zm0 6c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
            fill="url(#logoGradient)"
        />
        <defs>
            <linearGradient
                id="logoGradient"
                x1="2"
                y1="2"
                x2="22"
                y2="22"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#0a66c2" />
                <stop offset="1" stopColor="#004182" />
            </linearGradient>
        </defs>
    </svg>
);
// --- End Icons ---

function LoginComponent() {
    const authState = useSelector((state) => state.auth);
    const router = useRouter();
    const dispatch = useDispatch();

    // Single state to toggle between Login and Sign Up
    const [isLoginView, setIsLoginView] = useState(true);

    const [signInData, setSignInData] = useState({ email: "", password: "" });
    const [signUpData, setSignUpData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
    });

    // Redirect if already logged in
    useEffect(() => {
        if (authState.loggedIn || localStorage.getItem("token")) {
            router.push("/dashboard");
        }
    }, [authState.loggedIn, router]);

    // Clear messages when switching forms
    useEffect(() => {
        dispatch(emptyMessage());
    }, [isLoginView, dispatch]);

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

    // Toggle the view
    const toggleView = () => {
        setIsLoginView(!isLoginView);
    };

    // Get the correct message to display
    const authMessage = authState.message?.message || authState.message;
    const messageIsError =
        authState.isError ||
        (authMessage &&
            typeof authMessage === "string" &&
            !authMessage.includes("Success"));

    return (
        <div className={styles.pageContainer}>
            <div className={styles.formCard}>
                <div className={styles.formHeader}>
                    <LogoIcon />
                    <h1>{isLoginView ? "Welcome Back" : "Create Account"}</h1>
                    <p>
                        {isLoginView
                            ? "Sign in to your Pro Connect account"
                            : "Join the next-gen professional network"}
                    </p>
                </div>

                {isLoginView ? (
                    /* --- Sign In Form --- */
                    <form
                        className={styles.formContent}
                        onSubmit={handleSignInSubmit}
                    >
                        <button type="button" className={styles.socialButton}>
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

                        {authMessage && isLoginView && (
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

                        <a href="#" className={styles.forgotPassword}>
                            Forgot your password?
                        </a>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={authState.isLoading}
                        >
                            {authState.isLoading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>
                ) : (
                    /* --- Sign Up Form --- */
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

                        {authMessage && !isLoginView && (
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

                <div className={styles.formFooter}>
                    {isLoginView ? (
                        <p>
                            Don't have an account?{" "}
                            <span onClick={toggleView}>Sign Up</span>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{" "}
                            <span onClick={toggleView}>Sign In</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LoginComponent;
