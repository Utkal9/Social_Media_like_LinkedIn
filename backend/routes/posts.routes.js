import { Router } from "express";
import {
    activeCheck,
    createPost,
    getAllPosts,
    deletePost,
    get_comments_by_post,
    delete_comment_of_user,
    toggleReactionOnPost,
    getPostById,
    toggleCommentLike,
    updatePost,
} from "../controllers/posts.controller.js";

import upload from "../config/cloudinary.config.js";
import { commentPost } from "../controllers/user.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Posts
 *     description: Post Management
 */

/**
 * @openapi
 * /:
 *   get:
 *     summary: Check API Health
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: API is running
 */
router.route("/").get(activeCheck);

/**
 * @openapi
 * /post:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               body:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post created
 */
router.route("/post").post(upload.single("media"), createPost);

/**
 * @openapi
 * /update_post:
 *   post:
 *     summary: Update an existing post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               post_id:
 *                 type: string
 *               body:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post updated
 */
router.route("/update_post").post(upload.single("media"), updatePost);

/**
 * @openapi
 * /posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: List of posts
 */
router.route("/posts").get(getAllPosts);

/**
 * @openapi
 * /get_post:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: post_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post data
 */
router.route("/get_post").get(getPostById);

/**
 * @openapi
 * /delete_post:
 *   post:
 *     summary: Delete a post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               post_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post deleted
 */
router.route("/delete_post").post(deletePost);

/**
 * @openapi
 * /comment:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               post_id:
 *                 type: string
 *               commentBody:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment added
 */
router.route("/comment").post(commentPost);

/**
 * @openapi
 * /get_comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: post_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.route("/get_comments").get(get_comments_by_post);

/**
 * @openapi
 * /delete_comment:
 *   post:
 *     summary: Delete a comment
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               comment_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 */
router.route("/delete_comment").post(delete_comment_of_user);

/**
 * @openapi
 * /toggle_like:
 *   post:
 *     summary: Toggle reaction on a post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               post_id:
 *                 type: string
 *               reactionType:
 *                 type: string
 *                 example: Like
 *     responses:
 *       200:
 *         description: Reaction updated
 */
router.route("/toggle_like").post(toggleReactionOnPost);

/**
 * @openapi
 * /toggle_comment_like:
 *   post:
 *     summary: Like/Unlike a comment
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               comment_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment like toggled
 */
router.route("/toggle_comment_like").post(toggleCommentLike);

export default router;
