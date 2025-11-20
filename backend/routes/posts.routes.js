import { Router } from "express";
import {
    activeCheck,
    createPost,
    getAllPosts,
    deletePost,
    get_comments_by_post,
    delete_comment_of_user,
    toggleReactionOnPost, // Updated import
    getPostById,
    toggleCommentLike,
} from "../controllers/posts.controller.js";

import upload from "../config/cloudinary.config.js";
import { commentPost } from "../controllers/user.controller.js";

const router = Router();

router.route("/").get(activeCheck);
router.route("/post").post(upload.single("media"), createPost);

router.route("/posts").get(getAllPosts);
router.route("/get_post").get(getPostById);
router.route("/delete_post").post(deletePost);

router.route("/comment").post(commentPost);
router.route("/get_comments").get(get_comments_by_post);
router.route("/delete_comment").post(delete_comment_of_user);

// Updated Route
router.route("/toggle_like").post(toggleReactionOnPost);
router.route("/toggle_comment_like").post(toggleCommentLike);
export default router;
