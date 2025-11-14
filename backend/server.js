import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
// PORT should be 9090 based on your logs
const PORT = process.env.PORT || 9090;
const URL = process.env.MONGO_URL;

// --- UNIFIED CORS ---
const corsOptions = {
    origin: "http://localhost:3000", // Your frontend URL
    methods: ["GET", "POST"],
};

// 1. Apply CORS to all Express API routes
app.use(cors(corsOptions));

const httpServer = createServer(app);

// 2. Apply the *same* CORS options to Socket.IO
const io = new Server(httpServer, {
    cors: corsOptions,
});

// Create __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your existing middleware
app.use(express.json());
app.use(postRoutes);
app.use(userRoutes);

// --- SOCKET.IO LOGIC ---
const userSocketMap = new Map();

io.on("connection", (socket) => {
    console.log(`[SERVER] Socket connected: ${socket.id}`);

    socket.on("register-user", (userId) => {
        if (!userId) {
            console.log(
                `[SERVER] Socket ${socket.id} tried to register with no userId.`
            );
            return;
        }
        userSocketMap.set(userId, socket.id);
        console.log(
            `[SERVER] User registered: ${userId} with socket ${socket.id}`
        );
        console.log("[SERVER] Current user map:", userSocketMap);
    });

    socket.on("start-call", ({ fromUser, toUserId, roomUrl }) => {
        console.log(`[SERVER] 'start-call' received from: ${fromUser._id}`);
        console.log(`[SERVER] Looking for user: ${toUserId}`);

        const toSocketId = userSocketMap.get(toUserId);

        if (toSocketId) {
            console.log(
                `[SERVER] Found user! Emitting 'incoming-call' to socket: ${toSocketId}`
            );
            io.to(toSocketId).emit("incoming-call", { fromUser, roomUrl });
        } else {
            console.log(
                `[SERVER] User ${toUserId} is not online (no socket found).`
            );
        }
    });

    socket.on("disconnect", () => {
        console.log(`[SERVER] Socket disconnected: ${socket.id}`);
        for (let [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                console.log(`[SERVER] User unregistered: ${userId}`);
                break;
            }
        }
        console.log("[SERVER] Current user map:", userSocketMap);
    });
});
// --- END SOCKET.IO LOGIC ---

const start = async () => {
    try {
        await mongoose.connect(URL);
        console.log("✅ MongoDB connected successfully");

        // Debug logs to confirm restart
        console.log("\n*************************************************");
        console.log(`*** SERVER RUNNING LATEST DEBUG CODE (v4) ***`);
        console.log(`*** CORS Origin set to: ${corsOptions.origin} ***`);
        console.log("*************************************************\n");

        httpServer.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1);
    }
};

start();
