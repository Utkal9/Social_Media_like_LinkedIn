import { Router } from "express";
import {
    sendMessage,
    getMessages,
    getConversations,
    getUnreadCount,
    markMessagesAsRead,
    editMessage,
    deleteMessage,
    clearChatHistory,
} from "../controllers/messaging.controller.js";

const router = Router();

router.route("/messages/send").post(sendMessage);
router.route("/messages/get").get(getMessages);
router.route("/messages/conversations").get(getConversations);

// --- NEW ROUTES ---
router.route("/messages/unread_count").get(getUnreadCount);
router.route("/messages/mark_read").post(markMessagesAsRead);
router.route("/messages/edit").post(editMessage);
router.route("/messages/delete").post(deleteMessage);
router.route("/messages/clear").post(clearChatHistory);

export default router;
