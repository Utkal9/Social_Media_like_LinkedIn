import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const sendMessage = async (req, res) => {
    try {
        const { token, toUserId, message } = req.body;
        const sender = await User.findOne({ token: token });
        if (!sender) return res.status(404).json({ message: "User not found" });

        const receiver = await User.findById(toUserId);
        const initialStatus =
            receiver && receiver.isOnline ? "delivered" : "sent";
        const deliveredTime = initialStatus === "delivered" ? Date.now() : null;

        const newMessage = new Message({
            sender: sender._id,
            receiver: toUserId,
            message: message,
            status: initialStatus,
            deliveredAt: deliveredTime,
        });

        await newMessage.save();
        res.status(200).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { token, otherUserId } = req.query;
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { sender: user._id, receiver: otherUserId },
                        { sender: otherUserId, receiver: user._id },
                    ],
                },
                { hiddenFor: { $ne: user._id } }, // Exclude hidden messages
            ],
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getConversations = async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const sentTo = await Message.distinct("receiver", {
            sender: user._id,
            hiddenFor: { $ne: user._id },
        });
        const receivedFrom = await Message.distinct("sender", {
            receiver: user._id,
            hiddenFor: { $ne: user._id },
        });

        const allContactIds = [
            ...new Set([
                ...sentTo.map((id) => id.toString()),
                ...receivedFrom.map((id) => id.toString()),
            ]),
        ];

        const conversations = await Promise.all(
            allContactIds.map(async (contactId) => {
                const contact = await User.findById(contactId).select(
                    "name username profilePicture isOnline lastSeen"
                );
                if (!contact) return null;

                const lastMessage = await Message.findOne({
                    $or: [
                        { sender: user._id, receiver: contactId },
                        { sender: contactId, receiver: user._id },
                    ],
                    hiddenFor: { $ne: user._id },
                }).sort({ createdAt: -1 });

                // --- COUNT LOGIC ---
                const unreadCount = await Message.countDocuments({
                    sender: contactId,
                    receiver: user._id,
                    isRead: false,
                    hiddenFor: { $ne: user._id },
                });

                if (!lastMessage) return null;

                return {
                    user: contact,
                    lastMessage: lastMessage,
                    unreadCount: unreadCount,
                };
            })
        );

        const sortedConversations = conversations
            .filter((c) => c !== null)
            .sort((a, b) => {
                const dateA = a.lastMessage
                    ? new Date(a.lastMessage.createdAt)
                    : new Date(0);
                const dateB = b.lastMessage
                    ? new Date(b.lastMessage.createdAt)
                    : new Date(0);
                return dateB - dateA;
            });

        res.json(sortedConversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const count = await Message.countDocuments({
            receiver: user._id,
            isRead: false,
            hiddenFor: { $ne: user._id },
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markMessagesAsRead = async (req, res) => {
    try {
        const { token, senderId } = req.body;
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });

        await Message.updateMany(
            { sender: senderId, receiver: user._id, isRead: false },
            { $set: { isRead: true, status: "read", readAt: Date.now() } }
        );

        res.json({ message: "Messages marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ... (editMessage, deleteMessage, clearChatHistory remain same) ...
export const editMessage = async (req, res) => {
    try {
        const { token, messageId, newMessage } = req.body;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const msg = await Message.findById(messageId);
        if (!msg) return res.status(404).json({ message: "Message not found" });

        if (msg.sender.toString() !== user._id.toString()) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        msg.message = newMessage;
        msg.isEdited = true;
        await msg.save();

        res.json({ message: "Message updated", data: msg });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { token, messageId } = req.body;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const msg = await Message.findById(messageId);
        if (!msg) return res.status(404).json({ message: "Message not found" });

        if (msg.sender.toString() !== user._id.toString()) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        msg.isDeleted = true;
        msg.message = "This message was deleted";
        await msg.save();

        res.json({ message: "Message deleted", data: msg });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const clearChatHistory = async (req, res) => {
    try {
        const { token, otherUserId } = req.body;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        await Message.updateMany(
            {
                $or: [
                    { sender: user._id, receiver: otherUserId },
                    { sender: otherUserId, receiver: user._id },
                ],
            },
            { $addToSet: { hiddenFor: user._id } }
        );

        res.json({ message: "Chat history cleared" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
