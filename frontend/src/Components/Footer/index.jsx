// frontend/src/Components/Footer/index.jsx
import React, { useState } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";

const LogoIcon = () => (
    <div className={styles.holoLogo}>
        <span>Link</span>Ups
    </div>
);

export default function Footer() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const handleNavigation = (path) => {
        router.push(path);
    };

    const handleSubscribe = () => {
        if (!email || !email.includes("@")) {
            alert("Please enter a valid frequency (email).");
            return;
        }
        // Simulate API call
        setSubscribed(true);
        setEmail("");
        setTimeout(() => setSubscribed(false), 3000); // Reset after 3s
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.gridOverlay}></div>
            <div className={styles.footerContainer}>
                {/* Col 1: Brand */}
                <div className={styles.brandCol}>
                    <LogoIcon />
                    <p className={styles.tagline}>
                        The neural network for tomorrow's professionals.
                        <br />
                        Built for scalability, security, and speed.
                    </p>
                    <div className={styles.socialRow}>
                        <a
                            href="https://twitter.com"
                            target="_blank"
                            rel="noreferrer"
                            className={styles.socialIcon}
                        >
                            𝕏
                        </a>
                        <a
                            href="https://linkedin.com"
                            target="_blank"
                            rel="noreferrer"
                            className={styles.socialIcon}
                        >
                            In
                        </a>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noreferrer"
                            className={styles.socialIcon}
                        >
                            Gh
                        </a>
                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noreferrer"
                            className={styles.socialIcon}
                        >
                            Ig
                        </a>
                    </div>
                </div>

                {/* Col 2: Navigation */}
                <div className={styles.linkCol}>
                    <h4>Platform</h4>
                    <a onClick={() => handleNavigation("/dashboard")}>
                        Live Feed
                    </a>
                    <a onClick={() => handleNavigation("/discover")}>
                        Global Search
                    </a>
                    <a onClick={() => handleNavigation("/meet")}>
                        Video Uplink
                    </a>
                    <a onClick={() => handleNavigation("/profile")}>
                        My Identity
                    </a>
                </div>

                {/* Col 3: Legal / Protocol (Now Linked) */}
                <div className={styles.linkCol}>
                    <h4>Protocol</h4>
                    <a
                        onClick={() =>
                            handleNavigation("/protocol/documentation")
                        }
                    >
                        Documentation
                    </a>
                    <a onClick={() => handleNavigation("/protocol/api-status")}>
                        API Status
                    </a>
                    <a onClick={() => handleNavigation("/protocol/security")}>
                        Security
                    </a>
                    <a
                        onClick={() =>
                            handleNavigation("/protocol/terms-of-service")
                        }
                    >
                        Terms of Service
                    </a>
                </div>

                {/* Col 4: Newsletter (Logic Added) */}
                <div className={styles.newsletterCol}>
                    <h4>Stay Connected</h4>
                    <p>Join the mailing list for system updates.</p>

                    {subscribed ? (
                        <div
                            style={{
                                color: "var(--neon-teal)",
                                fontWeight: "bold",
                                background: "rgba(16, 185, 129, 0.1)",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid var(--neon-teal)",
                            }}
                        >
                            ✓ Uplink Established!
                        </div>
                    ) : (
                        <div className={styles.inputGroup}>
                            <input
                                type="email"
                                placeholder="user@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button onClick={handleSubscribe}>→</button>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.bottomBar}>
                <p>
                    &copy; {new Date().getFullYear()} LinkUps Inc. System
                    Online.
                </p>
            </div>
        </footer>
    );
}
