import React, { useEffect, useRef, useState, memo } from "react";
import io from "socket.io-client";
import styles from "@/styles/videoComponent.module.css";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import Head from "next/head";
import UserLayout from "@/layout/UserLayout";

const server_url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";

const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// --- ICONS ---
const VideoIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24">
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
    </svg>
);
const VideoOffIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24">
        <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
    </svg>
);
const MicIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
);
const MicOffIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24">
        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 2.76 2.24 5 5 5 .52 0 1.03-.08 1.5-.23L18.73 19l1.27-1.27L4.27 3zM12 19c-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
);
const CallEndIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28">
        <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
    </svg>
);
const ScreenIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24">
        <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
    </svg>
);
const StopScreenIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24">
        <path d="M21.22 18.02l2 2H24v-2h-.78zM3.27 2L2 3.27 4.73 6H4c-1.11 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4.73l1.73-1.73c.33-.08.6-.27.78-.55.18-.27.22-.58.1-.88L3.27 2zM4 6.55L17.45 20H4V6.55z" />
    </svg>
);
const ChatIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
    </svg>
);
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
);
const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
);

const createBlackSilence = () => {
    try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        const videoTrack = Object.assign(dst.stream.getVideoTracks()[0], {
            enabled: false,
        });
        return new MediaStream([videoTrack]);
    } catch (e) {
        return new MediaStream();
    }
};

const RemoteVideo = memo(function RemoteVideo({ stream, label, className }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream;
    }, [stream]);
    return (
        <div className={className || styles.videoTile}>
            <video
                ref={ref}
                autoPlay
                playsInline
                className={styles.videoElement}
            />
            <div className={styles.userLabel}>{label}</div>
        </div>
    );
});

