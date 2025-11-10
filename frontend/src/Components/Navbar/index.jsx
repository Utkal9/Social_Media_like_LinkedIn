import React, { useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { reset } from "@/config/redux/reducer/authReducer";
import { BASE_URL } from "@/config";
import { motion, AnimatePresence } from "framer-motion"; // Import AnimatePresence

// --- SVG Icons ---
const HomeIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={isActive ? 2.5 : 2}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 12 8.955-8.955a1.125 1.125 0 0 1 1.59 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
    </svg>
);
const NetworkIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={isActive ? 2.5 : 2}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.244-3.07a3 3 0 0 0-4.681-2.72-3 3 0 0 0-4.682 2.72m.244 3.07a9.094 9.094 0 0 1-3.741-.479 3 3 0 0 1 4.682-2.72m-.244-3.07a3 3 0 0 1 4.681 2.72-3 3 0 0 1 4.682-2.72m-.244 3.07m-12.48-3.07a3 3 0 0 0-4.682 2.72 3 3 0 0 0 4.682-2.72M3 13.5a3 3 0 0 1 6 0m6 0a3 3 0 0 1 6 0m-6 0a3 3 0 0 0-6 0m6 0a3 3 0 0 0 6 0"
        />
    </svg>
);
const DiscoverIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={isActive ? 2.5 : 2}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
    </svg>
);
const LogoIcon = () => (
    <svg
        width="32"
        height="32"
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
// --- NEW Hamburger Menu Icon ---
const MenuIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        style={{ width: 28, height: 28 }}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
    </svg>
);
// --- End Icons ---

