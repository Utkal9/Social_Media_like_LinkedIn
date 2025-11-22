// frontend/src/pages/messaging/index.jsx
import React, { useEffect, useState, useRef } from "react";
import UserLayout from "@/layout/UserLayout";
import clientServer from "@/config";
import { useSelector } from "react-redux";
import { useSocket } from "@/context/SocketContext";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import Head from "next/head";

const VIDEO_CALL_URL =
    process.env.NEXT_PUBLIC_VIDEO_CALL_URL || "http://localhost:3001";

// --- Holo Icons ---
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
const MoreIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24">
        <path
            fillRule="evenodd"
            d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
            clipRule="evenodd"
        />
    </svg>
);
const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20">
        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
);

const getTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function MessagingPage() {
    const router = useRouter();
    const auth = useSelector((state) => state.auth);
    const { socket, onlineStatuses, setOnlineStatuses } = useSocket() || {};

    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showMobileChat, setShowMobileChat] = useState(false); // Controls mobile view
    const messagesEndRef = useRef(null);

    // Fetch Conversations
    const fetchConversations = async () => {
        if (auth.isTokenThere) {
            try {
                const res = await clientServer.get("/messages/conversations", {
                    params: { token: localStorage.getItem("token") },
                });
                setConversations(res.data);

                // Update online statuses from fetched data initially
                const initialStatuses = {};
                res.data.forEach((user) => {
                    initialStatuses[user._id] = {
                        isOnline: user.isOnline,
                        lastSeen: user.lastSeen,
                    };
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
        fetchConversations();
    }, [auth.isTokenThere]);

    // Handle "Chat With" URL param
    useEffect(() => {
        if (!router.isReady || !auth.isTokenThere) return;
        const { chatWith } = router.query;
        if (chatWith) {
            const existingChat = conversations.find(
                (c) => c.username === chatWith
            );
            if (existingChat) {
                handleSelectChat(existingChat);
            } else {
                // Fetch new user if not in list
                const fetchTargetUser = async () => {
                    try {
                        const res = await clientServer.get(
                            "/user/get_profile_based_on_username",
                            { params: { username: chatWith } }
                        );
                        const targetUser = res.data.profile.userId;
                        setConversations((prev) => {
                            if (prev.find((c) => c._id === targetUser._id))
                                return prev;
                            return [targetUser, ...prev];
                        });
                        handleSelectChat(targetUser);
                    } catch (err) {
                        console.error(err);
                    }
                };
                fetchTargetUser();
            }
        }
    }, [router.isReady, router.query, auth.isTokenThere, conversations.length]);

    // Fetch Messages
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
            } catch (err) {
                console.error(err);
            }
        };
        fetchMessages();
    }, [activeChat]);

    // Socket Listener
    useEffect(() => {
        if (!socket) return;
        const handleReceiveMessage = (data) => {
            if (activeChat && data.sender === activeChat._id) {
                setMessages((prev) => [...prev, data]);
                scrollToBottom();
            } else {
                fetchConversations(); // Refresh list to show new message indicator (if we had one)
            }
        };
        socket.on("receive-chat-message", handleReceiveMessage);
        return () => {
            socket.off("receive-chat-message", handleReceiveMessage);
        };
    }, [socket, activeChat]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSelectChat = (user) => {
        setActiveChat(user);
        setShowMobileChat(true);
        // Clear query param so back button doesn't re-trigger
        if (router.query.chatWith) {
            router.replace("/messaging", undefined, { shallow: true });
        }
    };

    const handleBackToConversations = () => {
        setShowMobileChat(false);
        setActiveChat(null);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeChat) return;
        const myId = auth.user?.userId?._id;
        if (!myId) return;

        const newMsg = {
            sender: myId,
            receiver: activeChat._id,
            message: inputText,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
        scrollToBottom();

        try {
            await clientServer.post("/messages/send", {
                token: localStorage.getItem("token"),
                toUserId: activeChat._id,
                message: newMsg.message,
            });
            if (socket) {
                socket.emit("send-chat-message", {
                    senderId: myId,
                    receiverId: activeChat._id,
                    message: newMsg.message,
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleStartVideoCall = () => {
        if (!activeChat || !auth.user?.userId || !socket) return;
        const roomId = [auth.user.userId._id, activeChat._id].sort().join("-");
        const baseRoomUrl = `${VIDEO_CALL_URL}/${roomId}`;
        const returnUrl = `${window.location.origin}/dashboard`;
        const roomUrlWithRedirect = `${baseRoomUrl}?redirect_url=${encodeURIComponent(
            returnUrl
        )}`;

        socket.emit("start-call", {
            fromUser: auth.user.userId,
            toUserId: activeChat._id,
            roomUrl: roomUrlWithRedirect,
        });
        window.open(roomUrlWithRedirect, "_blank");
    };

    const filteredConversations = conversations.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.pageWrapper}>
            <Head>
                <title>Chat | LinkUps</title>
            </Head>
            <div className={styles.bgGlow}></div>

            <div className={styles.messagingContainer}>
                {/* --- Sidebar (Conversation List) --- */}
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
                        {filteredConversations.map((user) => {
                            const isOnline =
                                onlineStatuses &&
                                onlineStatuses[user._id]?.isOnline;
                            return (
                                <div
                                    key={user._id}
                                    className={`${styles.conversationItem} ${
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
                                    </div>
                                    <div className={styles.info}>
                                        <h4>{user.name}</h4>
                                        <p>{isOnline ? "Online" : "Offline"}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- Chat Window --- */}
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
                                    <button
                                        className={styles.actionBtn}
                                        onClick={handleStartVideoCall}
                                        title="Video Call"
                                    >
                                        <VideoIcon />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.messagesContainer}>
                                {messages.map((msg, index) => {
                                    const isMe =
                                        msg.sender === auth.user?.userId?._id;
                                    return (
                                        <div
                                            key={index}
                                            className={`${styles.messageRow} ${
                                                isMe
                                                    ? styles.rowRight
                                                    : styles.rowLeft
                                            }`}
                                        >
                                            <div
                                                className={`${styles.bubble} ${
                                                    isMe
                                                        ? styles.bubbleMe
                                                        : styles.bubbleOther
                                                }`}
                                            >
                                                {msg.message}
                                                <span className={styles.time}>
                                                    {getTimeAgo(msg.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
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
        </div>
    );
}

MessagingPage.getLayout = function getLayout(page) {
    return <UserLayout>{page}</UserLayout>;
};
