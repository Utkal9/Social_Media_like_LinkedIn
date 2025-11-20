import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
} from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

// This component will show the pop-up
const IncomingCallHandler = ({ socket }) => {
    const [call, setCall] = useState(null);

    useEffect(() => {
        if (!socket) return;

        socket.on("incoming-call", ({ fromUser, roomUrl }) => {
            setCall({ fromUser, roomUrl });
        });

        return () => {
            socket.off("incoming-call");
        };
    }, [socket]);

    const joinCall = () => {
        window.open(call.roomUrl, "_blank");
        setCall(null);
    };

    const declineCall = () => {
        setCall(null);
    };

    if (!call) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <img
                    src={call.fromUser.profilePicture}
                    alt="caller"
                    style={styles.profilePic}
                />
                <h3>{call.fromUser.name} is calling...</h3>
                <p>@{call.fromUser.username}</p>
                <div style={styles.buttonGroup}>
                    <button onClick={declineCall} style={styles.declineButton}>
                        Decline
                    </button>
                    <button onClick={joinCall} style={styles.acceptButton}>
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineStatuses, setOnlineStatuses] = useState({});
    const auth = useSelector((state) => state.auth);
    const socketInstance = useRef(null);

    useEffect(() => {
        if (socketInstance.current) return;

        const newSocket = io(
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090",
            {
                transports: ["polling", "websocket"],
                autoConnect: false,
            }
        );

        socketInstance.current = newSocket;
        setSocket(newSocket);

        newSocket.connect();

        newSocket.on("connect", () => {
            if (auth.user?.userId?._id) {
                newSocket.emit("register-user", auth.user.userId._id);
            }
        });
        newSocket.on("user-status-change", ({ userId, isOnline, lastSeen }) => {
            setOnlineStatuses((prev) => ({
                ...prev,
                [userId]: { isOnline, lastSeen },
            }));
        });

        return () => {
            newSocket.disconnect();
            socketInstance.current = null;
        };
    }, []);

    useEffect(() => {
        if (socket && auth.user?.userId?._id) {
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("register-user", auth.user.userId._id);
        }
    }, [socket, auth.user]);

    return (
        <SocketContext.Provider
            value={{ socket, onlineStatuses, setOnlineStatuses }}
        >
            <IncomingCallHandler socket={socket} />
            {children}
        </SocketContext.Provider>
    );
};

// --- Styles for the modal ---
const styles = {
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        fontFamily: "'Inter', sans-serif",
    },
    modalContent: {
        backgroundColor: "white",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        textAlign: "center",
        width: "320px",
    },
    profilePic: {
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        objectFit: "cover",
        marginBottom: "12px",
    },
    buttonGroup: {
        marginTop: "24px",
        display: "flex",
        justifyContent: "space-between",
    },
    acceptButton: {
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: 600,
    },
    declineButton: {
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: 600,
    },
};
