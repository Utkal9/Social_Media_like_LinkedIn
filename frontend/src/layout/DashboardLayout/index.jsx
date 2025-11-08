import React, { useEffect } from "react";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setTokenIsThere } from "@/config/redux/reducer/authReducer";

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    useEffect(() => {
        if (localStorage.getItem("token") == null) {
            router.push("/login");
        }
        dispatch(setTokenIsThere());
    }, []);
    return (
        <div>
            <div className="container">
                <div className={styles.homeContainer}>
                    <div className={styles.homeContainer__leftBar}>
                        <div
                            onClick={() => {
                                router.push("/dashboard");
                            }}
                            className={styles.sideBarOption}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="size-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                                />
                            </svg>
                            <p>Scroll</p>
                        </div>
                        <div
                            onClick={() => {
                                router.push("/discover");
                            }}
                            className={styles.sideBarOption}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="size-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                />
                            </svg>
                            <p>Discover</p>
                        </div>
                        <div
                            onClick={() => {
                                router.push("/my_connections");
                            }}
                            className={styles.sideBarOption}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="size-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                                />
                            </svg>
                            <p>My Connections</p>
                        </div>
                    </div>
                    <div className={styles.homeContainer__feedContainer}>
                        {children}
                    </div>
                    <div className={styles.homeContainer__extraContainer}>
                        <h3>Top Profiles</h3>
                        {authState.all_profiles_fetched &&
                            authState.all_users.map((profile) => {
                                return (
                                    <div
                                        key={profile._id}
                                        className={
                                            styles.extraContainer__profile
                                        }
                                    >
                                        {/* <img src={profile.profile_pic} alt="" /> */}
                                        <p>{profile.userId.name}</p>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div>
    );
}
