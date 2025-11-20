// frontend/src/pages/messaging/index.jsx
import React, { useEffect, useState, useRef } from "react";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import clientServer from "@/config";
import { useSelector } from "react-redux";
import { useSocket } from "@/context/SocketContext";
import styles from "./index.module.css";
import { useRouter } from "next/router"; // Import router

function MessagingPage() {
    const router = useRouter(); // Get router
    const auth = useSelector((state) => state.auth);
    const socket = useSocket();

    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);

    // 1. Fetch Sidebar Conversations
    useEffect(() => {
        const fetchConversations = async () => {
            if (auth.isTokenThere) {
                const res = await clientServer.get("/messages/conversations", {
                    params: { token: localStorage.getItem("token") },
                });
                setConversations(res.data);
            }
        };
        fetchConversations();
    }, [auth.isTokenThere]);

    // --- NEW: Handle URL Query for "Start Chat" ---
    // If url is /messaging?chatWith=username, load that user
    useEffect(() => {
        if (!router.isReady || !auth.isTokenThere) return;

        const { chatWith } = router.query; // Expecting username

        if (chatWith) {
            // 1. Check if we already have a conversation with them
            const existingChat = conversations.find(
                (c) => c.username === chatWith
            );
            if (existingChat) {
                setActiveChat(existingChat);
            } else {
                // 2. If not, fetch their details manually
                const fetchTargetUser = async () => {
                    try {
                        const res = await clientServer.get(
                            "/user/get_profile_based_on_username",
                            {
                                params: { username: chatWith },
                            }
                        );
                        // The API returns { profile: { ... userId: { name, username ... } } }
                        // We need to flatten it to match the conversation object structure
                        const targetUser = res.data.profile.userId;

                        // Add to conversation list temporarily (UI only)
                        setConversations((prev) => {
                            // Prevent duplicates if effect runs twice
                            if (prev.find((c) => c._id === targetUser._id))
                                return prev;
                            return [targetUser, ...prev];
                        });
                        setActiveChat(targetUser);
                    } catch (err) {
                        console.error(
                            "Could not fetch user to chat with:",
                            err
                        );
                    }
                };
                fetchTargetUser();
            }
        }
    }, [router.isReady, router.query, conversations, auth.isTokenThere]);
    // ---------------------------------------------

    // 2. Fetch Messages when activeChat changes
    useEffect(() => {
        if (!activeChat) return;
        const fetchMessages = async () => {
            const res = await clientServer.get("/messages/get", {
                params: {
                    token: localStorage.getItem("token"),
                    otherUserId: activeChat._id,
                },
            });
            setMessages(res.data);
            scrollToBottom();
        };
        fetchMessages();
    }, [activeChat]);

    // 3. Listen for Incoming Messages
    useEffect(() => {
        if (!socket) return;
        const handleReceiveMessage = (data) => {
            if (activeChat && data.sender === activeChat._id) {
                setMessages((prev) => [...prev, data]);
                scrollToBottom();
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

        const myId = auth.user.userId._id;

        const newMsg = {
            sender: myId,
            receiver: activeChat._id,
            message: inputText,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
        scrollToBottom();

        await clientServer.post("/messages/send", {
            token: localStorage.getItem("token"),
            toUserId: activeChat._id,
            message: newMsg.message,
        });

        socket.emit("send-chat-message", {
            senderId: myId,
            receiverId: activeChat._id,
            message: newMsg.message,
        });
    };

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h3>Messaging</h3>
                    <input
                        type="text"
                        placeholder="Search messages"
                        className={styles.searchBar}
                    />
                </div>
                <div className={styles.conversationList}>
                    {conversations.map((user) => (
                        <div
                            key={user._id}
                            className={`${styles.conversationItem} ${
                                activeChat?._id === user._id
                                    ? styles.active
                                    : ""
                            }`}
                            onClick={() => {
                                setActiveChat(user);
                                // Optional: Clear URL query to keep it clean
                                // router.push("/messaging", undefined, { shallow: true });
                            }}
                        >
                            <img
                                src={user.profilePicture}
                                alt=""
                                className={styles.avatar}
                            />
                            <div className={styles.info}>
                                <h4>{user.name}</h4>
                                <p>@{user.username}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={styles.chatArea}>
                {activeChat ? (
                    <>
                        <div className={styles.chatHeader}>
                            <div className={styles.chatHeaderInfo}>
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
                                <span>@{activeChat.username}</span>
                            </div>
                        </div>
                        <div className={styles.messagesList}>
                            {messages.map((msg, index) => {
                                const isMe =
                                    msg.sender === auth.user.userId._id;
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
                                onKeyPress={(e) =>
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
