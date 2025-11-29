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

/**
 * @openapi
 * tags:
 *   - name: Messaging
 *     description: Real-time chat and conversation management
 */

/**
 * @openapi
 * /messages/send:
 *   post:
 *     summary: Send a text message
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - toUserId
 *               - message
 *             properties:
 *               token:
 *                 type: string
 *               toUserId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent
 */
router.route("/messages/send").post(sendMessage);

/**
 * @openapi
 * /messages/get:
 *   get:
 *     summary: Get chat history with a user
 *     tags: [Messaging]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 */
router.route("/messages/get").get(getMessages);

/**
 * @openapi
 * /messages/conversations:
 *   get:
 *     summary: Get list of recent conversations
 *     tags: [Messaging]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of conversation objects
 */
router.route("/messages/conversations").get(getConversations);

/**
 * @openapi
 * /messages/unread_count:
 *   get:
 *     summary: Get global unread message count
 *     tags: [Messaging]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Count object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.route("/messages/unread_count").get(getUnreadCount);

/**
 * @openapi
 * /messages/mark_read:
 *   post:
 *     summary: Mark messages from a user as read
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               senderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Messages marked read
 */
router.route("/messages/mark_read").post(markMessagesAsRead);

/**
 * @openapi
 * /messages/edit:
 *   post:
 *     summary: Edit a sent message
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               messageId:
 *                 type: string
 *               newMessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated
 */
router.route("/messages/edit").post(editMessage);

/**
 * @openapi
 * /messages/delete:
 *   post:
 *     summary: Delete a message (soft delete)
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               messageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message deleted
 */
router.route("/messages/delete").post(deleteMessage);

/**
 * @openapi
 * /messages/clear:
 *   post:
 *     summary: Clear chat history with a user
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               otherUserId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat cleared
 */
router.route("/messages/clear").post(clearChatHistory);

export default router;
