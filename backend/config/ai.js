import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const ai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL, // Optional if using custom endpoint
});

export default ai;
