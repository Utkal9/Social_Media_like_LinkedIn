import { Router } from "express";
import {
    sendMessage,
    getMessages,
    getConversations,
} from "../controllers/messaging.controller.js";

const router = Router();

router.route("/messages/send").post(sendMessage);
router.route("/messages/get").get(getMessages);
router.route("/messages/conversations").get(getConversations);

export default router;
