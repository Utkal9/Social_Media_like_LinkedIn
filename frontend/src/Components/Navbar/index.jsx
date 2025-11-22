// frontend/src/Components/Navbar/index.jsx
import React, { useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { reset } from "@/config/redux/reducer/authReducer";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/context/SocketContext";

// --- Fixed Holo Icons ---

const HomeIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isActive ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={styles.navIcon}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
    </svg>
);

const NetworkIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isActive ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={styles.navIcon}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
    </svg>
);

const DiscoverIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isActive ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={styles.navIcon}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
        />
    </svg>
);

const MeetIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isActive ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={styles.navIcon}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
        />
    </svg>
);

// --- FIXED: Messaging Icon (Valid Path) ---
const MessagingIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isActive ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={styles.navIcon}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
    </svg>
);

// --- UPDATED: Cleaner Mobile Menu Icon ---
const MenuIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
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

const LogoIcon = () => (
    <div className={styles.holoLogo}>
        <span>Link</span>Ups
    </div>
);

export default function NavbarComponent() {
    const router = useRouter();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const { socket, onlineStatuses } = useSocket() || {};

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        if (socket) socket.disconnect();
        localStorage.removeItem("token");
        dispatch(reset());
        setDropdownOpen(false);
        setIsMobileMenuOpen(false);
        router.push("/login");
    };

    const handleNavigation = (path) => {
        router.push(path);
        setDropdownOpen(false);
        setIsMobileMenuOpen(false);
    };

    const userName = authState.user?.userId?.name;
    const userFallback = userName ? userName.charAt(0).toUpperCase() : "?";
    const myId = authState.user?.userId?._id;
    const isMyOnline = myId
        ? (onlineStatuses && onlineStatuses[myId]?.isOnline) ??
          authState.user?.userId?.isOnline ??
          true
        : false;

    const renderNavLinks = () => (
        <>
            {[
                { path: "/dashboard", icon: HomeIcon, label: "Feed" },
                {
                    path: "/my_connections",
                    icon: NetworkIcon,
                    label: "Network",
                },
                { path: "/discover", icon: DiscoverIcon, label: "Discover" },
                { path: "/meet", icon: MeetIcon, label: "Meet" },
                { path: "/messaging", icon: MessagingIcon, label: "Chat" },
            ].map((item) => (
                <motion.div
                    key={item.path}
                    className={`${styles.navLink} ${
                        router.pathname === item.path ? styles.active : ""
                    }`}
                    onClick={() => handleNavigation(item.path)}
                    whileHover={{ scale: 1.05, color: "var(--neon-violet)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className={styles.iconGlow}>
                        <item.icon isActive={router.pathname === item.path} />
                    </div>
                    <span>{item.label}</span>
                    {router.pathname === item.path && (
                        <motion.div
                            className={styles.activeBar}
                            layoutId="navUnderline"
                        />
                    )}
                </motion.div>
            ))}
        </>
    );

    if (!hasMounted) return <nav className={styles.container} />;

    return (
        <motion.nav
            className={styles.container}
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.navbar}>
                <div
                    className={styles.navLeft}
                    onClick={() => handleNavigation("/")}
                >
                    <LogoIcon />
                </div>

                {/* Desktop Nav */}
                <div className={styles.navCenter}>{renderNavLinks()}</div>

                <div className={styles.navRight}>
                    {authState.profileFetched && authState.user ? (
                        <div className={styles.profileMenu} ref={dropdownRef}>
                            <motion.button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className={styles.profileButton}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className={styles.avatarContainer}>
                                    {authState.user.userId.profilePicture ? (
                                        <img
                                            src={
                                                authState.user.userId
                                                    .profilePicture
                                            }
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
                                    {isMyOnline && (
                                        <span
                                            className={styles.onlineDot}
                                        ></span>
                                    )}
                                </div>
                            </motion.button>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        className={styles.dropdownContent}
                                        initial={{
                                            opacity: 0,
                                            y: 10,
                                            scale: 0.95,
                                        }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{
                                            opacity: 0,
                                            y: 10,
                                            scale: 0.95,
                                        }}
                                    >
                                        <div className={styles.dropdownHeader}>
                                            <p className={styles.userName}>
                                                {authState.user.userId.name}
                                            </p>
                                            <p className={styles.userHandle}>
                                                @
                                                {authState.user.userId.username}
                                            </p>
                                        </div>
                                        <div className={styles.dropdownBody}>
                                            <button
                                                onClick={() =>
                                                    handleNavigation("/profile")
                                                }
                                            >
                                                View Profile
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className={styles.logoutBtn}
                                            >
                                                Disconnect
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.button
                            onClick={() => handleNavigation("/login")}
                            className={styles.buttonJoin}
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 0 15px var(--neon-teal)",
                            }}
                        >
                            Initialize ID
                        </motion.button>
                    )}
                </div>

                {/* Mobile Hamburger - Now Styled */}
                <div className={styles.hamburgerMenuButton}>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <MenuIcon />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className={styles.mobileMenu}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{
                            type: "spring",
                            bounce: 0,
                            duration: 0.4,
                        }}
                    >
                        <div className={styles.mobileHeader}>
                            <LogoIcon />
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={styles.closeMenuBtn}
                            >
                                &times;
                            </button>
                        </div>
                        <div className={styles.mobileLinks}>
                            {renderNavLinks()}
                            <div className={styles.mobileDivider}></div>
                            {authState.user ? (
                                <>
                                    <a
                                        onClick={() =>
                                            handleNavigation("/profile")
                                        }
                                    >
                                        Profile Settings
                                    </a>
                                    <a
                                        onClick={handleLogout}
                                        style={{ color: "var(--neon-pink)" }}
                                    >
                                        Terminating Session
                                    </a>
                                </>
                            ) : (
                                <a onClick={() => handleNavigation("/login")}>
                                    Login
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
