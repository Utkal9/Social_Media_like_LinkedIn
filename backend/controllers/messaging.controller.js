import Message from "../models/message.model.js";
import User from "../models/user.model.js";

// 1. Send a Message
export const sendMessage = async (req, res) => {
    try {
        const { token, toUserId, message } = req.body;
        const sender = await User.findOne({ token: token });

        if (!sender) return res.status(404).json({ message: "User not found" });

        const newMessage = new Message({
            sender: sender._id,
            receiver: toUserId,
            message: message,
        });

        await newMessage.save();
        res.status(200).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Get Chat History with a specific user
export const getMessages = async (req, res) => {
    try {
        const { token, otherUserId } = req.query;
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const messages = await Message.find({
            $or: [
                { sender: user._id, receiver: otherUserId },
                { sender: otherUserId, receiver: user._id },
            ],
        }).sort({ createdAt: 1 }); // Oldest first

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Get List of Conversations (People you've talked to)
export const getConversations = async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Find all unique users involved in messages with current user
        const sentTo = await Message.distinct("receiver", { sender: user._id });
        const receivedFrom = await Message.distinct("sender", {
            receiver: user._id,
        });

        // Combine and remove duplicates
        const allContactIds = [
            ...new Set([
                ...sentTo.map((id) => id.toString()),
                ...receivedFrom.map((id) => id.toString()),
            ]),
        ];

        // --- UPDATED: Include isOnline and lastSeen ---
        const contacts = await User.find({
            _id: { $in: allContactIds },
        }).select("name username profilePicture isOnline lastSeen");

        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
