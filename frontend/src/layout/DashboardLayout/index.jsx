import React, { useEffect } from "react";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setTokenIsThere } from "@/config/redux/reducer/authReducer";
import { BASE_URL } from "@/config";

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            dispatch(setTokenIsThere());
        }
    }, [router, dispatch]);

    // Fallback for profile picture
    const user = authState.user?.userId;
    const userFallback = user?.name ? user.name.charAt(0).toUpperCase() : "?";

    return (
        <div className={styles.pageContainer}>
            <div className={styles.homeContainer}>
                {/* --- 1. Left Sidebar (Profile Summary) --- */}
                <div className={styles.leftSidebar}>
                    {authState.profileFetched && user ? (
                        <div className={styles.profileCard}>
                            <div className={styles.profileCardHeader}></div>
                            {user.profilePicture ? (
                                <img
                                    src={`${BASE_URL}/${user.profilePicture}`}
                                    alt="Profile"
                                    className={styles.profileCardPic}
                                    onClick={() => router.push("/profile")}
                                />
                            ) : (
                                <div
                                    className={`${styles.profileCardPic} ${styles.profileFallback}`}
                                    onClick={() => router.push("/profile")}
                                >
                                    {userFallback}
                                </div>
                            )}
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
                        // Skeleton Loader
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

                {/* --- 2. Main Feed (Page Content) --- */}
                <div className={styles.feedContainer}>{children}</div>

                {/* --- 3. Right Sidebar (Widgets) --- */}
                <div className={styles.rightSidebar}>
                    <div className={styles.widgetCard}>
                        <h4>Top Profiles to Follow</h4>
                        {authState.all_profiles_fetched ? (
                            authState.all_users.slice(0, 5).map(
                                (
                                    profile // Show top 5
                                ) => (
                                    <div
                                        key={profile._id}
                                        className={styles.profileItem}
                                        onClick={() =>
                                            router.push(
                                                `/view_profile/${profile.userId.username}`
                                            )
                                        }
                                    >
                                        <img
                                            src={`${BASE_URL}/${profile.userId.profilePicture}`}
                                            alt={profile.userId.name}
                                        />
                                        <div>
                                            <strong>
                                                {profile.userId.name}
                                            </strong>
                                            <p>@{profile.userId.username}</p>
                                        </div>
                                    </div>
                                )
                            )
                        ) : (
                            <p>Loading...</p> // You could add a skeleton here too
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
