import clientServer, { BASE_URL } from "@/config";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAllPosts } from "@/config/redux/action/postAction";

export default function ViewProfilePage({ userProfile }) {
    const router = useRouter();
    const postReducer = useSelector((state) => state.postReducer);
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);

    const [userPosts, setUserPosts] = useState([]);
    const [isCurrentUserInConnection, setIsCurrentUserInConnection] =
        useState();

    const getUsersPost = async () => {
        await dispatch(getAllPosts());
        await dispatch(
            getConnectionsRequest({ token: localStorage.getItem("token") })
        );
    };

    useEffect(() => {
        let post = postReducer.posts.filter((post) => {
            return post.userId.username === router.query.username;
        });
        setUserPosts(post);
    }, [postReducer.posts]);

    useEffect(() => {
        console.log(authState.connections, userProfile.userId);
        if (
            authState.connections.some(
                (user) => user.connectionId._id === userProfile.userId._id
            )
        ) {
            setIsCurrentUserInConnection(true);
        }
    }, [authState.connections]);

    useEffect(() => {
        getUsersPost();
    }, []);

    const searchParams = useSearchParams();
    useEffect(() => {
        console.log("From View: View Profile");
    });
    return (
        <UserLayout>
            <DashboardLayout>
                <div className={styles.container}>
                    <div className={styles.backDropContainer}>
                        <img
                            className={styles.backDrop}
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
                                {isCurrentUserInConnection ? (
                                    <button className={styles.connectedButton}>
                                        Connected
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            dispatch(
                                                sendConnectionRequest({
                                                    token: localStorage.getItem(
                                                        "token"
                                                    ),
                                                    user_id:
                                                        userProfile.userId._id,
                                                })
                                            );
                                        }}
                                        className={styles.connectBtn}
                                    >
                                        Connect
                                    </button>
                                )}
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
                    {/* {userProfile.userId.name} */}
                </div>
            </DashboardLayout>
        </UserLayout>
    );
}
export async function getServerSideProps(context) {
    console.log("From View");
    console.log(context.query.username);
    const request = await clientServer.get(
        "/user/get_profile_based_on_username",
        {
            params: {
                username: context.query.username,
            },
        }
    );
    const response = await request.data;
    console.log(response);
    return { props: { userProfile: request.data.profile } };
}
