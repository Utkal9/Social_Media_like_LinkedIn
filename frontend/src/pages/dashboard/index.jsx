import { getAboutUser, getAllUsers } from "@/config/redux/action/authAction";
import {
    createPost,
    deletePost,
    getAllComments,
    getAllPosts,
    toggleLike,
    postComment,
    toggleCommentLike,
} from "@/config/redux/action/postAction";
import DashboardLayout from "@/layout/DashboardLayout";
import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./index.module.css";
import { resetPostId } from "@/config/redux/reducer/postReducer";
import { useSocket } from "@/context/SocketContext";

// --- HELPER: TIME AGO ---
function getTimeAgo(dateString) {
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
}

// --- Helper for Reaction Icons ---
const getReactionIcon = (type) => {
    switch (type) {
        case "Like":
            return "👍";
        case "Love":
            return "❤️";
        case "Celebrate":
            return "👏";
        case "Insightful":
            return "💡";
        case "Funny":
            return "😂";
        default:
            return "👍";
    }
};

const getReactionColor = (type) => {
    switch (type) {
        case "Love":
            return "#E74C3C";
        case "Celebrate":
            return "#27AE60";
        case "Insightful":
            return "#F1C40F";
        case "Funny":
            return "#E67E22";
        default:
            return "#0a66c2"; // Like Blue
    }
};

// --- SVG Icons ---
const ImageIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "#378fe9", width: "24px", height: "24px" }}
    >
        <path d="M19 4H5C3.9 4 3 4.9 3 6v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V6h14v12zm-5-7c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3z" />
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
            d="M12 20.25c4.97 0 9-3.633 9-8.437 0-4.805-4.03-8.437-9-8.437-4.97 0-9 3.632-9 8.437 0 2.093.79 4.02 2.128 5.516.29.325.395.774.27 1.193l-.847 2.935c-.168.583.486 1.07.988.782l3.348-1.91c.355-.203.772-.24 1.158-.102.642.228 1.32.352 2.02.352Z"
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

// Clean, simple "Like" outline icon for unliked state
const LikeIconOutline = () => (
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
            d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
        />
    </svg>
);

