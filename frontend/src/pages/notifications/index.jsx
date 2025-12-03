import React, { useEffect } from "react";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import { useDispatch, useSelector } from "react-redux";
import {
    getNotifications,
    markRead,
} from "@/config/redux/reducer/notificationReducer";
import { useRouter } from "next/router";
import styles from "./index.module.css";

// Create a simple CSS module for this page similar to others

export default function NotificationsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { notifications } = useSelector((state) => state.notification);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            dispatch(getNotifications({ token }));
        }
    }, [dispatch]);

    const handleNotificationClick = (notif) => {
        const token = localStorage.getItem("token");
        if (!notif.isRead) {
            dispatch(markRead({ token, notificationId: notif._id }));
        }

        // Navigate based on type
        if (notif.type === "like" || notif.type === "comment") {
            router.push(`/post/${notif.post?._id}`);
        } else if (
            notif.type === "connection_request" ||
            notif.type === "connection_accepted"
        ) {
            router.push(`/view_profile/${notif.sender.username}`);
        } else if (notif.type === "missed_call") {
            router.push(`/messaging?chatWith=${notif.sender.username}`);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Notifications</h2>
            <div className={styles.list}>
                {notifications.length === 0 ? (
                    <p className={styles.empty}>No notifications yet.</p>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif._id}
                            className={`${styles.item} ${
                                !notif.isRead ? styles.unread : ""
                            }`}
                            onClick={() => handleNotificationClick(notif)}
                        >
                            <img
                                src={notif.sender.profilePicture}
                                alt=""
                                className={styles.avatar}
                            />
                            <div className={styles.content}>
                                <p>
                                    <strong>{notif.sender.name}</strong>{" "}
                                    {notif.message}
                                </p>
                                <span className={styles.time}>
                                    {new Date(notif.createdAt).toLocaleString()}
                                </span>
                            </div>
                            {!notif.isRead && (
                                <div className={styles.dot}></div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

NotificationsPage.getLayout = (page) => (
    <UserLayout>
        <DashboardLayout>{page}</DashboardLayout>
    </UserLayout>
);
