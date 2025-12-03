import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getNotifications = async (req, res) => {
    try {
        const { token } = req.query;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        const notifications = await Notification.find({ recipient: user._id })
            .populate("sender", "name username profilePicture")
            .populate("post", "_id body") // Populate post snippet if needed
            .sort({ createdAt: -1 });

        return res.json(notifications);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const { token, notificationId } = req.body;
        const user = await User.findOne({ token });
        if (!user) return res.status(404).json({ message: "User not found" });

        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        return res.json({ message: "Marked as read" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
