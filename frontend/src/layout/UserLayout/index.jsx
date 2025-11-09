import NavbarComponent from "@/Components/Navbar";
import Footer from "@/Components/Footer"; // 1. Import the new Footer
import React from "react";
import styles from "./styles.module.css"; // 2. Import the new CSS

function UserLayout({ children }) {
    return (
        <div className={styles.layoutWrapper}>
            <NavbarComponent />
            <main className={styles.mainContent}>{children}</main>
            <Footer /> {/* 3. Add the Footer component */}
        </div>
    );
}
export default UserLayout;
