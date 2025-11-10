// http://localhost:9090
// https://social-media-0nih.onrender.com
// https://social-media-like-linkedin.onrender.com
import axios from "axios";

// This is the "advanced" part.
// process.env.NEXT_PUBLIC_API_URL will be:
// 1. "http://localhost:9090" when you run `npm run dev` (from .env.local)
// 2. "https://social-media-like-linkedin.onrender.com" when you deploy
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const clientServer = axios.create({
    baseURL: BASE_URL,
});

export default clientServer;
