import { Router } from "express";
import {
    getNotifications,
    markNotificationRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.route("/notifications").get(getNotifications);
router.route("/notifications/mark_read").post(markNotificationRead);

export default router;
