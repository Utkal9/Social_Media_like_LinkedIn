import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import clientServer from "@/config";
import { useDispatch, useSelector } from "react-redux";
import {
    toggleLike,
    getAllComments,
    postComment,
    deletePost,
} from "@/config/redux/action/postAction";
import { resetPostId } from "@/config/redux/reducer/postReducer";
import { useSocket } from "@/context/SocketContext";

// We can reuse the CSS module from dashboard to keep it consistent
import styles from "../dashboard/index.module.css";

// --- Icons ---
const LikeIcon = ({ isLiked }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isLiked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        style={{ width: "20px", height: "20px" }}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
        />
    </svg>
);
const CommentIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        style={{ width: "20px", height: "20px" }}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
        />
    </svg>
);
const ShareIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        style={{ width: "20px", height: "20px" }}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
        />
    </svg>
);
const DeleteIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        style={{ width: "18px", height: "18px" }}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
        />
    </svg>
);

export default function PostPage({ postData }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const postState = useSelector((state) => state.postReducer);
    const { onlineStatuses } = useSocket() || {};

    const [localPost, setLocalPost] = useState(postData);
    const [commentText, setCommentText] = useState("");

    // Sync local post state when props change (on navigation)
    useEffect(() => {
        setLocalPost(postData);
    }, [postData]);

    const isUserOnline = (uid, defaultStatus) => {
        return onlineStatuses && onlineStatuses[uid]
            ? onlineStatuses[uid].isOnline
            : defaultStatus;
    };

    const handleLike = async () => {
        const token = localStorage.getItem("token");
        const response = await dispatch(
            toggleLike({ post_id: localPost._id, token })
        );

        // Update local state optimistically or based on response
        if (response.payload && response.payload.likes) {
            setLocalPost((prev) => ({
                ...prev,
                likes: response.payload.likes,
            }));
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this post?")) {
            await dispatch(deletePost({ post_id: localPost._id }));
            router.push("/dashboard");
        }
    };

    const handleOpenComments = () => {
        dispatch(getAllComments({ post_id: localPost._id }));
    };

    const handleShare = () => {
        const text = encodeURIComponent(localPost.body);
        const url = encodeURIComponent(window.location.href);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        window.open(twitterUrl, "_blank");
    };

    const handlePostComment = async () => {
        if (!commentText.trim()) return;
        await dispatch(
            postComment({ post_id: localPost._id, body: commentText })
        );
        await dispatch(getAllComments({ post_id: localPost._id }));
        setCommentText("");
    };

    if (!localPost)
        return <div className={styles.loading}>Loading post...</div>;

    return (
        <div className={styles.feedContainer}>
            <button
                onClick={() => router.back()}
                style={{
                    marginBottom: "1rem",
                    cursor: "pointer",
                    border: "none",
                    background: "none",
                    color: "#666",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                }}
            >
                ← Back
            </button>

            <div className={styles.postCard}>
                <div className={styles.postCardHeader}>
                    <div
                        className={styles.avatarContainer}
                        onClick={() =>
                            router.push(
                                `/view_profile/${localPost.userId.username}`
                            )
                        }
                        style={{ cursor: "pointer" }}
                    >
                        <img
                            className={styles.userProfilePic}
                            src={localPost.userId.profilePicture}
                            alt={`${localPost.userId.name}'s profile`}
                        />
                        {isUserOnline(
                            localPost.userId._id,
                            localPost.userId.isOnline
                        ) && <span className={styles.onlineDot}></span>}
                    </div>
                    <div className={styles.postCardHeaderInfo}>
                        <p
                            className={styles.postCardUser}
                            onClick={() =>
                                router.push(
                                    `/view_profile/${localPost.userId.username}`
                                )
                            }
                        >
                            {localPost.userId.name}
                        </p>
                        <p className={styles.postCardUsername}>
                            @{localPost.userId.username}
                        </p>
                    </div>
                    {authState.user &&
                        localPost.userId._id === authState.user.userId._id && (
                            <button
                                onClick={handleDelete}
                                className={styles.deleteButton}
                            >
                                <DeleteIcon />
                            </button>
                        )}
                </div>

                <div className={styles.postCardBody}>
                    <p>{localPost.body}</p>
                    {localPost.media && (
                        <div className={styles.postCardImageContainer}>
                            <img src={localPost.media} alt="Post media" />
                        </div>
                    )}
                </div>

                <div className={styles.postCardStats}>
                    <span>
                        {localPost.likes ? localPost.likes.length : 0} Likes
                    </span>
                </div>

                <div className={styles.postCardActions}>
                    {(() => {
                        const isLiked =
                            authState.user &&
                            Array.isArray(localPost.likes) &&
                            localPost.likes.includes(authState.user.userId._id);
                        return (
                            <button
                                onClick={handleLike}
                                className={`${styles.actionButton} ${
                                    isLiked ? styles.activeAction : ""
                                }`}
                            >
                                <LikeIcon isLiked={isLiked} />
                                <span>Like</span>
                            </button>
                        );
                    })()}
                    <button
                        onClick={handleOpenComments}
                        className={styles.actionButton}
                    >
                        <CommentIcon />
                        <span>Comment</span>
                    </button>
                    <button
                        onClick={handleShare}
                        className={styles.actionButton}
                    >
                        <ShareIcon />
                        <span>Share</span>
                    </button>
                </div>
            </div>

            {/* Comments Section (Inline or Modal depending on preference, reusing Modal for consistency) */}
            {postState.postId === localPost._id && (
                <div
                    className={styles.commentModalBackdrop}
                    onClick={() => dispatch(resetPostId())}
                >
                    <div
                        className={styles.commentModalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.commentModalHeader}>
                            <h3>Comments</h3>
                            <button
                                onClick={() => dispatch(resetPostId())}
                                className={styles.closeModalButton}
                            >
                                &times;
                            </button>
                        </div>
                        <div className={styles.allCommentsContainer}>
                            {postState.comments.length === 0 && (
                                <p className={styles.noComments}>
                                    Be the first to comment!
                                </p>
                            )}
                            {postState.comments.map((postComment) => (
                                <div
                                    className={styles.singleComment}
                                    key={postComment._id}
                                >
                                    <div className={styles.avatarContainer}>
                                        <img
                                            src={
                                                postComment.userId
                                                    .profilePicture
                                            }
                                            alt={postComment.userId.name}
                                            className={styles.userProfilePic}
                                        />
                                        {isUserOnline(
                                            postComment.userId._id,
                                            postComment.userId.isOnline
                                        ) && (
                                            <span
                                                className={styles.onlineDot}
                                            ></span>
                                        )}
                                    </div>
                                    <div className={styles.singleCommentBody}>
                                        <p className={styles.commentUser}>
                                            {postComment.userId.name}
                                            <span>
                                                @{postComment.userId.username}
                                            </span>
                                        </p>
                                        <p>{postComment.body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.postCommentContainer}>
                            {authState.user && (
                                <div className={styles.avatarContainer}>
                                    <img
                                        className={styles.userProfilePic}
                                        src={
                                            authState.user.userId.profilePicture
                                        }
                                        alt="Your profile"
                                    />
                                    <span className={styles.onlineDot}></span>
                                </div>
                            )}
                            <div className={styles.commentInputWrapper}>
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) =>
                                        setCommentText(e.target.value)
                                    }
                                    placeholder="Add a comment..."
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && handlePostComment()
                                    }
                                />
                                <button
                                    onClick={handlePostComment}
                                    className={styles.postCommentButton}
                                    disabled={!commentText.trim()}
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Fetch data on server side
export async function getServerSideProps(context) {
    const { id } = context.query;
    try {
        const response = await clientServer.get("/get_post", {
            params: { post_id: id },
        });
        return {
            props: {
                postData: response.data.post,
            },
        };
    } catch (error) {
        return {
            notFound: true,
        };
    }
}

PostPage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};
