import Comment from "../models/comments.model.js";
import Post from "../models/posts.model.js";
import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

export const activeCheck = async (req, res) => {
    return res.status(200).json({ message: "RUNNING" });
};
export const createPost = async (req, res) => {
    const { token } = req.body;
    try {
        const user = await User.findOne({ token: token });
        if (!user) return res.status(404).json({ message: "User not found" });
        const post = new Post({
            userId: user._id,
            body: req.body.body,
            // We now get the secure URL from Cloudinary via req.file.path
            media: req.file ? req.file.path : "",
            // We can get the file type from mimetype
            fileType: req.file ? req.file.mimetype : "",
        });

        await post.save();
        return res.status(200).json({ message: "Post Created" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().populate(
            "userId",
            "name username email profilePicture"
        );
        const cleanPosts = posts.filter((post) => post && post.userId);
        return res.json({ posts: cleanPosts });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
export const deletePost = async (req, res) => {
    const { token, post_id } = req.body;
    try {
        const user = await User.findOne({ token: token }).select("_id");
        if (!user) return res.status(404).json({ message: "User not found" });
        const post = await Post.findOne({ _id: post_id });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.userId.toString() !== user._id.toString()) {
            return res.status(404).json({ message: "Unauthorized" });
        }
        await Post.deleteOne({ _id: post_id });
        return res.json({ message: "Post Deleted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
export const get_comments_by_post = async (req, res) => {
    const { post_id } = req.query;
    try {
        const post = await Post.findOne({ _id: post_id });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const comments = await Comment.find({ postId: post_id }).populate(
            "userId",
            "username name profilePicture"
        );
        return res.json(comments.reverse());
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
export const delete_comment_of_user = async (req, res) => {
    const { token, comment_id } = req.body;
    try {
        const user = await User.findOne({ token: token }).select("_id");
        if (!user) return res.status(404).json({ message: "User not found" });
        const comment = await Comment.findOne({ _id: comment_id });
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (comment.userId.toString() !== user._id.toString()) {
            return res.status(404).json({ message: "Unauthorized" });
        }
        await Comment.deleteOne({ _id: comment_id });
        return res.json({ message: "Comment Deleted" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
export const increment_likes = async (req, res) => {
    const { post_id, token } = req.body;
    try {
        const user = await User.findOne({ token: token }).select("_id");
        if (!user) return res.status(404).json({ message: "User not found" });

        const post = await Post.findOne({ _id: post_id });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (!Array.isArray(post.likes)) {
            post.likes = [];
        }
        const userIdString = user._id.toString();
        const userIndex = post.likes
            .map((id) => id.toString())
            .indexOf(userIdString);

        let message = "";

        if (userIndex > -1) {
            // User found, so UNLIKE the post
            post.likes.splice(userIndex, 1);
            message = "Post Unliked";
        } else {
            // User not found, so LIKE the post
            post.likes.push(user._id);
            message = "Post Liked";
        }
        await post.save();
        const updatedPost = await Post.findById(post._id).populate(
            "userId",
            "name username email profilePicture"
        );
        return res.json({ message, post: updatedPost });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
