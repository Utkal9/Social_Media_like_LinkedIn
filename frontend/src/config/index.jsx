import axios from "axios";
export const BASE_URL = "https://social-media-0nih.onrender.com";
// http://localhost:9090
const clientServer = axios.create({
    baseURL: BASE_URL,
});

export default clientServer;
