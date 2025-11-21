import React, { useEffect, useMemo } from "react";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setTokenIsThere } from "@/config/redux/reducer/authReducer";
import { getAboutUser, getAllUsers } from "@/config/redux/action/authAction";
import { useSocket } from "@/context/SocketContext";

// Default banner if user hasn't set one
const DEFAULT_BG =
    "https://img.freepik.com/free-photo/3d-rendering-hexagonal-texture-background_23-2150796421.jpg?semt=ais_hybrid&w=740&q=80";

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const { onlineStatuses } = useSocket() || {};

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            dispatch(setTokenIsThere());

            if (!authState.profileFetched) {
                dispatch(getAboutUser({ token }));
            }

            if (!authState.all_profiles_fetched) {
                dispatch(getAllUsers());
            }
        }
    }, [
        router,
        dispatch,
        authState.profileFetched,
        authState.all_profiles_fetched,
    ]);

    const user = authState.user?.userId;
    const userFallback = user?.name ? user.name.charAt(0).toUpperCase() : "?";

    // Use dynamic background or default
    const backgroundPic = user?.backgroundPicture || DEFAULT_BG;

    const isUserOnline = (uid, defaultStatus) => {
        return onlineStatuses && onlineStatuses[uid]
            ? onlineStatuses[uid].isOnline
            : defaultStatus;
    };

    const randomProfiles = useMemo(() => {
        if (!authState.all_profiles_fetched || !authState.all_users) return [];

        const filtered = authState.all_users.filter((profile) => {
            if (!profile.userId) return false;
            if (!authState.user || !authState.user.userId) return true;
            return profile.userId._id !== authState.user.userId._id;
        });

        const shuffled = [...filtered].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 5);
    }, [authState.all_users, authState.user, authState.all_profiles_fetched]);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.homeContainer}>
                <div className={styles.leftSidebar}>
                    {authState.profileFetched && user ? (
                        <div className={styles.profileCard}>
                            {/* --- DYNAMIC HEADER BACKGROUND --- */}
                            <div
                                className={styles.profileCardHeader}
                                style={{
                                    backgroundImage: `url("${backgroundPic}")`,
                                }}
                            ></div>

                            <div
                                className={styles.avatarWrapper}
                                onClick={() => router.push("/profile")}
                            >
                                {user.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt="Profile"
                                        className={styles.profileCardPic}
                                    />
                                ) : (
                                    <div
                                        className={`${styles.profileCardPic} ${styles.profileFallback}`}
                                    >
                                        {userFallback}
                                    </div>
                                )}
                                {isUserOnline(user._id, true) && (
                                    <span
                                        className={styles.onlineDotLarge}
                                    ></span>
                                )}
                            </div>
                            <h3 onClick={() => router.push("/profile")}>
                                {user.name}
                            </h3>
                            <p>@{user.username}</p>
                            {authState.user.bio && (
                                <p className={styles.profileBio}>
                                    {authState.user.bio.substring(0, 70)}...
                                </p>
                            )}
                            <button
                                onClick={() => router.push("/profile")}
                                className={styles.viewProfileBtn}
                            >
                                View Full Profile
                            </button>
                        </div>
                    ) : (
                        <div className={styles.profileCard}>
                            <div className={styles.profileCardHeader}></div>
                            <div
                                className={`${styles.profileCardPic} ${styles.skeleton}`}
                            ></div>
                            <div
                                className={`${styles.skeleton} ${styles.skeletonText}`}
                                style={{ width: "60%" }}
                            ></div>
                            <div
                                className={`${styles.skeleton} ${styles.skeletonText}`}
                                style={{ width: "40%" }}
                            ></div>
                        </div>
                    )}
                </div>

                <div className={styles.feedContainer}>{children}</div>

                <div className={styles.rightSidebar}>
                    <div className={styles.widgetCard}>
                        <h4>Top Profiles to Follow</h4>
                        {authState.all_profiles_fetched ? (
                            randomProfiles.map((profile) => (
                                <div
                                    key={profile._id}
                                    className={styles.profileItem}
                                    onClick={() =>
                                        router.push(
                                            `/view_profile/${profile.userId.username}`
                                        )
                                    }
                                >
                                    <div className={styles.itemAvatarContainer}>
                                        <img
                                            src={profile.userId.profilePicture}
                                            alt={profile.userId.name}
                                        />
                                        {isUserOnline(
                                            profile.userId._id,
                                            profile.userId.isOnline
                                        ) && (
                                            <span
                                                className={
                                                    styles.onlineDotSmall
                                                }
                                            ></span>
                                        )}
                                    </div>
                                    <div>
                                        <strong>{profile.userId.name}</strong>
                                        <p>@{profile.userId.username}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>Loading...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