export default function MeetingRoom() {
    const router = useRouter();
    const { roomId, returnTo } = router.query;
    const authState = useSelector((state) => state.auth);

    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoRef = useRef(null);
    const connectionsRef = useRef({});
    const localStreamRef = useRef(null);
    const previewRef = useRef(null);
    const chatScrollRef = useRef(null);

    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [joined, setJoined] = useState(false);
    const [videos, setVideos] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [showChat, setShowChat] = useState(false);

    const [localStreamState, setLocalStreamState] = useState(null);
    useEffect(() => {
        localStreamRef.current = localStreamState;
    }, [localStreamState]);
    const getLocalStream = () => localStreamRef.current || createBlackSilence();

    useEffect(() => {
        if (!router.isReady) return;
        if (authState.user?.userId?.name && !username)
            setUsername(authState.user.userId.name);
        setScreenAvailable(!!navigator.mediaDevices?.getDisplayMedia);

        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                window.localStream = stream;
                setLocalStreamState(stream);
                if (previewRef.current) previewRef.current.srcObject = stream;
            } catch (e) {
                const black = createBlackSilence();
                setLocalStreamState(black);
                if (previewRef.current) previewRef.current.srcObject = black;
            }
        };
        initMedia();

        return () => {
            if (window.localStream)
                window.localStream.getTracks().forEach((t) => t.stop());
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [router.isReady, authState.user]);

    const connectToSocket = () => {
        if (socketRef.current) return;

        socketRef.current = io.connect(server_url);

        socketRef.current.on("connect", () => {
            socketIdRef.current = socketRef.current.id;
            const myUserId = authState.user?.userId?._id;
            socketRef.current.emit("join-call", roomId, myUserId);
        });

        socketRef.current.on("call-denied", (reason) => {
            alert(reason);
            const backPath = returnTo
                ? decodeURIComponent(returnTo)
                : "/dashboard";
            router.push(backPath);
        });

        socketRef.current.on("signal", handleSignal);

        socketRef.current.on("video-chat-message", (data, sender, senderId) => {
            if (senderId !== socketIdRef.current) {
                setMessages((prev) => [
                    ...prev,
                    { sender, data, socketIdSender: senderId },
                ]);
            }
        });

        socketRef.current.on("user-left", (id) => {
            setVideos((prev) => prev.filter((v) => v.socketId !== id));
            if (connectionsRef.current[id]) {
                connectionsRef.current[id].close();
                delete connectionsRef.current[id];
            }
        });

        socketRef.current.on("user-joined", (id, clients) => {
            const localStream = getLocalStream();
            clients.forEach((clientId) => {
                if (clientId === socketIdRef.current) return;

                if (!connectionsRef.current[clientId]) {
                    const pc = new RTCPeerConnection(peerConfigConnections);
                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit(
                                "signal",
                                clientId,
                                JSON.stringify({ ice: event.candidate })
                            );
                        }
                    };
                    pc.ontrack = (ev) => {
                        setVideos((prev) => {
                            if (prev.find((p) => p.socketId === clientId))
                                return prev;
                            return [
                                ...prev,
                                { socketId: clientId, stream: ev.streams[0] },
                            ];
                        });
                    };
                    localStream
                        .getTracks()
                        .forEach((t) => pc.addTrack(t, localStream));
                    connectionsRef.current[clientId] = pc;
                }
            });

            if (id === socketIdRef.current) {
                clients.forEach((otherId) => {
                    if (otherId === socketIdRef.current) return;
                    const pc = connectionsRef.current[otherId];
                    if (pc) {
                        pc.createOffer()
                            .then((desc) => pc.setLocalDescription(desc))
                            .then(() => {
                                socketRef.current.emit(
                                    "signal",
                                    otherId,
                                    JSON.stringify({ sdp: pc.localDescription })
                                );
                            });
                    }
                });
            }
        });
    };

    const handleSignal = async (fromId, message) => {
        if (fromId === socketIdRef.current) return;
        const signal = JSON.parse(message);

        if (!connectionsRef.current[fromId]) {
            const pc = new RTCPeerConnection(peerConfigConnections);
            pc.onicecandidate = (event) => {
                if (event.candidate)
                    socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({ ice: event.candidate })
                    );
            };
            pc.ontrack = (ev) => {
                setVideos((prev) => [
                    ...prev,
                    { socketId: fromId, stream: ev.streams[0] },
                ]);
            };
            const localStream = getLocalStream();
            localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
            connectionsRef.current[fromId] = pc;
        }

        const pc = connectionsRef.current[fromId];
        if (signal.sdp) {
            await pc.setRemoteDescription(
                new RTCSessionDescription(signal.sdp)
            );
            if (signal.sdp.type === "offer") {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socketRef.current.emit(
                    "signal",
                    fromId,
                    JSON.stringify({ sdp: pc.localDescription })
                );
            }
        }
        if (signal.ice) {
            await pc
                .addIceCandidate(new RTCIceCandidate(signal.ice))
                .catch((e) => {});
        }
    };

    const joinMeeting = () => {
        if (!username.trim()) return alert("Name required");
        setAskForUsername(false);
        setJoined(true);
        connectToSocket();
        setTimeout(() => {
            if (localVideoRef.current && localStreamRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }
        }, 100);
    };

    const toggleVideo = () => {
        setVideoEnabled((prev) => {
            const next = !prev;
            const s = getLocalStream();
            s.getVideoTracks().forEach((t) => (t.enabled = next));
            setLocalStreamState(s);
            return next;
        });
    };

    const toggleAudio = () => {
        setAudioEnabled((prev) => {
            const next = !prev;
            const s = getLocalStream();
            s.getAudioTracks().forEach((t) => (t.enabled = next));
            setLocalStreamState(s);
            return next;
        });
    };

    const toggleScreen = async () => {
        if (!screenSharing) {
            try {
                const screenStream =
                    await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                    });
                const videoTrack = screenStream.getVideoTracks()[0];
                Object.values(connectionsRef.current).forEach((pc) => {
                    const sender = pc
                        .getSenders()
                        .find((s) => s.track.kind === "video");
                    if (sender) sender.replaceTrack(videoTrack);
                });
                videoTrack.onended = () => toggleScreen();
                setLocalStreamState(screenStream);
                if (localVideoRef.current)
                    localVideoRef.current.srcObject = screenStream;
                setScreenSharing(true);
            } catch (e) {}
        } else {
            const camStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            const videoTrack = camStream.getVideoTracks()[0];
            Object.values(connectionsRef.current).forEach((pc) => {
                const sender = pc
                    .getSenders()
                    .find((s) => s.track.kind === "video");
                if (sender) sender.replaceTrack(videoTrack);
            });
            setLocalStreamState(camStream);
            if (localVideoRef.current)
                localVideoRef.current.srcObject = camStream;
            setScreenSharing(false);
        }
    };

    const endCall = () => {
        if (localStreamRef.current)
            localStreamRef.current.getTracks().forEach((t) => t.stop());
        if (socketRef.current) socketRef.current.disconnect();
        const backPath = returnTo ? decodeURIComponent(returnTo) : "/dashboard";
        router.push(backPath);
    };

    const sendMessage = () => {
        if (!message.trim()) return;
        socketRef.current.emit("video-chat-message", message, username);
        setMessages((prev) => [
            ...prev,
            {
                sender: username,
                data: message,
                socketIdSender: socketIdRef.current,
            },
        ]);
        setMessage("");
    };

    // --- NEW: Detect Group Call (More than 1 remote peer) ---
    const isGroupCall = videos.length > 1;

    if (!authState.user)
        return (
            <div
                className={styles.meetVideoContainer}
                style={{ justifyContent: "center", alignItems: "center" }}
            >
                Authenticating...
            </div>
        );

    return (
        <div className={styles.meetVideoContainer}>
            <Head>
                <title>Meeting | LinkUps</title>
            </Head>

            {askForUsername ? (
                <div className={styles.lobbyOverlay}>
                    <div className={styles.lobbyCard}>
                        <h2 className={styles.title}>Join Meeting</h2>
                        <div className={styles.previewBox}>
                            <video
                                ref={previewRef}
                                autoPlay
                                muted
                                playsInline
                                className={styles.videoElement}
                            />
                        </div>
                        <input
                            className={styles.nameInput}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Display Name"
                        />
                        <button
                            className={styles.connectButton}
                            onClick={joinMeeting}
                        >
                            Join Now
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.videoChatLayout}>
                    <div className={styles.mainArea}>
                        {/* --- NEW: Dynamic Class for Group Grid --- */}
                        <div
                            className={`${styles.videoGrid} ${
                                isGroupCall ? styles.groupGrid : ""
                            }`}
                        >
                            <div className={styles.videoTile}>
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={styles.videoElement}
                                />
                                <div className={styles.userLabel}>
                                    {username} (You)
                                </div>
                            </div>
                            {videos.map((v) => (
                                <RemoteVideo
                                    key={v.socketId}
                                    stream={v.stream}
                                    label="Peer"
                                    className={styles.videoTile}
                                />
                            ))}
                        </div>

                        <div className={styles.controlsBar}>
                            <button
                                className={`${styles.controlBtn} ${
                                    !audioEnabled && styles.micOff
                                }`}
                                onClick={toggleAudio}
                            >
                                {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                            </button>
                            <button
                                className={`${styles.controlBtn} ${
                                    !videoEnabled && styles.videoOff
                                }`}
                                onClick={toggleVideo}
                            >
                                {videoEnabled ? (
                                    <VideoIcon />
                                ) : (
                                    <VideoOffIcon />
                                )}
                            </button>
                            {screenAvailable && (
                                <button
                                    className={`${styles.controlBtn} ${
                                        screenSharing && styles.screenActive
                                    }`}
                                    onClick={toggleScreen}
                                >
                                    {screenSharing ? (
                                        <StopScreenIcon />
                                    ) : (
                                        <ScreenIcon />
                                    )}
                                </button>
                            )}
                            <button
                                className={styles.endCallBtn}
                                onClick={endCall}
                            >
                                <CallEndIcon />
                            </button>
                            <button
                                className={`${styles.controlBtn} ${
                                    showChat && styles.chatActive
                                }`}
                                onClick={() => setShowChat(!showChat)}
                            >
                                <ChatIcon />
                            </button>
                        </div>
                    </div>

                    {showChat && (
                        <div className={styles.sidePanel}>
                            <div className={styles.chatHeader}>
                                <h3>Meeting Chat</h3>
                                <button
                                    className={styles.closeChatBtn}
                                    onClick={() => setShowChat(false)}
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <div
                                className={styles.chattingArea}
                                ref={chatScrollRef}
                            >
                                {messages.map((m, i) => (
                                    <div
                                        key={i}
                                        className={
                                            m.socketIdSender ===
                                            socketIdRef.current
                                                ? styles.myMessage
                                                : styles.otherMessage
                                        }
                                    >
                                        <small className={styles.sender}>
                                            {m.sender}
                                        </small>
                                        <div>{m.data}</div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.chatInputArea}>
                                <input
                                    className={styles.chatInput}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && sendMessage()
                                    }
                                />
                                <button
                                    className={styles.sendButton}
                                    onClick={sendMessage}
                                >
                                    <SendIcon />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- FIX: USE UserLayout BUT WITHOUT DashboardLayout TO GO FULL SCREEN ---
MeetingRoom.getLayout = function getLayout(page) {
    return <UserLayout>{page}</UserLayout>;
};