function NavbarComponent() {
    const router = useRouter();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // <-- NEW STATE
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const dropdownRef = useRef(null);
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        dispatch(reset());
        setDropdownOpen(false);
        setIsMobileMenuOpen(false); // Close mobile menu on logout
        router.push("/login");
    };

    const handleNavigation = (path) => {
        router.push(path);
        setDropdownOpen(false);
        setIsMobileMenuOpen(false); // Close mobile menu on nav
    };

    const userName = authState.user?.userId?.name;
    const userFallback = userName ? userName.charAt(0).toUpperCase() : "?";

    const navVariants = {
        hidden: { y: -50, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: 0.2,
            },
        },
    };

    const itemHover = {
        hover: { scale: 1.1, y: -2 },
        tap: { scale: 0.95 },
    };

    const mobileMenuVariants = {
        hidden: { opacity: 0, height: 0 },
        visible: {
            opacity: 1,
            height: "auto",
            transition: { duration: 0.3, ease: "easeInOut" },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: { duration: 0.3, ease: "easeInOut" },
        },
    };

    // This is a helper function to avoid duplicating the main nav bar code
    const renderNavContent = () => (
        <div className={styles.navbar}>
            {/* --- Left Side (Logo) --- */}
            <div className={styles.navLeft}>
                <div
                    className={styles.logo}
                    onClick={() => handleNavigation("/")}
                >
                    <LogoIcon />
                </div>
            </div>

            {/* --- Center (Desktop Links) --- */}
            <div className={styles.navCenter}>
                <motion.div
                    className={`${styles.navLink} ${
                        router.pathname === "/dashboard" ? styles.active : ""
                    }`}
                    onClick={() => handleNavigation("/dashboard")}
                    variants={itemHover}
                    whileHover="hover"
                    whileTap="tap"
                >
                    <HomeIcon isActive={router.pathname === "/dashboard"} />
                    <span>Home</span>
                </motion.div>
                <motion.div
                    className={`${styles.navLink} ${
                        router.pathname === "/my_connections"
                            ? styles.active
                            : ""
                    }`}
                    onClick={() => handleNavigation("/my_connections")}
                    variants={itemHover}
                    whileHover="hover"
                    whileTap="tap"
                >
                    <NetworkIcon
                        isActive={router.pathname === "/my_connections"}
                    />
                    <span>My Network</span>
                </motion.div>
                <motion.div
                    className={`${styles.navLink} ${
                        router.pathname === "/discover" ? styles.active : ""
                    }`}
                    onClick={() => handleNavigation("/discover")}
                    variants={itemHover}
                    whileHover="hover"
                    whileTap="tap"
                >
                    <DiscoverIcon isActive={router.pathname === "/discover"} />
                    <span>Discover</span>
                </motion.div>
            </div>

            {/* --- Right Side (Desktop Profile/Login) --- */}
            <div className={styles.navRight}>
                {authState.profileFetched && authState.user ? (
                    <div className={styles.profileMenu} ref={dropdownRef}>
                        <motion.button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={styles.profileButton}
                            variants={itemHover}
                            whileHover="hover"
                            whileTap="tap"
                        >
                            {authState.user.userId.profilePicture ? (
                                <img
                                    src={`${BASE_URL}/${authState.user.userId.profilePicture}`}
                                    alt="Profile"
                                    className={styles.profilePic}
                                />
                            ) : (
                                <div
                                    className={`${styles.profilePic} ${styles.profileFallback}`}
                                >
                                    {userFallback}
                                </div>
                            )}
                            <span>Me</span>
                        </motion.button>
                        {dropdownOpen && (
                            <motion.div
                                className={styles.dropdownContent}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className={styles.dropdownHeader}>
                                    <img
                                        src={`${BASE_URL}/${authState.user.userId.profilePicture}`}
                                        alt="Profile"
                                        className={styles.profilePicLarge}
                                    />
                                    <div>
                                        <strong>
                                            {authState.user.userId.name}
                                        </strong>
                                        <p>@{authState.user.userId.username}</p>
                                    </div>
                                </div>
                                <button
                                    className={styles.dropdownItem}
                                    onClick={() => handleNavigation("/profile")}
                                >
                                    View Profile
                                </button>
                                <button
                                    className={styles.dropdownItem}
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <motion.div
                        onClick={() => handleNavigation("/login")}
                        className={styles.buttonJoin}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <p>Be a part</p>
                    </motion.div>
                )}
            </div>

            {/* --- NEW Hamburger Menu Button (Mobile Only) --- */}
            <div className={styles.hamburgerMenuButton}>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <MenuIcon />
                </button>
            </div>
        </div>
    );

    // --- RENDER A STATIC VERSION ON SERVER (prevents hydration error) ---
    if (!hasMounted) {
        return <nav className={styles.container}>{renderNavContent()}</nav>;
    }

    // --- RENDER THE *MOTION* VERSION ONCE MOUNTED (client-side) ---
    return (
        <motion.nav
            className={styles.container}
            variants={navVariants}
            initial="hidden"
            animate="visible"
        >
            {renderNavContent()}

            {/* --- NEW Mobile Menu Dropdown --- */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className={styles.mobileMenu}
                        variants={mobileMenuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <a
                            className={
                                router.pathname === "/dashboard"
                                    ? styles.mobileLinkActive
                                    : styles.mobileLink
                            }
                            onClick={() => handleNavigation("/dashboard")}
                        >
                            Home
                        </a>
                        <a
                            className={
                                router.pathname === "/my_connections"
                                    ? styles.mobileLinkActive
                                    : styles.mobileLink
                            }
                            onClick={() => handleNavigation("/my_connections")}
                        >
                            My Network
                        </a>
                        <a
                            className={
                                router.pathname === "/discover"
                                    ? styles.mobileLinkActive
                                    : styles.mobileLink
                            }
                            onClick={() => handleNavigation("/discover")}
                        >
                            Discover
                        </a>

                        <div className={styles.mobileDivider}></div>

                        {authState.profileFetched && authState.user ? (
                            <>
                                <a
                                    className={
                                        router.pathname === "/profile"
                                            ? styles.mobileLinkActive
                                            : styles.mobileLink
                                    }
                                    onClick={() => handleNavigation("/profile")}
                                >
                                    View Profile
                                </a>
                                <a
                                    className={styles.mobileLink}
                                    onClick={handleLogout}
                                >
                                    Logout
                                </a>
                            </>
                        ) : (
                            <a
                                className={styles.mobileLink}
                                onClick={() => handleNavigation("/login")}
                            >
                                Login / Sign Up
                            </a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
export default NavbarComponent;
