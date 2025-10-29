import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT;
const URL = process.env.MONGO_URL;
app.use(cors());
app.use(express.json());
app.use(postRoutes);
app.use(userRoutes);

const start = async () => {
    try {
        await mongoose.connect(URL);
        console.log("✅ MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("❌ Database connection failed:", err.message);
        process.exit(1); // stop the server
    }
};

start();
