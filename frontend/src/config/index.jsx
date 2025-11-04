import axios from "axios"; // ✅ no curly braces

const clientServer = axios.create({
    baseURL: "http://localhost:9090",
});

export default clientServer;
