// frontend/src/pages/messaging/index.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import UserLayout from "@/layout/UserLayout";
import clientServer from "@/config";
import { useSelector } from "react-redux";
import { useSocket } from "@/context/SocketContext";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import Head from "next/head";

// --- ICONS ---
const SearchIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="18"
    >
        <circle cx="11" cy="11" r="8" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35"
        />
    </svg>
);
const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20">
        <path d="M3.478 2.405a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
    </svg>
);
const VideoIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22">
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
    </svg>
);
const BackIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
        />
    </svg>
);
const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20">
        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
);
const MoreVerticalIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18">
        <path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
);
const CheckIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        width="16"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
        />
    </svg>
);
const XIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        width="16"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
        />
    </svg>
);
const InfoIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="16"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
    </svg>
);
const TrashIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        width="16"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        />
    </svg>
);
const SingleTick = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        width="16"
        height="16"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
        />
    </svg>
);
const DoubleTickIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        width="18"
        height="18"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 12.5l4.5 4.5 9-9"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 12.5l2.5 2.5 7.5-8.5"
        />
    </svg>
);
const CheckCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20">
        <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
            clipRule="evenodd"
        />
    </svg>
);
const MessageNotifIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20">
        <path
            fillRule="evenodd"
            d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z"
            clipRule="evenodd"
        />
    </svg>
);

// --- HELPERS ---
const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatLastSeen = (dateString) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));
    if (diffInSeconds < 60) return "Active just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Active ${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Active ${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Active ${diffInDays}d ago`;
    return `Active ${Math.floor(diffInDays / 7)}w ago`;
};

const formatDateFull = (dateStr) => {
    if (!dateStr) return "---";
    return new Date(dateStr).toLocaleString();
};

