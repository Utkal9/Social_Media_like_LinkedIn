// frontend/src/Components/Footer/index.jsx
import React from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";

const LogoIcon = () => (
    <div className={styles.holoLogo}>
        <span>Link</span>Ups
    </div>
);

export default function Footer() {
    const router = useRouter();
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
                        <a href="#" className={styles.socialIcon}>
                            𝕏
                        </a>
                        <a href="#" className={styles.socialIcon}>
                            In
                        </a>
                        <a href="#" className={styles.socialIcon}>
                            Gh
                        </a>
                        <a href="#" className={styles.socialIcon}>
                            Ig
                        </a>
                    </div>
                </div>

                {/* Col 2: Navigation */}
                <div className={styles.linkCol}>
                    <h4>Platform</h4>
                    <a onClick={() => router.push("/dashboard")}>Live Feed</a>
                    <a onClick={() => router.push("/discover")}>
                        Global Search
                    </a>
                    <a onClick={() => router.push("/meet")}>Video Uplink</a>
                    <a onClick={() => router.push("/profile")}>My Identity</a>
                </div>

                {/* Col 3: Legal */}
                <div className={styles.linkCol}>
                    <h4>Protocol</h4>
                    <a href="#">Documentation</a>
                    <a href="#">API Status</a>
                    <a href="#">Security</a>
                    <a href="#">Terms of Service</a>
                </div>

                {/* Col 4: Newsletter (New) */}
                <div className={styles.newsletterCol}>
                    <h4>Stay Connected</h4>
                    <p>Join the mailing list for system updates.</p>
                    <div className={styles.inputGroup}>
                        <input type="email" placeholder="user@domain.com" />
                        <button>→</button>
                    </div>
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
