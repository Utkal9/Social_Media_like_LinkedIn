import { Router } from "express";
import {
    activeCheck,
    createPost,
    getAllPosts,
    deletePost,
    get_comments_by_post,
    delete_comment_of_user,
    increment_likes,
} from "../controllers/posts.controller.js";

// --- CHANGED ---
// We import our configured Cloudinary uploader
import upload from "../config/cloudinary.config.js";
// We no longer need the local multer
// import multer from "multer";
// --- CHANGED ---

import { commentPost } from "../controllers/user.controller.js";
const router = Router();

// --- DELETED ---
// All of this local storage code is no longer needed.
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "uploads/");
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname);
//     },
// });
// const upload = multer({ storage: storage });
// --- DELETED ---

router.route("/").get(activeCheck);

// This 'upload' is now the Cloudinary uploader we imported
router.route("/post").post(upload.single("media"), createPost);

// --- All other routes are unchanged ---
router.route("/posts").get(getAllPosts);
router.route("/delete_post").post(deletePost);
router.route("/comment").post(commentPost);
router.route("/get_comments").get(get_comments_by_post);
router.route("/delete_comment").post(delete_comment_of_user);
router.route("/increment_post_like").post(increment_likes);
export default router;
