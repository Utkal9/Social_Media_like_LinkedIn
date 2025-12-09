import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

const check = async () => {
    try {
        console.log("Checking available Gemini models...");
        const res = await axios.get(url);
        console.log("✅ Available Models:");
        res.data.models.forEach((m) =>
            console.log(` - ${m.name.replace("models/", "")}`)
        );
    } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
    }
};
check();
