import axios from "axios";
export const BASE_URL = "https://social-media-0nih.onrender.com";
// http://localhost:9090
// https://social-media-0nih.onrender.com
const clientServer = axios.create({
    baseURL: BASE_URL,
});

export default clientServer;
