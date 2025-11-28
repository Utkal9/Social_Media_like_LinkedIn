import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";
import messagingRoutes from "./routes/messaging.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import User from "./models/user.model.js";
import Message from "./models/message.model.js";
import session from "express-session";
import passport from "./config/passport.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9090;
const URL = process.env.MONGO_URL;

const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
};

app.use(cors(corsOptions));

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: corsOptions,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
// --- 1. SESSION MIDDLEWARE (Must be before routes) ---
app.use(
    session({
        secret: process.env.SESSION_SECRET || "supersecretkey",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // Set to true if using https strictly
    })
);
// --- 2. PASSPORT INITIALIZATION ---
app.use(passport.initialize());
app.use(passport.session());

// --- 3. SOCIAL AUTH ROUTES ---
const CLIENT_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Google
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        // Successful login -> Redirect to Frontend with Token
        res.redirect(`${CLIENT_URL}/login?token=${req.user.token}`);
    }
);

// GitHub
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

const userSocketMap = new Map();

io.on("connection", (socket) => {
    // 1. Register User
    socket.on("register-user", async (userId) => {
        if (userId) {
            userSocketMap.set(userId, socket.id);
            try {
                await User.findByIdAndUpdate(userId, { isOnline: true });
                io.emit("user-status-change", { userId, isOnline: true });

                // Mark pending messages as DELIVERED
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

                    // Notify senders
                    pendingMessages.forEach((msg) => {
                        const senderSocketId = userSocketMap.get(
                            msg.sender.toString()
                        );
                        if (senderSocketId) {
                            io.to(senderSocketId).emit(
                                "message-status-update",
                                {
                                    messageId: msg._id,
                                    status: "delivered",
                                }
                            );
                        }
                    });
                }
            } catch (error) {
                console.error("Error updating online status:", error);
            }
        }
    });

    // 2. Send Message
    socket.on(
        "send-chat-message",
        async ({ senderId, receiverId, message }) => {
            const receiverSocketId = userSocketMap.get(receiverId);
            let status = receiverSocketId ? "delivered" : "sent";

            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive-chat-message", {
                    sender: senderId,
                    message: message,
                    status: status,
                    createdAt: new Date().toISOString(),
                });
            }
        }
    );

    // 3. Mark as Read (Blue Ticks)
    socket.on("mark-as-read", async ({ senderId, receiverId }) => {
        const senderSocketId = userSocketMap.get(senderId);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messages-read-update", {
                receiverId: receiverId,
            });
        }
    });

    // 4. Edit & Delete
    socket.on("edit-message", ({ messageId, newMessage, receiverId }) => {
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("message-updated", {
                messageId,
                newMessage,
                isEdited: true,
            });
        }
    });

    socket.on("delete-message", ({ messageId, receiverId }) => {
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("message-deleted", {
                messageId,
                isDeleted: true,
                message: "This message was deleted",
            });
        }
    });

    // 5. Video Call
    socket.on("start-call", ({ fromUser, toUserId, roomUrl }) => {
        const toSocketId = userSocketMap.get(toUserId);
        if (toSocketId) {
            io.to(toSocketId).emit("incoming-call", { fromUser, roomUrl });
        }
    });

    // 6. Disconnect
    socket.on("disconnect", async () => {
        for (let [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                const lastSeen = new Date();
                try {
                    await User.findByIdAndUpdate(userId, {
                        isOnline: false,
                        lastSeen: lastSeen,
                    });
                    io.emit("user-status-change", {
                        userId,
                        isOnline: false,
                        lastSeen: lastSeen,
                    });
                } catch (error) {
                    console.error("Error updating offline status:", error);
                }
                break;
            }
        }
    });
});

const start = async () => {
    try {
        await mongoose.connect(URL);
        console.log("✅ MongoDB connected successfully");
        await User.updateMany({}, { $set: { isOnline: false } });
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    }
};

start();
