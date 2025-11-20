// frontend/src/pages/messaging/index.jsx
import React, { useEffect, useState, useRef } from "react";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import clientServer from "@/config";
import { useSelector } from "react-redux";
import { useSocket } from "@/context/SocketContext";
import styles from "./index.module.css";
import { useRouter } from "next/router";

// --- UPDATED HELPER ---
function getTimeAgo(dateString) {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

    // Precise seconds logic
    if (diffInSeconds < 60) {
        return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
}
// ----------------------

function MessagingPage() {
    const router = useRouter();
    const auth = useSelector((state) => state.auth);
    const { socket, onlineStatuses, setOnlineStatuses } = useSocket() || {};

    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);

    const fetchConversations = async () => {
        if (auth.isTokenThere) {
            try {
                const res = await clientServer.get("/messages/conversations", {
                    params: { token: localStorage.getItem("token") },
                });
                setConversations(res.data);

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

    useEffect(() => {
        if (!router.isReady || !auth.isTokenThere) return;
        const { chatWith } = router.query;
        if (chatWith) {
            const existingChat = conversations.find(
                (c) => c.username === chatWith
            );
            if (existingChat) {
                setActiveChat(existingChat);
            } else {
                const fetchTargetUser = async () => {
                    try {
                        const res = await clientServer.get(
                            "/user/get_profile_based_on_username",
                            {
                                params: { username: chatWith },
                            }
                        );
                        const targetUser = res.data.profile.userId;
                        setConversations((prev) => {
                            if (prev.find((c) => c._id === targetUser._id))
                                return prev;
                            return [targetUser, ...prev];
                        });
                        setActiveChat(targetUser);
                    } catch (err) {
                        console.error("Could not fetch user:", err);
                    }
                };
                fetchTargetUser();
            }
        }
    }, [router.isReady, router.query, auth.isTokenThere]);

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

    useEffect(() => {
        if (!socket) return;
        const handleReceiveMessage = (data) => {
            if (activeChat && data.sender === activeChat._id) {
                setMessages((prev) => [...prev, data]);
                scrollToBottom();
            } else {
                fetchConversations();
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
            console.error("Failed to send message", err);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h3>Messaging</h3>
                </div>
                <div className={styles.conversationList}>
                    {conversations.map((user) => {
                        const statusData =
                            onlineStatuses && onlineStatuses[user._id]
                                ? onlineStatuses[user._id]
                                : {
                                      isOnline: user.isOnline,
                                      lastSeen: user.lastSeen,
                                  };
                        const isOnline = statusData.isOnline;

                        return (
                            <div
                                key={user._id}
                                className={`${styles.conversationItem} ${
                                    activeChat?._id === user._id
                                        ? styles.active
                                        : ""
                                }`}
                                onClick={() => setActiveChat(user)}
                            >
                                <div className={styles.avatarContainer}>
                                    <img
                                        src={user.profilePicture}
                                        alt=""
                                        className={styles.avatar}
                                    />
                                    {isOnline && (
                                        <span
                                            className={styles.onlineDot}
                                        ></span>
                                    )}
                                </div>
                                <div className={styles.info}>
                                    <h4>{user.name}</h4>
                                    {isOnline ? (
                                        <p
                                            className={`${styles.statusText} ${styles.online}`}
                                        >
                                            Available
                                        </p>
                                    ) : (
                                        <p className={styles.statusText}>
                                            {statusData.lastSeen
                                                ? getTimeAgo(
                                                      statusData.lastSeen
                                                  )
                                                : "Offline"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className={styles.chatArea}>
                {activeChat ? (
                    <>
                        <div className={styles.chatHeader}>
                            <div className={styles.chatHeaderInfo}>
                                <div>
                                    <h3
                                        onClick={() =>
                                            router.push(
                                                `/view_profile/${activeChat.username}`
                                            )
                                        }
                                        style={{ cursor: "pointer" }}
                                    >
                                        {activeChat.name}
                                    </h3>
                                    {onlineStatuses &&
                                    onlineStatuses[activeChat._id]?.isOnline ? (
                                        <span
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "#057642",
                                            }}
                                        >
                                            Active now
                                        </span>
                                    ) : (
                                        <span
                                            style={{
                                                fontSize: "0.8rem",
                                                color: "#666",
                                            }}
                                        >
                                            Last seen{" "}
                                            {getTimeAgo(
                                                onlineStatuses &&
                                                    onlineStatuses[
                                                        activeChat._id
                                                    ]?.lastSeen
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={styles.messagesList}>
                            {messages.map((msg, index) => {
                                const isMe =
                                    msg.sender === auth.user?.userId?._id;
                                return (
                                    <div
                                        key={index}
                                        className={`${styles.messageBubble} ${
                                            isMe ? styles.sent : styles.received
                                        }`}
                                    >
                                        {msg.message}
                                        <span className={styles.timestamp}>
                                            {new Date(
                                                msg.createdAt
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className={styles.inputArea}>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Write a message..."
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    !e.shiftKey &&
                                    handleSendMessage()
                                }
                            />
                            <button
                                onClick={handleSendMessage}
                                className={styles.sendButton}
                            >
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                        }}
                    >
                        <h3>Select a conversation to start messaging</h3>
                    </div>
                )}
            </div>
        </div>
    );
}

MessagingPage.getLayout = function getLayout(page) {
    return (
        <UserLayout>
            <DashboardLayout>{page}</DashboardLayout>
        </UserLayout>
    );
};

export default MessagingPage;