export default function Dashboard() {
    const router = useRouter();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const postState = useSelector((state) => state.postReducer);
    const { onlineStatuses } = useSocket() || {};
    const [postError, setPostError] = useState("");
    const [postContent, setPostContent] = useState("");
    const [fileContent, setFileContent] = useState(null);
    const [commentText, setCommentText] = useState("");
    const [showReactionListModal, setShowReactionListModal] = useState(false);
    const [currentReactionList, setCurrentReactionList] = useState([]);
    const commentInputRef = useRef(null);

    useEffect(() => {
        if (authState.isTokenThere) {
            dispatch(getAllPosts());
            dispatch(getAboutUser({ token: localStorage.getItem("token") }));
        }
        if (!authState.all_profiles_fetched) {
            dispatch(getAllUsers());
        }
    }, [authState.isTokenThere, dispatch]);

    const handleUpload = async () => {
        if (fileContent && fileContent.size > 10 * 1024 * 1024) {
            setPostError("File is too large. Max 10MB.");
            return;
        }
        await dispatch(createPost({ file: fileContent, body: postContent }));
        setPostContent("");
        setFileContent(null);
        setPostError("");
    };

    const handleReaction = (postId, type) => {
        const token = localStorage.getItem("token");
        dispatch(
            toggleLike({
                post_id: postId,
                token: token,
                reactionType: type,
            })
        );
    };

    const handleDelete = async (postId) => {
        if (confirm("Are you sure you want to delete this post?")) {
            await dispatch(deletePost({ post_id: postId }));
            dispatch(getAllPosts());
        }
    };

    const handleOpenComments = (postId) => {
        dispatch(getAllComments({ post_id: postId }));
    };

    const handleShare = (postBody) => {
        const text = encodeURIComponent(postBody);
        const url = encodeURIComponent("proconnect.com");
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        window.open(twitterUrl, "_blank");
    };

    const handlePostComment = async () => {
        if (!commentText.trim()) return;
        await dispatch(
            postComment({ post_id: postState.postId, body: commentText })
        );
        await dispatch(getAllComments({ post_id: postState.postId }));
        setCommentText("");
    };

    const handleLikeComment = (commentId) => {
        dispatch(
            toggleCommentLike({
                comment_id: commentId,
                token: localStorage.getItem("token"),
                post_id: postState.postId,
            })
        );
    };

    const handleReplyComment = (username) => {
        setCommentText(`@${username} `);
        commentInputRef.current?.focus();
    };

    const handleShowReactionList = (reactions) => {
        setCurrentReactionList(reactions || []);
        setShowReactionListModal(true);
    };

    const isUserOnline = (uid, defaultStatus) => {
        return onlineStatuses && onlineStatuses[uid]
            ? onlineStatuses[uid].isOnline
            : defaultStatus;
    };

    const getUserReaction = (post, userId) => {
        return post.reactions?.find(
            (r) => r.userId?._id === userId || r.userId === userId
        );
    };

    const getUniqueReactions = (reactions) => {
        if (!reactions) return [];
        const uniqueTypes = [...new Set(reactions.map((r) => r.type))];
        return uniqueTypes;
    };

    if (!authState.user) {
        return <div className={styles.loading}>Loading feed...</div>;
    }

    return (
        <>
            <div className={styles.feedContainer}>
                <div className={styles.createPostContainer}>
                    <div className={styles.createPostTop}>
                        <div
                            className={styles.avatarContainer}
                            onClick={() => router.push("/profile")}
                        >
                            <img
                                className={styles.userProfilePic}
                                src={authState.user.userId.profilePicture}
                                alt="Your profile"
                            />
                            <span className={styles.onlineDot}></span>
                        </div>
                        <div className={styles.inputWrapper}>
                            <textarea
                                onChange={(e) => setPostContent(e.target.value)}
                                value={postContent}
                                className={styles.textAreaOfContent}
                                placeholder="Start a post"
                            ></textarea>
                        </div>
                    </div>
                    {postError && (
                        <p className={styles.errorMessage}>{postError}</p>
                    )}
                    <div className={styles.createPostBottom}>
                        <label
                            htmlFor="fileUpload"
                            className={styles.mediaButton}
                        >
                            <ImageIcon /> <span>Media</span>
                        </label>
                        <input
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file && file.size > 10 * 1024 * 1024) {
                                    setPostError("File is too large.");
                                    setFileContent(null);
                                    e.target.value = null;
                                } else if (file) {
                                    setFileContent(file);
                                    setPostError("");
                                } else {
                                    setFileContent(null);
                                    setPostError("");
                                }
                            }}
                            type="file"
                            hidden
                            id="fileUpload"
                        />
                        {fileContent && (
                            <span className={styles.fileName}>
                                {fileContent.name}
                            </span>
                        )}
                        <div className={styles.spacer}></div>
                        <button
                            onClick={handleUpload}
                            className={styles.uploadButton}
                            disabled={!postContent.trim() && !fileContent}
                        >
                            Post
                        </button>
                    </div>
                </div>

                <div className={styles.postsContainer}>
                    {postState.posts.map((post) => (
                        <div key={post._id} className={styles.postCard}>
                            <div className={styles.postCardHeader}>
                                <div
                                    className={styles.avatarContainer}
                                    onClick={() =>
                                        router.push(
                                            `/view_profile/${post.userId.username}`
                                        )
                                    }
                                    style={{ cursor: "pointer" }}
                                >
                                    <img
                                        className={styles.userProfilePic}
                                        src={post.userId.profilePicture}
                                        alt={`${post.userId.name}'s profile`}
                                    />
                                    {isUserOnline(
                                        post.userId._id,
                                        post.userId.isOnline
                                    ) && (
                                        <span
                                            className={styles.onlineDot}
                                        ></span>
                                    )}
                                </div>
                                <div className={styles.postCardHeaderInfo}>
                                    <div className={styles.headerTopRow}>
                                        <p
                                            className={styles.postCardUser}
                                            onClick={() =>
                                                router.push(
                                                    `/view_profile/${post.userId.username}`
                                                )
                                            }
                                        >
                                            {post.userId.name}
                                        </p>
                                    </div>
                                    <p className={styles.postCardUsername}>
                                        @{post.userId.username}
                                    </p>
                                </div>
                                {post.userId._id ===
                                    authState.user.userId._id && (
                                    <button
                                        onClick={() => handleDelete(post._id)}
                                        className={styles.deleteButton}
                                    >
                                        <DeleteIcon />
                                    </button>
                                )}
                            </div>

                            <div className={styles.postCardBody}>
                                <p>{post.body}</p>
                                {post.media && (
                                    <div
                                        className={
                                            styles.postCardImageContainer
                                        }
                                    >
                                        <img
                                            src={post.media}
                                            alt="Post media"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={styles.postCardStats}>
                                {post.reactions &&
                                    post.reactions.length > 0 && (
                                        <div
                                            className={
                                                styles.reactionsCountWrapper
                                            }
                                            onClick={() =>
                                                handleShowReactionList(
                                                    post.reactions
                                                )
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.reactionIconsStack
                                                }
                                            >
                                                {getUniqueReactions(
                                                    post.reactions
                                                )
                                                    .slice(0, 3)
                                                    .map((type, idx) => (
                                                        <span
                                                            key={type}
                                                            className={
                                                                styles.miniReactionIcon
                                                            }
                                                            style={{
                                                                zIndex: 3 - idx,
                                                            }}
                                                        >
                                                            {getReactionIcon(
                                                                type
                                                            )}
                                                        </span>
                                                    ))}
                                            </div>
                                            <span
                                                className={
                                                    styles.reactionCountText
                                                }
                                            >
                                                {post.reactions.length}{" "}
                                                {post.reactions.length === 1
                                                    ? "Reaction"
                                                    : "Reactions"}
                                            </span>
                                        </div>
                                    )}
                            </div>

                            <div className={styles.postCardActions}>
                                <div className={styles.reactionWrapper}>
                                    <div className={styles.reactionPopup}>
                                        <button
                                            className={styles.reactionBtn}
                                            onClick={() =>
                                                handleReaction(post._id, "Like")
                                            }
                                            title="Like"
                                        >
                                            👍
                                        </button>
                                        <button
                                            className={styles.reactionBtn}
                                            onClick={() =>
                                                handleReaction(post._id, "Love")
                                            }
                                            title="Love"
                                        >
                                            ❤️
                                        </button>
                                        <button
                                            className={styles.reactionBtn}
                                            onClick={() =>
                                                handleReaction(
                                                    post._id,
                                                    "Celebrate"
                                                )
                                            }
                                            title="Celebrate"
                                        >
                                            👏
                                        </button>
                                        <button
                                            className={styles.reactionBtn}
                                            onClick={() =>
                                                handleReaction(
                                                    post._id,
                                                    "Insightful"
                                                )
                                            }
                                            title="Insightful"
                                        >
                                            💡
                                        </button>
                                        <button
                                            className={styles.reactionBtn}
                                            onClick={() =>
                                                handleReaction(
                                                    post._id,
                                                    "Funny"
                                                )
                                            }
                                            title="Funny"
                                        >
                                            😂
                                        </button>
                                    </div>

                                    <button
                                        className={styles.actionButton}
                                        onClick={() =>
                                            handleReaction(post._id, "Like")
                                        }
                                    >
                                        {(() => {
                                            const myReaction = getUserReaction(
                                                post,
                                                authState.user.userId._id
                                            );
                                            if (myReaction) {
                                                const color = getReactionColor(
                                                    myReaction.type
                                                );
                                                const icon = getReactionIcon(
                                                    myReaction.type
                                                );
                                                // NOW: ALL reactions (including Like) show the Emoji + Text
                                                return (
                                                    <>
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "1.2rem",
                                                                lineHeight: 1,
                                                                marginRight:
                                                                    "4px",
                                                            }}
                                                        >
                                                            {icon}
                                                        </span>
                                                        <span
                                                            style={{
                                                                color: color,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {myReaction.type}
                                                        </span>
                                                    </>
                                                );
                                            }
                                            // Default Unliked State (Grey Outline)
                                            return (
                                                <>
                                                    <LikeIconOutline />
                                                    <span>Like</span>
                                                </>
                                            );
                                        })()}
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleOpenComments(post._id)}
                                    className={styles.actionButton}
                                >
                                    <CommentIcon />
                                    <span>Comment</span>
                                </button>
                                <button
                                    onClick={() => handleShare(post.body)}
                                    className={styles.actionButton}
                                >
                                    <ShareIcon />
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- REACTION LIST MODAL --- */}
            {showReactionListModal && (
                <div
                    className={styles.commentModalBackdrop}
                    onClick={() => setShowReactionListModal(false)}
                >
                    <div
                        className={styles.commentModalContent}
                        onClick={(e) => e.stopPropagation()}
                        style={{ height: "60vh", maxWidth: "500px" }}
                    >
                        <div className={styles.commentModalHeader}>
                            <h3>Reactions</h3>
                            <button
                                onClick={() => setShowReactionListModal(false)}
                                className={styles.closeModalButton}
                            >
                                &times;
                            </button>
                        </div>
                        <div className={styles.allCommentsContainer}>
                            {currentReactionList.map((reaction, idx) => (
                                <div
                                    className={styles.reactionUserItem}
                                    key={idx}
                                    onClick={() => {
                                        setShowReactionListModal(false);
                                        router.push(
                                            `/view_profile/${reaction.userId.username}`
                                        );
                                    }}
                                >
                                    <div className={styles.avatarContainer}>
                                        <img
                                            src={
                                                reaction.userId
                                                    ?.profilePicture ||
                                                "https://via.placeholder.com/48"
                                            }
                                            alt={reaction.userId?.name}
                                            className={styles.userProfilePic}
                                        />
                                        <span
                                            className={
                                                styles.reactionTypeIconOnAvatar
                                            }
                                        >
                                            {getReactionIcon(reaction.type)}
                                        </span>
                                    </div>
                                    <div className={styles.userInfo}>
                                        <h4>{reaction.userId?.name}</h4>
                                        <p>@{reaction.userId?.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Comment Modal */}
            {postState.postId !== "" && (
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
                            {postState.comments.map((postComment) => {
                                const isCommentLiked =
                                    postComment.likes &&
                                    postComment.likes.includes(
                                        authState.user.userId._id
                                    );
                                return (
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
                                                className={
                                                    styles.userProfilePic
                                                }
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
                                        <div
                                            className={
                                                styles.commentContentWrapper
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.singleCommentBody
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.commentHeader
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.commentUser
                                                        }
                                                        onClick={() =>
                                                            router.push(
                                                                `/view_profile/${postComment.userId.username}`
                                                            )
                                                        }
                                                    >
                                                        {
                                                            postComment.userId
                                                                .name
                                                        }
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.commentTime
                                                        }
                                                    >
                                                        •{" "}
                                                        {getTimeAgo(
                                                            postComment.createdAt
                                                        )}
                                                    </span>
                                                </div>
                                                <p
                                                    className={
                                                        styles.commentText
                                                    }
                                                >
                                                    {postComment.body}
                                                </p>
                                            </div>
                                            <div
                                                className={
                                                    styles.commentActions
                                                }
                                            >
                                                <span
                                                    onClick={() =>
                                                        handleLikeComment(
                                                            postComment._id
                                                        )
                                                    }
                                                    style={{
                                                        color: isCommentLiked
                                                            ? "#0a66c2"
                                                            : "#666",
                                                    }}
                                                >
                                                    Like{" "}
                                                    {postComment.likes &&
                                                        postComment.likes
                                                            .length > 0 &&
                                                        `(${postComment.likes.length})`}
                                                </span>
                                                <span
                                                    onClick={() =>
                                                        handleReplyComment(
                                                            postComment.userId
                                                                .username
                                                        )
                                                    }
                                                >
                                                    Reply
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className={styles.postCommentContainer}>
                            <div className={styles.avatarContainer}>
                                <img
                                    className={styles.userProfilePic}
                                    src={authState.user.userId.profilePicture}
                                    alt="Your profile"
                                />
                                <span className={styles.onlineDot}></span>
                            </div>
                            <div className={styles.commentInputWrapper}>
                                <input
                                    ref={commentInputRef}
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
                                {commentText.length > 0 && (
                                    <button
                                        onClick={handlePostComment}
                                        className={styles.postCommentButton}
                                    >
                                        Post
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Dashboard.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};
