// frontend/src/pages/messaging/index.jsx
import React, { useEffect, useState, useRef } from "react";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import clientServer from "@/config";
import { useSelector } from "react-redux";
import { useSocket } from "@/context/SocketContext";
import styles from "./index.module.css";
import { useRouter } from "next/router";

// --- ICONS ---
const SearchIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={styles.searchIcon}
    >
        <path
            fillRule="evenodd"
            d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
            clipRule="evenodd"
        />
    </svg>
);
const MoreIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: 24, height: 24 }}
    >
        <path
            fillRule="evenodd"
            d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
            clipRule="evenodd"
        />
    </svg>
);
const EditIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: 20, height: 20 }}
    >
        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
);
const VideoIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: 24, height: 24, color: "#666" }}
    >
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
    </svg>
);
const SendIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: 18, height: 18 }}
    >
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);
const EmptyStateIllustration = () => (
    <svg
        width="160"
        height="160"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="100" cy="100" r="90" fill="#F3F6F8" />
        <path
            d="M65 75C65 66.7157 71.7157 60 80 60H120C128.284 60 135 66.7157 135 75V105C135 113.284 128.284 120 120 120H85L65 140V75Z"
            fill="white"
            stroke="#E0E0E0"
            strokeWidth="4"
        />
        <path
            d="M80 85H120"
            stroke="#A0A0A0"
            strokeWidth="4"
            strokeLinecap="round"
        />
        <path
            d="M80 100H105"
            stroke="#A0A0A0"
            strokeWidth="4"
            strokeLinecap="round"
        />
    </svg>
);

// --- HELPER ---
function getTimeAgo(dateString) {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
}

function MessagingPage() {
    const router = useRouter();
    const auth = useSelector((state) => state.auth);
    const { socket, onlineStatuses, setOnlineStatuses } = useSocket() || {};

    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showMenu, setShowMenu] = useState(false); // For 3-dots menu
    const messagesEndRef = useRef(null);

    const fetchConversations = async () => {
        if (auth.isTokenThere) {
            try {
                const res = await clientServer.get("/messages/conversations", {
                    params: { token: localStorage.getItem("token") },
                });
                setConversations(res.data);

                // Update online statuses based on fetched data
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

    // Handle direct link to chat
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
                            { params: { username: chatWith } }
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
    }, [router.isReady, router.query, auth.isTokenThere, conversations.length]);

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

    // --- NEW FUNCTIONALITY HANDLERS ---
    const handleCreateNewMessage = () => {
        // Redirect to My Connections to start a new chat with a connection
        router.push("/my_connections");
    };

    const handleMenuOption = (option) => {
        if (option === "refresh") {
            fetchConversations();
        } else if (option === "network") {
            router.push("/my_connections");
        }
        setShowMenu(false);
    };

    // Filter users based on search query
    const filteredConversations = conversations.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.headerTop}>
                        <h3>Messaging</h3>
                        <div
                            style={{
                                display: "flex",
                                gap: "5px",
                                position: "relative",
                            }}
                        >
                            {/* Edit Icon: Create New Message */}
                            <button
                                className={styles.iconBtn}
                                onClick={handleCreateNewMessage}
                                title="Start new conversation"
                            >
                                <EditIcon />
                            </button>

                            {/* More Icon: Dropdown Menu */}
                            <button
                                className={styles.iconBtn}
                                onClick={() => setShowMenu(!showMenu)}
                                title="Options"
                            >
                                <MoreIcon />
                            </button>

                            {/* Dropdown Menu */}
                            {showMenu && (
                                <div className={styles.dropdownMenu}>
                                    <div
                                        className={styles.dropdownItem}
                                        onClick={() =>
                                            handleMenuOption("refresh")
                                        }
                                    >
                                        Refresh List
                                    </div>
                                    <div
                                        className={styles.dropdownItem}
                                        onClick={() =>
                                            handleMenuOption("network")
                                        }
                                    >
                                        Manage Connections
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.searchContainer}>
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search messages"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.conversationList}>
                    {filteredConversations.length === 0 && searchQuery && (
                        <p className={styles.noResults}>No results found.</p>
                    )}
                    {filteredConversations.map((user) => {
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
                                            Active now
                                        </p>
                                    ) : (
                                        <p className={styles.statusText}>
                                            Last seen{" "}
                                            {statusData.lastSeen
                                                ? getTimeAgo(
                                                      statusData.lastSeen
                                                  )
                                                : ""}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat Area */}
            <div className={styles.chatArea}>
                {activeChat ? (
                    <>
                        <div className={styles.chatHeader}>
                            <div className={styles.chatHeaderInfo}>
                                <div
                                    className={styles.avatarContainer}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        cursor: "pointer",
                                    }}
                                    onClick={() =>
                                        router.push(
                                            `/view_profile/${activeChat.username}`
                                        )
                                    }
                                >
                                    <img
                                        src={activeChat.profilePicture}
                                        alt=""
                                        className={styles.avatar}
                                    />
                                </div>
                                <div className={styles.headerText}>
                                    <h3
                                        onClick={() =>
                                            router.push(
                                                `/view_profile/${activeChat.username}`
                                            )
                                        }
                                    >
                                        {activeChat.name}
                                    </h3>
                                    {onlineStatuses &&
                                    onlineStatuses[activeChat._id]?.isOnline ? (
                                        <span
                                            style={{
                                                color: "#057642",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Active now
                                        </span>
                                    ) : (
                                        <span className={styles.headerStatus}>
                                            @{activeChat.username}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.headerActions}>
                                {/* Video Call Button */}
                                <button
                                    className={styles.iconBtn}
                                    title="Video Call"
                                    onClick={() => {
                                        // Just redirect to My Connections where calls are initiated, or start a call directly if you have the logic here
                                        // For consistency with your My Connections logic:
                                        alert(
                                            "Please go to 'My Network' to start a video call with this user."
                                        );
                                        router.push("/my_connections");
                                    }}
                                >
                                    <VideoIcon />
                                </button>
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
                                        <p>{msg.message}</p>
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
                                disabled={!inputText.trim()}
                            >
                                Send <SendIcon />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <EmptyStateIllustration />
                        <h3>Select a conversation</h3>
                        <p>
                            Choose a connection from the left list to start
                            chatting.
                        </p>
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
