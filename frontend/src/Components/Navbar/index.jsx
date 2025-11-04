import React from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";

function NavbarComponent() {
    const router = useRouter();
    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <h1
                    className={{ cursor: "pointer" }}
                    onClick={() => {
                        router.push("/");
                    }}
                >
                    Pro Connect
                </h1>
                <div className={styles.navbarOptionContainer}>
                    <div
                        onClick={() => {
                            router.push("/login");
                        }}
                        className={styles.buttonJoin}
                    >
                        <p>Be a part</p>
                    </div>
                </div>
            </nav>
        </div>
    );
}
export default NavbarComponent;
