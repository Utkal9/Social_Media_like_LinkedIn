import React from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";

const LogoIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM12 10.5c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zm0 6c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
            fill="#0a66c2"
        />
    </svg>
);

function Footer() {
    const router = useRouter();

    // We only want to show the footer on the landing page
    if (router.pathname !== "/") {
        return null;
    }

    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <div className={styles.footerLeft}>
                    <div className={styles.logo}>
                        <LogoIcon />
                        <h3>Pro Connect</h3>
                    </div>
                    <p>&copy; 2025 Pro Connect. All rights reserved.</p>
                </div>
                <div className={styles.footerRight}>
                    <div className={styles.footerLinks}>
                        <h4>Navigation</h4>
                        <a onClick={() => router.push("/")}>Home</a>
                        <a onClick={() => router.push("/discover")}>Discover</a>
                        <a onClick={() => router.push("/login")}>Login</a>
                    </div>
                    <div className={styles.footerLinks}>
                        <h4>Legal</h4>
                        <a>Privacy Policy</a>
                        <a>Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
