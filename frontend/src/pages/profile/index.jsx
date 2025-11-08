import React, { useEffect, useState } from "react";
import styles from "./index.module.css";
import { useDispatch, useSelector } from "react-redux";
import { getAboutUser } from "@/config/redux/action/authAction";
import { BASE_URL } from "@/config";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import { getAllPosts } from "@/config/redux/action/postAction";

export default function Profilepage() {
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const postReducer = useSelector((state) => state.postReducer);
    const [userProfile, setUserProfile] = useState({});
    const [userPosts, setUserPosts] = useState([]);
    useEffect(() => {
        dispatch(getAboutUser({ token: localStorage.getItem("token") }));
        dispatch(getAllPosts());
    }, []);
    useEffect(() => {
        if (authState.user !== undefined) {
            setUserProfile(authState.user);
            let post = postReducer.posts.filter((post) => {
                return post.userId.username === authState.user.userId.username;
            });
            setUserPosts(post);
        }
    }, [authState.user, postReducer.posts]);
    return (
        <UserLayout>
            <DashboardLayout>
                {authState.user && userProfile.userId && (
                    <div className={styles.container}>
                        <div className={styles.backDropContainer}>
                            <label
                                htmlFor="profilePictureUpload"
                                className={styles.backDrop_overlay}
                            >
                                <p>Edit</p>
                            </label>
                            <input type="file" id="profilePictureUpload" />
                            <img
                                src={`${BASE_URL}/${userProfile.userId.profilePicture}`}
                                alt="backDrop"
                            />
                        </div>
                        <div className={styles.profileContainer__details}>
                            <div style={{ display: "flex", gap: "0.7rem" }}>
                                <div style={{ flex: "0.8" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            width: "fit-content",
                                            alignItems: "center",
                                            gap: "1.2rem",
                                        }}
                                    >
                                        <h2>{userProfile.userId.name}</h2>
                                        <p style={{ color: "grey" }}>
                                            @{userProfile.userId.username}
                                        </p>
                                    </div>
                                    <div>
                                        <p>{userProfile.bio}</p>
                                    </div>
                                </div>
                                <div style={{ flex: "0.2" }}>
                                    <h3>Recent Activity</h3>
                                    {userPosts.map((post) => {
                                        return (
                                            <div
                                                className={styles.postCard}
                                                key={post._id}
                                            >
                                                <div className={styles.card}>
                                                    <div
                                                        className={
                                                            styles.card__profileContainer
                                                        }
                                                    >
                                                        {post.media !== "" ? (
                                                            <img
                                                                src={`${BASE_URL}/${post.media}`}
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    width: "3.4rem",
                                                                    height: "3.4rem",
                                                                }}
                                                            ></div>
                                                        )}
                                                    </div>
                                                    <p>{post.body}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className={styles.workHistory}>
                            <h4>Work History</h4>
                            <div className={styles.workHistoryContainer}>
                                {userProfile.pastWork.map((work, index) => {
                                    return (
                                        <div
                                            key={index}
                                            className={styles.workHistoryCard}
                                        >
                                            <p
                                                style={{
                                                    fontWeight: "bold",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.8rem",
                                                }}
                                            >
                                                {work.company} - {work.position}
                                            </p>
                                            <p>{work.years}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </DashboardLayout>
        </UserLayout>
    );
}
