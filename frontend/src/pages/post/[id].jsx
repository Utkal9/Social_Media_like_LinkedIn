import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import clientServer from "@/config";
import { useDispatch, useSelector } from "react-redux";
import {
    toggleLike,
    postComment,
    deletePost,
    toggleCommentLike,
} from "@/config/redux/action/postAction";
import { useSocket } from "@/context/SocketContext";
import styles from "../dashboard/index.module.css"; // Reuse existing theme-aware styles
import Head from "next/head";

// --- HELPERS ---
const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return `${Math.floor(diffInDays / 7)}w`;
};

const isVideo = (fileType, mediaUrl) => {
    if (fileType && fileType.startsWith("video/")) return true;
    if (mediaUrl) {
        const ext = mediaUrl.split(".").pop().toLowerCase();
        return ["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext);
    }
    return false;
};

const getReactionIcon = (type) => {
    const map = {
        Like: "👍",
        Love: "❤️",
        Celebrate: "👏",
        Insightful: "💡",
        Funny: "😂",
    };
    return map[type] || "👍";
};

const getReactionColor = (type) => {
    const map = {
        Love: "#E74C3C",
        Celebrate: "#27AE60",
        Insightful: "#F1C40F",
        Funny: "#E67E22",
    };
    // In light mode, default teal works fine. In dark, it's bright.
    return map[type] || "var(--neon-teal)";
};

// --- ICONS ---
const LikeIconOutline = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        width="20"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
        />
    </svg>
);
const CommentIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        width="20"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 20.25c4.97 0 9-3.633 9-8.437 0-4.805-4.03-8.437-9-8.437-4.97 0-9 3.632-9 8.437 0 2.093.79 4.02 2.128 5.516.29.325.395.774.27 1.193l-.847 2.935c-.168.583.486 1.07.988.782l3.348-1.91c.355-.203.772-.24 1.158-.102.642.228 1.32.352 2.02.352Z"
        />
    </svg>
);
const ShareIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        width="20"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
        />
    </svg>
);
const BackIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        width="18"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
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
    const { onlineStatuses } = useSocket() || {};

    const [localPost, setLocalPost] = useState(postData);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [activeReactionId, setActiveReactionId] = useState(null);
    const reactionTimeoutRef = useRef(null);

    useEffect(() => {
        if (localPost?._id) {
            const fetchComments = async () => {
                try {
                    const res = await clientServer.get("/get_comments", {
                        params: { post_id: localPost._id },
                    });
                    setComments(res.data.reverse());
                } catch (err) {
                    console.error("Failed to fetch comments", err);
                }
            };
            fetchComments();
        }
    }, [localPost?._id]);

    const isUserOnline = (uid) => {
        return onlineStatuses && onlineStatuses[uid]?.isOnline;
    };

    const handleReaction = async (type) => {
        const token = localStorage.getItem("token");
        const response = await dispatch(
            toggleLike({ post_id: localPost._id, token, reactionType: type })
        );
        if (response.payload && response.payload.reactions) {
            setLocalPost((prev) => ({
                ...prev,
                reactions: response.payload.reactions,
            }));
        }
        setActiveReactionId(null);
    };

    const handleMouseEnter = () => {
        if (window.matchMedia("(hover: hover)").matches) {
            if (reactionTimeoutRef.current)
                clearTimeout(reactionTimeoutRef.current);
            setActiveReactionId(localPost._id);
        }
    };

    const handleMouseLeave = () => {
        if (window.matchMedia("(hover: hover)").matches) {
            reactionTimeoutRef.current = setTimeout(() => {
                setActiveReactionId(null);
            }, 500);
        }
    };

    const handleReactionToggle = (e) => {
        e.stopPropagation();
        setActiveReactionId(activeReactionId ? null : localPost._id);
    };

    const getUserReaction = (post, userId) => {
        return post.reactions?.find(
            (r) => r.userId?._id === userId || r.userId === userId
        );
    };

    const handlePostComment = async () => {
        if (!commentText.trim()) return;
        const token = localStorage.getItem("token");
        const response = await dispatch(
            postComment({ post_id: localPost._id, body: commentText })
        );
        if (response.meta.requestStatus === "fulfilled") {
            const res = await clientServer.get("/get_comments", {
                params: { post_id: localPost._id },
            });
            setComments(res.data.reverse());
            setCommentText("");
        }
    };

    const handleLikeComment = async (commentId) => {
        const token = localStorage.getItem("token");
        await dispatch(
            toggleCommentLike({
                comment_id: commentId,
                token,
                post_id: localPost._id,
            })
        );
        const res = await clientServer.get("/get_comments", {
            params: { post_id: localPost._id },
        });
        setComments(res.data.reverse());
    };

    const handleDelete = async () => {
        if (confirm("Delete this post?")) {
            await dispatch(deletePost({ post_id: localPost._id }));
            router.push("/dashboard");
        }
    };

    const handleShare = () => {
        const text = encodeURIComponent(localPost.body);
        const url = encodeURIComponent(window.location.href);
        window.open(
            `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
            "_blank"
        );
    };

    if (!localPost)
        return <div className={styles.loading}>Loading transmission...</div>;

    return (
        <div
            className={styles.feedContainer}
            style={{ maxWidth: "800px", margin: "0 auto", paddingTop: "20px" }}
        >
            <Head>
                <title>{`${localPost.userId.name}'s Post | LinkUps`}</title>
            </Head>

            {/* Back Button - Updated to use theme variables */}
            <button
                onClick={() => router.back()}
                style={{
                    marginBottom: "1.5rem",
                    cursor: "pointer",
                    border: "1px solid var(--neon-teal)",
                    background: "var(--holo-glass)", // Dynamic background
                    color: "var(--neon-teal)",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 20px",
                    borderRadius: "30px",
                    fontSize: "0.9rem",
                    transition: "all 0.2s",
                }}
            >
                <BackIcon /> Return
            </button>

            {/* --- Main Post Card (Uses Dashboard Styles) --- */}
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
                            alt={localPost.userId.name}
                        />
                        {isUserOnline(localPost.userId._id) && (
                            <span className={styles.onlineDot}></span>
                        )}
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
                            @{localPost.userId.username} •{" "}
                            {getTimeAgo(localPost.createdAt)}
                        </p>
                    </div>

                    {authState.user &&
                        localPost.userId._id === authState.user.userId._id && (
                            <button
                                onClick={handleDelete}
                                className={styles.iconBtn}
                                title="Delete Post"
                            >
                                <DeleteIcon />
                            </button>
                        )}
                </div>

                <div className={styles.postCardBody}>
                    <p>{localPost.body}</p>
                    {localPost.media && (
                        <div className={styles.postCardImageContainer}>
                            {isVideo(localPost.fileType, localPost.media) ? (
                                <video
                                    src={localPost.media}
                                    controls
                                    style={{ width: "100%" }}
                                />
                            ) : (
                                <img src={localPost.media} alt="Post media" />
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.postCardStats}>
                    <span>
                        {localPost.reactions ? localPost.reactions.length : 0}{" "}
                        Reactions • {comments.length} Comments
                    </span>
                </div>

                <div className={styles.postCardActions}>
                    <div
                        className={styles.reactionWrapper}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {activeReactionId === localPost._id && (
                            <div className={styles.reactionPopup}>
                                {[
                                    "Like",
                                    "Love",
                                    "Celebrate",
                                    "Insightful",
                                    "Funny",
                                ].map((type) => (
                                    <button
                                        key={type}
                                        className={styles.reactionBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReaction(type);
                                        }}
                                    >
                                        {getReactionIcon(type)}
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            className={styles.actionButton}
                            onClick={handleReactionToggle}
                        >
                            {(() => {
                                const myReaction = getUserReaction(
                                    localPost,
                                    authState.user?.userId?._id
                                );
                                if (myReaction) {
                                    return (
                                        <>
                                            <span
                                                style={{
                                                    fontSize: "1.2rem",
                                                    marginRight: 6,
                                                }}
                                            >
                                                {getReactionIcon(
                                                    myReaction.type
                                                )}
                                            </span>
                                            <span
                                                style={{
                                                    color: getReactionColor(
                                                        myReaction.type
                                                    ),
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {myReaction.type}
                                            </span>
                                        </>
                                    );
                                }
                                return (
                                    <>
                                        <LikeIconOutline /> <span>Like</span>
                                    </>
                                );
                            })()}
                        </button>
                    </div>

                    <button
                        className={styles.actionButton}
                        onClick={() =>
                            document.getElementById("commentInput")?.focus()
                        }
                    >
                        <CommentIcon /> <span>Comment</span>
                    </button>
                    <button
                        onClick={handleShare}
                        className={styles.actionButton}
                    >
                        <ShareIcon /> <span>Share</span>
                    </button>
                </div>
            </div>

            {/* --- Comments Section (Updated for Theme) --- */}
            <div
                className={styles.postCommentContainer}
                style={{ marginTop: "20px", borderRadius: "16px" }}
            >
                <h3
                    style={{
                        color: "var(--text-primary)",
                        fontFamily: "Orbitron",
                        fontSize: "1.1rem",
                        marginBottom: "15px",
                    }}
                >
                    Signal Log ({comments.length})
                </h3>

                <div
                    className={styles.commentInputWrapper}
                    style={{ marginBottom: "20px" }}
                >
                    <input
                        id="commentInput"
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add data packet..."
                        onKeyDown={(e) =>
                            e.key === "Enter" && handlePostComment()
                        }
                    />
                    <button onClick={handlePostComment}>Transmit</button>
                </div>

                <div
                    className={styles.allCommentsContainer}
                    style={{ maxHeight: "none", overflow: "visible" }}
                >
                    {comments.map((c) => (
                        <div key={c._id} className={styles.singleComment}>
                            <div
                                className={styles.commentAvatarContainer}
                                onClick={() =>
                                    router.push(
                                        `/view_profile/${c.userId.username}`
                                    )
                                }
                            >
                                <img
                                    src={c.userId.profilePicture}
                                    alt={c.userId.name}
                                    className={styles.userProfilePic}
                                />
                            </div>
                            <div className={styles.singleCommentBody}>
                                <div className={styles.commentHeader}>
                                    <span className={styles.commentUser}>
                                        {c.userId.name}
                                    </span>
                                    <span className={styles.commentTime}>
                                        {getTimeAgo(c.createdAt)}
                                    </span>
                                </div>
                                <p className={styles.commentText}>{c.body}</p>
                                <div className={styles.commentActions}>
                                    <span
                                        onClick={() => handleLikeComment(c._id)}
                                        style={{
                                            color: c.likes?.includes(
                                                authState.user?.userId?._id
                                            )
                                                ? "var(--neon-teal)"
                                                : "var(--text-secondary)",
                                        }}
                                    >
                                        Like{" "}
                                        {c.likes?.length > 0 &&
                                            `(${c.likes.length})`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <p
                            className={styles.emptyText}
                            style={{ textAlign: "center" }}
                        >
                            No signals detected yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export async function getServerSideProps(context) {
    const { id } = context.query;
    try {
        const response = await clientServer.get("/get_post", {
            params: { post_id: id },
        });
        return { props: { postData: response.data.post } };
    } catch (error) {
        return { notFound: true };
    }
}

PostPage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};
