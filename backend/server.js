import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import passport from "./config/passport.js";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";
import messagingRoutes from "./routes/messaging.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import User from "./models/user.model.js";
import Message from "./models/message.model.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9090;
const URL = process.env.MONGO_URL;

const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
};

app.use(cors(corsOptions));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: corsOptions });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "supersecretkey",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Auth Routes
const CLIENT_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        res.redirect(`${CLIENT_URL}/login?token=${req.user.token}`);
    }
);
app.get(
    "/auth/github",
    passport.authenticate("github", { scope: ["user:email"] })
);
app.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/login" }),
    (req, res) => {
        res.redirect(`${CLIENT_URL}/login?token=${req.user.token}`);
    }
);

app.use(postRoutes);
app.use(userRoutes);
app.use(messagingRoutes);

// --- SOCKET LOGIC ---
const userSocketMap = new Map();
let meetingMessages = {};

io.on("connection", (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // --- 1. GLOBAL APP LOGIC (Chat/Online) ---
    socket.on("register-user", async (userId) => {
        if (userId) {
            userSocketMap.set(userId, socket.id);
            try {
                await User.findByIdAndUpdate(userId, { isOnline: true });
                io.emit("user-status-change", { userId, isOnline: true });

                // Deliver pending messages
                const pendingMessages = await Message.find({
                    receiver: userId,
                    status: "sent",
                });
                if (pendingMessages.length > 0) {
                    await Message.updateMany(
                        { receiver: userId, status: "sent" },
                        {
                            $set: {
                                status: "delivered",
                                deliveredAt: Date.now(),
                            },
                        }
                    );
                    pendingMessages.forEach((msg) => {
                        const senderSocketId = userSocketMap.get(
                            msg.sender.toString()
                        );
                        if (senderSocketId) {
                            io.to(senderSocketId).emit(
                                "message-status-update",
                                { messageId: msg._id, status: "delivered" }
                            );
                        }
                    });
                }
            } catch (e) {
                console.error(e);
            }
        }
    });

    socket.on(
        "send-chat-message",
        async ({ senderId, receiverId, message }) => {
            const receiverSocketId = userSocketMap.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive-chat-message", {
                    sender: senderId,
                    message,
                    status: "delivered",
                    createdAt: new Date().toISOString(),
                });
            }
        }
    );

    socket.on("mark-as-read", async ({ senderId, receiverId }) => {
        const senderSocketId = userSocketMap.get(senderId);
        if (senderSocketId)
            io.to(senderSocketId).emit("messages-read-update", { receiverId });
    });

    socket.on("edit-message", ({ messageId, newMessage, receiverId }) => {
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId)
            io.to(receiverSocketId).emit("message-updated", {
                messageId,
                newMessage,
                isEdited: true,
            });
    });

    socket.on("delete-message", ({ messageId, receiverId }) => {
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId)
            io.to(receiverSocketId).emit("message-deleted", {
                messageId,
                isDeleted: true,
                message: "This message was deleted",
            });
    });

    socket.on("start-call", ({ fromUser, toUserId, roomUrl }) => {
        const toSocketId = userSocketMap.get(toUserId);
        if (toSocketId) {
            io.to(toSocketId).emit("incoming-call", { fromUser, roomUrl });
        }
    });

    // ==================================================
    // 2. SECURE VIDEO MEETING LOGIC (UPDATED)
    // ==================================================

    socket.on("join-call", (roomId, userId) => {
        // --- SECURITY CHECK START ---
        // Check if roomId looks like "ID1-ID2" (MongoDB IDs are 24 chars hex)
        const isPrivateRoom = /^[a-f\d]{24}-[a-f\d]{24}$/i.test(roomId);

        if (isPrivateRoom) {
            const allowedUsers = roomId.split("-");

            // 1. If user is not logged in
            if (!userId) {
                console.log(
                    `[Security] Guest blocked from private room ${roomId}`
                );
                socket.emit(
                    "call-denied",
                    "Authentication required for private calls."
                );
                return;
            }

            // 2. If user is NOT one of the two participants
            if (!allowedUsers.includes(userId)) {
                console.log(
                    `[Security] Unauthorized user ${userId} blocked from room ${roomId}`
                );
                socket.emit(
                    "call-denied",
                    "Access Denied: You are not invited to this private meeting."
                );
                return;
            }
        }
        // --- SECURITY CHECK END ---

        socket.join(roomId);
        socket.room = roomId;

        // Notify others
        const clients = io.sockets.adapter.rooms.get(roomId);
        const clientsArr = clients ? Array.from(clients) : [];
        io.to(roomId).emit("user-joined", socket.id, clientsArr);

        // Send meeting chat history
        if (meetingMessages[roomId]) {
            meetingMessages[roomId].forEach((msg) => {
                io.to(socket.id).emit(
                    "video-chat-message",
                    msg.data,
                    msg.sender,
                    msg.socketIdSender
                );
            });
        }
        console.log(`User ${userId || "Guest"} joined room: ${roomId}`);
    });

    socket.on("signal", (toId, message) => {
        io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("video-chat-message", (data, sender) => {
        const room = socket.room;
        if (room) {
            if (!meetingMessages[room]) meetingMessages[room] = [];
            meetingMessages[room].push({
                sender,
                data,
                socketIdSender: socket.id,
            });
            io.to(room).emit("video-chat-message", data, sender, socket.id);
        }
    });

    // ==================================================
    // 3. DISCONNECT LOGIC
    // ==================================================
    socket.on("disconnect", () => {
        const room = socket.room;
        if (room) {
            io.to(room).emit("user-left", socket.id);
            setTimeout(() => {
                const clients = io.sockets.adapter.rooms.get(room);
                if (!clients || clients.size === 0) {
                    delete meetingMessages[room];
                }
            }, 1000);
        }

        for (let [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                User.findByIdAndUpdate(userId, { isOnline: false }).catch(
                    (e) => {}
                );
                io.emit("user-status-change", { userId, isOnline: false });
                break;
            }
        }
    });
});

const start = async () => {
    try {
        await mongoose.connect(URL);
        console.log("✅ MongoDB connected");
        httpServer.listen(PORT, () =>
            console.log(`🚀 Server running on port ${PORT}`)
        );
    } catch (err) {
        console.error(err);
    }
};
start();
