import { getAllUsers } from "@/config/redux/action/authAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.css";
import { BASE_URL } from "@/config";
import { useRouter } from "next/router";

export default function Discoverpage() {
    const authState = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    useEffect(() => {
        if (!authState.all_profiles_fetched) {
            dispatch(getAllUsers());
        }
    }, []);
    const router = useRouter();
    return (
        <UserLayout>
            <DashboardLayout>
                <div>
                    <h1>Discovers</h1>
                    <div className={styles.allUserProfile}>
                        {authState.all_profiles_fetched &&
                            authState.all_users.map((user) => {
                                return (
                                    <div
                                        onClick={() => {
                                            router.push(
                                                `/view_profile/${user.userId.username}`
                                            );
                                        }}
                                        key={user._id}
                                        className={styles.userCard}
                                    >
                                        <img
                                            className={styles.userCard__image}
                                            src={`${BASE_URL}/${user.userId.profilePicture}`}
                                            alt=""
                                        />
                                        <div>
                                            <h1>{user.userId.name}</h1>
                                            <p>@{user.userId.username}</p>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </DashboardLayout>
        </UserLayout>
    );
}
