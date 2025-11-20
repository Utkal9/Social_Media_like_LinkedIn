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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9090;
const URL = process.env.MONGO_URL;

const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
};

app.use(cors(corsOptions));

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: corsOptions,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(postRoutes);
app.use(userRoutes);
app.use(messagingRoutes);

const userSocketMap = new Map();

io.on("connection", (socket) => {
    socket.on("register-user", async (userId) => {
        if (userId) {
            userSocketMap.set(userId, socket.id);
            try {
                await User.findByIdAndUpdate(userId, { isOnline: true });
                io.emit("user-status-change", { userId, isOnline: true });
            } catch (error) {
                console.error("Error updating online status:", error);
            }
        }
    });

    socket.on("send-chat-message", ({ senderId, receiverId, message }) => {
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive-chat-message", {
                sender: senderId,
                message: message,
                createdAt: new Date().toISOString(),
            });
        }
    });

    socket.on("start-call", ({ fromUser, toUserId, roomUrl }) => {
        const toSocketId = userSocketMap.get(toUserId);
        if (toSocketId) {
            io.to(toSocketId).emit("incoming-call", { fromUser, roomUrl });
        }
    });

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
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    }
};

start();