export default function MessagingPage() {
    const router = useRouter();
    const auth = useSelector((state) => state.auth);
    const { socket, onlineStatuses, setOnlineStatuses, fetchUnreadCount } =
        useSocket() || {};

    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showMobileChat, setShowMobileChat] = useState(false);
    const chatContainerRef = useRef(null);
    const [isMounted, setIsMounted] = useState(false);

    // UI States
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editInput, setEditInput] = useState("");
    const [infoMessage, setInfoMessage] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);

    const conversationsRef = useRef(conversations);
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        setIsMounted(true);
        if (!localStorage.getItem("token")) {
            router.push("/login");
        } else {
            fetchConversations();
        }
    }, [router]);

    useEffect(() => {
        const closeMenu = () => {
            setActiveMessageId(null);
            setShowHeaderMenu(false);
        };
        if (activeMessageId || showHeaderMenu)
            document.addEventListener("click", closeMenu);
        return () => document.removeEventListener("click", closeMenu);
    }, [activeMessageId, showHeaderMenu]);

    const isConnected = useMemo(() => {
        if (!activeChat || !auth.connections || !auth.connectionRequest)
            return false;
        const targetId = activeChat._id;
        return (
            auth.connections.some(
                (c) =>
                    c.connectionId?._id === targetId &&
                    c.status_accepted === true
            ) ||
            auth.connectionRequest.some(
                (c) => c.userId?._id === targetId && c.status_accepted === true
            )
        );
    }, [activeChat, auth.connections, auth.connectionRequest]);

    const showToast = (msg, type = "info") => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchConversations = async () => {
        if (localStorage.getItem("token")) {
            try {
                const res = await clientServer.get("/messages/conversations", {
                    params: { token: localStorage.getItem("token") },
                });
                setConversations(res.data);
                const initialStatuses = {};
                res.data.forEach((item) => {
                    if (item.user) {
                        initialStatuses[item.user._id] = {
                            isOnline: item.user.isOnline,
                            lastSeen: item.user.lastSeen,
                        };
                    }
                });
                if (setOnlineStatuses) {
                    setOnlineStatuses((prev) => ({
                        ...initialStatuses,
                        ...prev,
                    }));
                }
            } catch (err) {
                console.error("Error fetching conversations:", err);
            }
        }
    };

    useEffect(() => {
        if (!router.isReady || !localStorage.getItem("token")) return;
        const { chatWith } = router.query;

        if (chatWith) {
            const existingChat = conversations.find(
                (c) => c.user && c.user.username === chatWith
            );

            if (existingChat) {
                handleSelectChat(existingChat.user);
            } else {
                const fetchTargetUser = async () => {
                    try {
                        const res = await clientServer.get(
                            "/user/get_profile_based_on_username",
                            { params: { username: chatWith } }
                        );
                        const targetUser = res.data.profile.userId;

                        setConversations((prev) => {
                            if (prev.find((c) => c.user._id === targetUser._id))
                                return prev;
                            return [
                                {
                                    user: targetUser,
                                    lastMessage: null,
                                    unreadCount: 0,
                                },
                                ...prev,
                            ];
                        });

                        handleSelectChat(targetUser);
                    } catch (err) {
                        console.error("User not found", err);
                    }
                };
                fetchTargetUser();
            }
        }
    }, [router.isReady, router.query, conversations.length]);

    const markAsRead = async (senderId) => {
        try {
            await clientServer.post("/messages/mark_read", {
                token: localStorage.getItem("token"),
                senderId: senderId,
            });
            if (fetchUnreadCount) fetchUnreadCount();
            if (socket) {
                socket.emit("mark-as-read", {
                    senderId: senderId,
                    receiverId: auth.user?.userId?._id,
                });
            }
            setConversations((prev) =>
                prev.map((c) => {
                    if (c.user._id === senderId)
                        return { ...c, unreadCount: 0 };
                    return c;
                })
            );
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    useEffect(() => {
        if (!activeChat) return;
        const fetchMessages = async () => {
            try {
                const res = await clientServer.get("/messages/get", {
                    params: {
                        token: localStorage.getItem("token"),
                        otherUserId: activeChat._id,
                    },
                });
                setMessages(res.data);
                scrollToBottom();
                markAsRead(activeChat._id);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMessages();
    }, [activeChat]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (data) => {
            if (activeChat && data.sender === activeChat._id) {
                setMessages((prev) => [...prev, data]);
                scrollToBottom();
                markAsRead(activeChat._id);
            } else {
                fetchConversations();
                const senderEntry = conversationsRef.current.find(
                    (c) => c.user._id === data.sender
                );
                const senderName = senderEntry
                    ? senderEntry.user.name
                    : "New Connection";
                showToast(`New message from ${senderName}`, "message");
            }
        };

        const handleStatusUpdate = ({ messageId, status }) => {
            setMessages((prev) =>
                prev.map((m) => (m._id === messageId ? { ...m, status } : m))
            );
        };

        const handleReadUpdate = ({ receiverId }) => {
            if (activeChat && activeChat._id === receiverId) {
                setMessages((prev) =>
                    prev.map((m) => ({ ...m, status: "read", isRead: true }))
                );
            }
        };

        const handleMessageUpdate = ({ messageId, newMessage, isEdited }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId
                        ? { ...msg, message: newMessage, isEdited }
                        : msg
                )
            );
        };

        const handleMessageDelete = ({ messageId, isDeleted, message }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId ? { ...msg, isDeleted, message } : msg
                )
            );
        };

        socket.on("receive-chat-message", handleReceiveMessage);
        socket.on("message-status-update", handleStatusUpdate);
        socket.on("messages-read-update", handleReadUpdate);
        socket.on("message-updated", handleMessageUpdate);
        socket.on("message-deleted", handleMessageDelete);

        return () => {
            socket.off("receive-chat-message", handleReceiveMessage);
            socket.off("message-status-update", handleStatusUpdate);
            socket.off("messages-read-update", handleReadUpdate);
            socket.off("message-updated", handleMessageUpdate);
            socket.off("message-deleted", handleMessageDelete);
        };
    }, [socket, activeChat]);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            // This scrolls ONLY the chat div, not the whole page
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    };

    const handleSelectChat = (user) => {
        setActiveChat(user);
        setShowMobileChat(true);
        if (router.query.chatWith) {
            router.replace("/messaging", undefined, { shallow: true });
        }
    };

    const handleBackToConversations = () => {
        setShowMobileChat(false);
        setActiveChat(null);
        fetchConversations();
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeChat) return;
        const myId = auth.user?.userId?._id;

        const tempId = Date.now().toString();
        const newMsg = {
            _id: tempId,
            sender: myId,
            receiver: activeChat._id,
            message: inputText,
            createdAt: new Date().toISOString(),
            status: "sent",
        };

        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
        scrollToBottom();

        try {
            const res = await clientServer.post("/messages/send", {
                token: localStorage.getItem("token"),
                toUserId: activeChat._id,
                message: newMsg.message,
            });
            setMessages((prev) =>
                prev.map((m) => (m._id === tempId ? res.data : m))
            );

            if (socket) {
                socket.emit("send-chat-message", {
                    senderId: myId,
                    receiverId: activeChat._id,
                    message: newMsg.message,
                });
            }
            fetchConversations();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteClick = (msgId) => {
        setDeleteConfirmId(msgId);
        setActiveMessageId(null);
    };

    const confirmDeleteMessage = async () => {
        if (!deleteConfirmId) return;
        setMessages((prev) =>
            prev.map((msg) =>
                msg._id === deleteConfirmId
                    ? {
                          ...msg,
                          isDeleted: true,
                          message: "This message was deleted",
                      }
                    : msg
            )
        );
        try {
            await clientServer.post("/messages/delete", {
                token: localStorage.getItem("token"),
                messageId: deleteConfirmId,
            });
            socket.emit("delete-message", {
                messageId: deleteConfirmId,
                receiverId: activeChat._id,
            });
            showToast("Message deleted");
        } catch (err) {
            console.error(err);
        }
        setDeleteConfirmId(null);
    };

    const handleClearMessage = (msgId) => {
        setMessages((prev) => prev.filter((m) => m._id !== msgId));
        setActiveMessageId(null);
        showToast("Message cleared");
    };

    const handleClearChatHistory = async () => {
        if (!confirm("Are you sure you want to clear the chat history?"))
            return;
        try {
            await clientServer.post("/messages/clear", {
                token: localStorage.getItem("token"),
                otherUserId: activeChat._id,
            });
            setMessages([]);
            setShowHeaderMenu(false);
            showToast("Chat history cleared");
            fetchConversations();
        } catch (err) {
            console.error(err);
        }
    };

    const startEditing = (msg) => {
        setEditingMessageId(msg._id);
        setEditInput(msg.message);
        setActiveMessageId(null);
    };

    const submitEdit = async () => {
        if (!editInput.trim() || !editingMessageId) return;
        setMessages((prev) =>
            prev.map((msg) =>
                msg._id === editingMessageId
                    ? { ...msg, message: editInput, isEdited: true }
                    : msg
            )
        );
        setEditingMessageId(null);
        try {
            await clientServer.post("/messages/edit", {
                token: localStorage.getItem("token"),
                messageId: editingMessageId,
                newMessage: editInput,
            });
            socket.emit("edit-message", {
                messageId: editingMessageId,
                newMessage: editInput,
                receiverId: activeChat._id,
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleInfoClick = (msg) => {
        setInfoMessage(msg);
        setActiveMessageId(null);
    };

    // --- FIX: INTEGRATE INTERNAL VIDEO CALL ---
    const handleStartVideoCall = () => {
        if (!activeChat || !auth.user?.userId || !socket) return;
        const roomId = [auth.user.userId._id, activeChat._id].sort().join("-");

        // --- FIX: Use router.push + Return URL ---
        const currentPath = router.asPath; // e.g. /messaging?chatWith=...
        router.push(
            `/meet/${roomId}?returnTo=${encodeURIComponent(currentPath)}`
        );

        // Notify other user
        const roomUrl = `${window.location.origin}/meet/${roomId}`;
        socket.emit("start-call", {
            fromUser: auth.user.userId,
            toUserId: activeChat._id,
            roomUrl: roomUrl,
        });
    };

    const filteredConversations = conversations.filter((c) => {
        if (!c.user) return false;
        return (
            c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <div className={styles.pageWrapper}>
            <Head>
                <title>Chat | LinkUps</title>
            </Head>
            <div className={styles.bgGlow}></div>

            {notification && (
                <div className={styles.notificationToast}>
                    {notification.type === "message" ? (
                        <MessageNotifIcon />
                    ) : (
                        <CheckCircleIcon />
                    )}
                    <span>{notification.msg}</span>
                </div>
            )}

            {infoMessage && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setInfoMessage(null)}
                >
                    <div
                        className={styles.infoCard}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Message Info</h3>
                        <div className={styles.infoRow}>
                            <label>Sent:</label>
                            <span>{formatDateFull(infoMessage.createdAt)}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <label>Delivered:</label>
                            <span>
                                {infoMessage.deliveredAt
                                    ? formatDateFull(infoMessage.deliveredAt)
                                    : "---"}
                            </span>
                        </div>
                        <div className={styles.infoRow}>
                            <label>Read:</label>
                            <span>
                                {infoMessage.readAt || infoMessage.isRead
                                    ? formatDateFull(
                                          infoMessage.readAt ||
                                              infoMessage.createdAt
                                      )
                                    : "---"}
                            </span>
                        </div>
                        <button onClick={() => setInfoMessage(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {deleteConfirmId && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setDeleteConfirmId(null)}
                >
                    <div
                        className={styles.infoCard}
                        onClick={(e) => e.stopPropagation()}
                        style={{ textAlign: "center" }}
                    >
                        <h3
                            style={{
                                color: "var(--neon-pink)",
                                borderBottom: "none",
                            }}
                        >
                            Confirm Deletion
                        </h3>
                        <p style={{ color: "#ccc", marginBottom: "20px" }}>
                            Delete this message permanently?
                        </p>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                style={{ background: "rgba(255,255,255,0.1)" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteMessage}
                                style={{ background: "var(--neon-pink)" }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isMounted ? (
                <div className={styles.messagingContainer}>
                    {/* SIDEBAR */}
                    <div
                        className={`${styles.sidebar} ${
                            showMobileChat ? styles.hiddenOnMobile : ""
                        }`}
                    >
                        <div className={styles.sidebarHeader}>
                            <h2 className={styles.headerTitle}>Messages</h2>
                            <button
                                className={styles.iconBtn}
                                onClick={() => router.push("/my_connections")}
                                title="New Chat"
                            >
                                <EditIcon />
                            </button>
                        </div>

                        <div className={styles.searchBar}>
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Search nodes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className={styles.conversationList}>
                            {filteredConversations.map((convo) => {
                                const user = convo.user;
                                const isOnline =
                                    onlineStatuses &&
                                    onlineStatuses[user._id]?.isOnline;
                                const lastSeenDate =
                                    (onlineStatuses &&
                                        onlineStatuses[user._id]?.lastSeen) ||
                                    user.lastSeen;
                                const unreadCount = convo.unreadCount || 0;
                                const lastMsg = convo.lastMessage;

                                return (
                                    <div
                                        key={user._id}
                                        className={`${
                                            styles.conversationItem
                                        } ${
                                            activeChat?._id === user._id
                                                ? styles.activeItem
                                                : ""
                                        }`}
                                        onClick={() => handleSelectChat(user)}
                                    >
                                        <div className={styles.avatarWrapper}>
                                            <img
                                                src={user.profilePicture}
                                                alt={user.name}
                                            />
                                            {isOnline && (
                                                <span
                                                    className={styles.onlineDot}
                                                ></span>
                                            )}
                                            {unreadCount > 0 && (
                                                <span
                                                    className={
                                                        styles.avatarBadge
                                                    }
                                                >
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.info}>
                                            <div className={styles.infoTop}>
                                                <h4>{user.name}</h4>
                                                <span
                                                    className={
                                                        isOnline
                                                            ? styles.statusOnline
                                                            : styles.statusOffline
                                                    }
                                                >
                                                    {isOnline
                                                        ? "Online"
                                                        : formatLastSeen(
                                                              lastSeenDate
                                                          )}
                                                </span>
                                            </div>
                                            <p
                                                className={
                                                    unreadCount > 0
                                                        ? styles.previewBold
                                                        : styles.preview
                                                }
                                            >
                                                {lastMsg
                                                    ? (lastMsg.sender ===
                                                      user._id
                                                          ? `You: ${lastMsg.message.substring(
                                                                0,
                                                                20
                                                            )}`
                                                          : lastMsg.message.substring(
                                                                0,
                                                                25
                                                            )) + "..."
                                                    : "Start a conversation"}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* CHAT WINDOW */}
                    <div
                        className={`${styles.chatWindow} ${
                            !showMobileChat ? styles.hiddenOnMobile : ""
                        }`}
                    >
                        {activeChat ? (
                            <>
                                <div className={styles.chatHeader}>
                                    <button
                                        className={styles.backBtn}
                                        onClick={handleBackToConversations}
                                    >
                                        <BackIcon />
                                    </button>
                                    <div
                                        className={styles.headerUserInfo}
                                        onClick={() =>
                                            router.push(
                                                `/view_profile/${activeChat.username}`
                                            )
                                        }
                                    >
                                        <div className={styles.headerAvatar}>
                                            <img
                                                src={activeChat.profilePicture}
                                                alt=""
                                            />
                                            {onlineStatuses &&
                                                onlineStatuses[activeChat._id]
                                                    ?.isOnline && (
                                                    <span
                                                        className={
                                                            styles.onlineDotSmall
                                                        }
                                                    ></span>
                                                )}
                                        </div>
                                        <div className={styles.headerText}>
                                            <h3>{activeChat.name}</h3>
                                            <span>@{activeChat.username}</span>
                                        </div>
                                    </div>
                                    <div className={styles.headerActions}>
                                        {isConnected && (
                                            <button
                                                className={styles.actionBtn}
                                                onClick={handleStartVideoCall}
                                                title="Video Call"
                                            >
                                                <VideoIcon />
                                            </button>
                                        )}
                                        <div style={{ position: "relative" }}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowHeaderMenu(
                                                        !showHeaderMenu
                                                    );
                                                }}
                                                title="Options"
                                            >
                                                <MoreVerticalIcon />
                                            </button>
                                            {showHeaderMenu && (
                                                <div
                                                    className={
                                                        styles.headerMenuDropdown
                                                    }
                                                >
                                                    <button
                                                        onClick={
                                                            handleClearChatHistory
                                                        }
                                                        className={
                                                            styles.clearChatBtn
                                                        }
                                                    >
                                                        <TrashIcon /> Clear Chat
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={styles.messagesContainer}
                                    ref={chatContainerRef}
                                >
                                    {messages.map((msg, index) => {
                                        const isMe =
                                            msg.sender ===
                                            auth.user?.userId?._id;
                                        const isDeleted = msg.isDeleted;
                                        const canEdit =
                                            isMe &&
                                            !isDeleted &&
                                            new Date() -
                                                new Date(msg.createdAt) <
                                                2 * 60 * 1000;
                                        const displayStatus = msg.isRead
                                            ? "read"
                                            : msg.status;

                                        return (
                                            <div
                                                key={index}
                                                className={`${
                                                    styles.messageRow
                                                } ${
                                                    isMe
                                                        ? styles.rowRight
                                                        : styles.rowLeft
                                                }`}
                                            >
                                                <div
                                                    className={`${
                                                        styles.bubbleWrapper
                                                    } ${
                                                        isMe
                                                            ? styles.wrapperRight
                                                            : ""
                                                    }`}
                                                >
                                                    <div
                                                        className={`${
                                                            styles.bubble
                                                        } ${
                                                            isMe
                                                                ? styles.bubbleMe
                                                                : styles.bubbleOther
                                                        } ${
                                                            isDeleted
                                                                ? styles.deletedBubble
                                                                : ""
                                                        }`}
                                                    >
                                                        {editingMessageId ===
                                                        msg._id ? (
                                                            <div
                                                                className={
                                                                    styles.editInputGroup
                                                                }
                                                            >
                                                                <input
                                                                    value={
                                                                        editInput
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setEditInput(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    onClick={
                                                                        submitEdit
                                                                    }
                                                                    className={
                                                                        styles.saveEditBtn
                                                                    }
                                                                >
                                                                    <CheckIcon />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setEditingMessageId(
                                                                            null
                                                                        )
                                                                    }
                                                                    className={
                                                                        styles.cancelEditBtn
                                                                    }
                                                                >
                                                                    <XIcon />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {msg.message}
                                                                {msg.isEdited &&
                                                                    !isDeleted && (
                                                                        <span
                                                                            className={
                                                                                styles.editedTag
                                                                            }
                                                                        >
                                                                            (edited)
                                                                        </span>
                                                                    )}
                                                            </>
                                                        )}
                                                        <div
                                                            className={
                                                                styles.metaRow
                                                            }
                                                        >
                                                            <span
                                                                className={
                                                                    styles.time
                                                                }
                                                            >
                                                                {getTimeAgo(
                                                                    msg.createdAt
                                                                )}
                                                            </span>
                                                            {/* TICKS */}
                                                            {isMe &&
                                                                !isDeleted && (
                                                                    <span
                                                                        className={`${
                                                                            styles.tick
                                                                        } ${
                                                                            displayStatus ===
                                                                            "read"
                                                                                ? styles.tickBlue
                                                                                : styles.tickGrey
                                                                        }`}
                                                                    >
                                                                        {displayStatus ===
                                                                        "sent" ? (
                                                                            <SingleTick />
                                                                        ) : (
                                                                            <DoubleTickIcon />
                                                                        )}
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </div>

                                                    {/* Menu */}
                                                    {isMe && (
                                                        <div
                                                            className={
                                                                styles.menuContainer
                                                            }
                                                        >
                                                            <button
                                                                className={
                                                                    styles.menuTrigger
                                                                }
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setActiveMessageId(
                                                                        activeMessageId ===
                                                                            msg._id
                                                                            ? null
                                                                            : msg._id
                                                                    );
                                                                }}
                                                            >
                                                                <MoreVerticalIcon />
                                                            </button>
                                                            {activeMessageId ===
                                                                msg._id && (
                                                                <div
                                                                    className={
                                                                        styles.messageMenu
                                                                    }
                                                                >
                                                                    {!isDeleted && (
                                                                        <button
                                                                            onClick={(
                                                                                e
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                handleInfoClick(
                                                                                    msg
                                                                                );
                                                                            }}
                                                                        >
                                                                            <InfoIcon />{" "}
                                                                            Info
                                                                        </button>
                                                                    )}
                                                                    {canEdit && (
                                                                        <button
                                                                            onClick={(
                                                                                e
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                startEditing(
                                                                                    msg
                                                                                );
                                                                            }}
                                                                        >
                                                                            <EditIcon />{" "}
                                                                            Edit
                                                                        </button>
                                                                    )}
                                                                    {!isDeleted ? (
                                                                        <button
                                                                            onClick={(
                                                                                e
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteClick(
                                                                                    msg._id
                                                                                );
                                                                            }}
                                                                            className={
                                                                                styles.deleteOption
                                                                            }
                                                                        >
                                                                            <TrashIcon />{" "}
                                                                            Delete
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={(
                                                                                e
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                handleClearMessage(
                                                                                    msg._id
                                                                                );
                                                                            }}
                                                                        >
                                                                            <XIcon />{" "}
                                                                            Clear
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className={styles.inputArea}>
                                    <div className={styles.inputWrapper}>
                                        <textarea
                                            value={inputText}
                                            onChange={(e) =>
                                                setInputText(e.target.value)
                                            }
                                            placeholder="Transmit message..."
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                !e.shiftKey &&
                                                handleSendMessage()
                                            }
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!inputText.trim()}
                                            className={styles.sendBtn}
                                        >
                                            <SendIcon />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIconWrapper}>
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1}
                                        width="64"
                                        height="64"
                                    >
                                        <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                </div>
                                <h3>Secure Channel Ready</h3>
                                <p>
                                    Select a node from the list to initialize
                                    encrypted communication.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <p style={{ color: "var(--neon-teal)" }}>Connecting...</p>
                </div>
            )}
        </div>
    );
}

MessagingPage.getLayout = function getLayout(page) {
    return <UserLayout>{page}</UserLayout>;
};
