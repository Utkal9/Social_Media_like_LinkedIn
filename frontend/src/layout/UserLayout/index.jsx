import NavbarComponent from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import React from "react";
import styles from "./styles.module.css";

function UserLayout({ children }) {
    return (
        <div className={styles.layoutWrapper}>
            <NavbarComponent />
            <main className={styles.mainContent}>{children}</main>
            <Footer />
        </div>
    );
}
export default UserLayout;
