// frontend/src/Components/Footer/index.jsx
import React from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";

const LogoIcon = () => (
    <div className={styles.holoLogo}>
        <span>Link</span>Ups
    </div>
);

function Footer() {
    const router = useRouter();
    if (router.pathname !== "/") return null;

    return (
        <footer className={styles.footer}>
            <div className={styles.gridOverlay}></div>
            <div className={styles.footerContent}>
                <div className={styles.footerLeft}>
                    <LogoIcon />
                    <p className={styles.tagline}>
                        The neural network for next-gen professionals.
                        <br />
                        Connect. Collaborate. Create.
                    </p>
                    <p className={styles.copyright}>
                        &copy; 2025 LinkUps Inc. System Online.
                    </p>
                </div>

                <div className={styles.footerRight}>
                    <div className={styles.linkColumn}>
                        <h4>Navigation</h4>
                        <a onClick={() => router.push("/")}>Home Node</a>
                        <a onClick={() => router.push("/discover")}>Discover</a>
                        <a onClick={() => router.push("/login")}>Initialize</a>
                    </div>
                    <div className={styles.linkColumn}>
                        <h4>Legal Protocol</h4>
                        <a>Privacy Cipher</a>
                        <a>Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
