// frontend/src/pages/post/[id].jsx
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
    updatePost,
} from "@/config/redux/action/postAction";
import { resetPostId } from "@/config/redux/reducer/postReducer";
import { useSocket } from "@/context/SocketContext";
import styles from "../dashboard/index.module.css"; // Reuse Dashboard Glass Styles

// --- HELPER: Video Detection ---
const isVideo = (fileType, mediaUrl) => {
    if (fileType && fileType.startsWith("video/")) return true;
    if (mediaUrl) {
        const ext = mediaUrl.split(".").pop().toLowerCase();
        return ["mp4", "webm", "ogg", "mov"].includes(ext);
    }
    return false;
};

// --- Holo Icons (Consistent with Dashboard) ---
const MoreHorizIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: "24px", height: "24px" }}
    >
        <path
            fillRule="evenodd"
            d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
            clipRule="evenodd"
        />
    </svg>
);
const ImageIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "#378fe9", width: "24px", height: "24px" }}
    >
        <path d="M19 4H5C3.9 4 3 4.9 3 6v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V6h14v12zm-5-7c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3z" />
    </svg>
);
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
// FIXED COMMENT ICON PATH
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
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
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
const EditIcon = () => (
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
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
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

export default function PostPage({ postData }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);
    const postState = useSelector((state) => state.postReducer);
    const { onlineStatuses } = useSocket() || {};

    const [localPost, setLocalPost] = useState(postData);
    const [commentText, setCommentText] = useState("");

    // --- Editing & Menu State ---
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [editBody, setEditBody] = useState("");
    const [editFile, setEditFile] = useState(null);
    const [editFilePreview, setEditFilePreview] = useState(null);

    useEffect(() => {
        setLocalPost(postData);
    }, [postData]);

    useEffect(() => {
        const closeMenu = () => setOpenMenuId(null);
        document.addEventListener("click", closeMenu);
        return () => document.removeEventListener("click", closeMenu);
    }, []);

    const isUserOnline = (uid, defaultStatus) => {
        return onlineStatuses && onlineStatuses[uid]
            ? onlineStatuses[uid].isOnline
            : defaultStatus;
    };

    // --- Share Handler (Restored) ---
    const handleShare = (postBody) => {
        const text = encodeURIComponent(postBody);
        const url = encodeURIComponent(window.location.href);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        window.open(twitterUrl, "_blank");
    };

    const handleLike = async () => {
        const token = localStorage.getItem("token");
        const response = await dispatch(
            toggleLike({ post_id: localPost._id, token })
        );
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

    const handleEditFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 10 * 1024 * 1024) {
            alert("File is too large. Max 10MB.");
            setEditFile(null);
            setEditFilePreview(null);
            e.target.value = null;
        } else if (file) {
            setEditFile(file);
            setEditFilePreview(URL.createObjectURL(file));
        }
    };

    const handleEditClick = () => {
        setEditingPost(localPost);
        setEditBody(localPost.body);
        setEditFile(null);
        setEditFilePreview(null);
        setOpenMenuId(null);
    };

    const handleUpdateSubmit = async () => {
        if (!editingPost) return;
        await dispatch(
            updatePost({
                post_id: editingPost._id,
                body: editBody,
                file: editFile,
            })
        );
        setEditingPost(null);
        setEditBody("");
        setEditFile(null);
        setEditFilePreview(null);
        router.replace(router.asPath);
    };

    const handleOpenComments = () => {
        dispatch(getAllComments({ post_id: localPost._id }));
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
                    border: "1px solid var(--neon-teal)",
                    background: "rgba(15, 255, 198, 0.1)",
                    color: "var(--neon-teal)",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                        "rgba(15, 255, 198, 0.2)")
                }
                onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                        "rgba(15, 255, 198, 0.1)")
                }
            >
                <BackIcon /> Return to Stream
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
                            <div
                                className={styles.moreOptionsWrapper}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(
                                            openMenuId
                                                ? null
                                                : "single-post-menu"
                                        );
                                    }}
                                    className={styles.iconBtn}
                                    title="More options"
                                >
                                    <MoreHorizIcon />
                                </button>
                                {openMenuId === "single-post-menu" && (
                                    <div className={styles.optionsDropdown}>
                                        <div
                                            className={styles.optionItem}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick();
                                            }}
                                        >
                                            <EditIcon /> <span>Edit Post</span>
                                        </div>
                                        <div
                                            className={`${styles.optionItem} ${styles.delete}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete();
                                            }}
                                        >
                                            <DeleteIcon />{" "}
                                            <span>Delete Post</span>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                    style={{
                                        width: "100%",
                                        maxHeight: "600px",
                                    }}
                                />
                            ) : (
                                <img src={localPost.media} alt="Post media" />
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.postCardStats}>
                    <span>
                        {localPost.likes ? localPost.likes.length : 0} Likes
                    </span>
                </div>

                <div className={styles.postCardActions}>
                    <button
                        onClick={handleLike}
                        className={`${styles.actionButton} ${
                            authState.user &&
                            Array.isArray(localPost.likes) &&
                            localPost.likes.includes(authState.user.userId._id)
                                ? styles.activeAction
                                : ""
                        }`}
                    >
                        <LikeIcon
                            isLiked={
                                authState.user &&
                                Array.isArray(localPost.likes) &&
                                localPost.likes.includes(
                                    authState.user.userId._id
                                )
                            }
                        />
                        <span>Like</span>
                    </button>
                    <button
                        onClick={handleOpenComments}
                        className={styles.actionButton}
                    >
                        <CommentIcon />
                        <span>Comment</span>
                    </button>
                    <button
                        onClick={() => handleShare(localPost.body)}
                        className={styles.actionButton}
                    >
                        <ShareIcon />
                        <span>Share</span>
                    </button>
                </div>
            </div>

            {/* --- EDIT POST MODAL (Reusing styles) --- */}
            {editingPost && (
                <div
                    className={styles.commentModalBackdrop}
                    onClick={() => setEditingPost(null)}
                >
                    <div
                        className={styles.commentModalContent}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            height: "auto",
                            maxHeight: "85vh",
                            maxWidth: "600px",
                        }}
                    >
                        <div className={styles.commentModalHeader}>
                            <h3>Edit Post</h3>
                            <button
                                onClick={() => setEditingPost(null)}
                                className={styles.closeModalButton}
                            >
                                &times;
                            </button>
                        </div>
                        <div className={styles.editModalBody}>
                            <textarea
                                className={styles.textAreaOfContent}
                                style={{ height: "100px" }}
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                placeholder="Update your transmission..."
                            />
                            <div className={styles.previewContainer}>
                                {editFilePreview ? (
                                    <img
                                        src={editFilePreview}
                                        alt="Preview"
                                        style={{
                                            maxHeight: "250px",
                                            maxWidth: "100%",
                                            objectFit: "contain",
                                        }}
                                    />
                                ) : editingPost.media ? (
                                    <img
                                        src={editingPost.media}
                                        alt="Current"
                                        style={{
                                            maxHeight: "250px",
                                            maxWidth: "100%",
                                            objectFit: "contain",
                                        }}
                                    />
                                ) : (
                                    <p style={{ color: "#888" }}>No media</p>
                                )}
                            </div>
                            <div className={styles.createPostBottom}>
                                <label
                                    htmlFor="editFileUpload"
                                    className={styles.mediaButton}
                                >
                                    <ImageIcon /> <span>Change Media</span>
                                </label>
                                <input
                                    id="editFileUpload"
                                    type="file"
                                    hidden
                                    accept="image/*,video/*"
                                    onChange={handleEditFileChange}
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: "1rem",
                                    marginTop: "1rem",
                                }}
                            >
                                <button
                                    onClick={() => setEditingPost(null)}
                                    className={styles.cancelButton}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateSubmit}
                                    className={styles.uploadButton}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Comments Section */}
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
                                            style={{ width: 32, height: 32 }}
                                        />
                                    </div>
                                    <div className={styles.singleCommentBody}>
                                        <p className={styles.commentUser}>
                                            {postComment.userId.name}
                                        </p>
                                        <p className={styles.commentText}>
                                            {postComment.body}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.postCommentContainer}>
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
                                <button onClick={handlePostComment}>
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
