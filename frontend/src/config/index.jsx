import axios from "axios";
export const BASE_URL = "https://social-media-like-linkedin.onrender.com";
// http://localhost:9090
// https://social-media-0nih.onrender.com
// https://social-media-like-linkedin.onrender.com
const clientServer = axios.create({
    baseURL: BASE_URL,
});

export default clientServer;
