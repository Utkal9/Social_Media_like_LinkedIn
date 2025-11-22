// frontend/src/Components/Navbar/index.jsx
import React, { useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { reset } from "@/config/redux/reducer/authReducer";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/context/SocketContext";

// --- SVG Icons ---
const HomeIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isActive ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className={styles.navIcon}
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
        fill={isActive ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className={styles.navIcon}
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
        fill={isActive ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className={styles.navIcon}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
    </svg>
);
const MeetIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isActive ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className={styles.navIcon}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z"
        />
    </svg>
);
const MessagingIcon = ({ isActive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isActive ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className={styles.navIcon}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
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
        router.push("/login");
    };

    const handleNavigation = (path) => {
        router.push(path);
        setDropdownOpen(false);
    };

    const userName = authState.user?.userId?.name;
    const userFallback = userName ? userName.charAt(0).toUpperCase() : "?";
    const myId = authState.user?.userId?._id;
    const isMyOnline = myId
        ? (onlineStatuses && onlineStatuses[myId]?.isOnline) ??
          authState.user?.userId?.isOnline ??
          true
        : false;

    // Navigation Items Config
    const navItems = [
        { path: "/dashboard", icon: HomeIcon, label: "Feed" },
        { path: "/my_connections", icon: NetworkIcon, label: "Network" },
        { path: "/discover", icon: DiscoverIcon, label: "Discover" },
        { path: "/meet", icon: MeetIcon, label: "Meet" },
        { path: "/messaging", icon: MessagingIcon, label: "Chat" },
    ];

    const renderNavLinks = () => (
        <>
            {navItems.map((item) => (
                <div
                    key={item.path}
                    className={`${styles.navLink} ${
                        router.pathname === item.path ? styles.active : ""
                    }`}
                    onClick={() => handleNavigation(item.path)}
                >
                    <div className={styles.iconGlow}>
                        <item.icon isActive={router.pathname === item.path} />
                    </div>
                    <span className={styles.navLabel}>{item.label}</span>
                    {router.pathname === item.path && (
                        <div className={styles.activeBar} />
                    )}
                </div>
            ))}
        </>
    );

    if (!hasMounted) return <nav className={styles.container} />;

    return (
        <>
            {/* --- TOP NAV (Desktop + Mobile Top Bar) --- */}
            <nav className={styles.container}>
                <div className={styles.navbar}>
                    <div
                        className={styles.navLeft}
                        onClick={() => handleNavigation("/")}
                    >
                        <LogoIcon />
                    </div>

                    {/* Desktop Center Links (Hidden on Mobile) */}
                    <div className={styles.navCenter}>{renderNavLinks()}</div>

                    {/* Right Side (Profile / Login) - Visible on Mobile too */}
                    <div className={styles.navRight}>
                        {authState.profileFetched && authState.user ? (
                            <div
                                className={styles.profileMenu}
                                ref={dropdownRef}
                            >
                                <button
                                    onClick={() =>
                                        setDropdownOpen(!dropdownOpen)
                                    }
                                    className={styles.profileButton}
                                >
                                    <div className={styles.avatarContainer}>
                                        {authState.user.userId
                                            .profilePicture ? (
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
                                </button>

                                <AnimatePresence>
                                    {dropdownOpen && (
                                        <motion.div
                                            className={styles.dropdownContent}
                                            initial={{
                                                opacity: 0,
                                                y: 10,
                                                scale: 0.95,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: 10,
                                                scale: 0.95,
                                            }}
                                        >
                                            <div
                                                className={
                                                    styles.dropdownHeader
                                                }
                                            >
                                                <p className={styles.userName}>
                                                    {authState.user.userId.name}
                                                </p>
                                                <p
                                                    className={
                                                        styles.userHandle
                                                    }
                                                >
                                                    @
                                                    {
                                                        authState.user.userId
                                                            .username
                                                    }
                                                </p>
                                            </div>
                                            <div
                                                className={styles.dropdownBody}
                                            >
                                                <button
                                                    onClick={() =>
                                                        handleNavigation(
                                                            "/profile"
                                                        )
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
                            <button
                                onClick={() => handleNavigation("/login")}
                                className={styles.buttonJoin}
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- BOTTOM NAV (Mobile Only) --- */}
            <div className={styles.bottomNav}>
                {navItems.map((item) => (
                    <div
                        key={item.path}
                        className={`${styles.bottomNavItem} ${
                            router.pathname === item.path
                                ? styles.bottomNavActive
                                : ""
                        }`}
                        onClick={() => handleNavigation(item.path)}
                    >
                        <item.icon isActive={router.pathname === item.path} />
                        <span className={styles.bottomNavLabel}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
}
