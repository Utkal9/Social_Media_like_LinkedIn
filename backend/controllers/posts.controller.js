import Comment from "../models/comments.model.js";
import Post from "../models/posts.model.js";
import User from "../models/user.model.js";

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
            media: req.file ? req.file.path : "",
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
        const posts = await Post.find()
            .populate(
                "userId",
                "name username email profilePicture isOnline lastSeen"
            )
            .populate("reactions.userId", "name username profilePicture"); // Populate reaction users
        return res.json({ posts });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getPostById = async (req, res) => {
    const { post_id } = req.query;
    try {
        const post = await Post.findOne({ _id: post_id })
            .populate(
                "userId",
                "name username email profilePicture isOnline lastSeen"
            )
            .populate("reactions.userId", "name username profilePicture"); // Populate reaction users
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        return res.json({ post });
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
            "username name profilePicture isOnline lastSeen"
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

// --- NEW: Toggle Reaction Logic ---
export const toggleReactionOnPost = async (req, res) => {
    const { post_id, token, reactionType } = req.body;

    try {
        const user = await User.findOne({ token: token }).select("_id");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const userId = user._id;

        const post = await Post.findOne({ _id: post_id });
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (!post.reactions) post.reactions = [];

        // Find if user has already reacted
        const existingIndex = post.reactions.findIndex(
            (r) => r.userId.toString() === userId.toString()
        );

        if (existingIndex !== -1) {
            const existingReaction = post.reactions[existingIndex];

            // 1. Same reaction clicked -> Remove it (Toggle Off)
            if (existingReaction.type === reactionType) {
                post.reactions.splice(existingIndex, 1);
                await post.save();
                return res.json({
                    message: "Reaction removed",
                    post_id: post._id,
                    reactions: post.reactions,
                });
            }
            // 2. Different reaction clicked -> Update type
            else {
                post.reactions[existingIndex].type = reactionType;
                await post.save();
                return res.json({
                    message: "Reaction updated",
                    post_id: post._id,
                    reactions: post.reactions,
                });
            }
        } else {
            // 3. New Reaction -> Add it
            post.reactions.push({ userId: userId, type: reactionType });
            await post.save();
            return res.json({
                message: "Reaction added",
                post_id: post._id,
                reactions: post.reactions,
            });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
export const toggleCommentLike = async (req, res) => {
    const { comment_id, token } = req.body;
    try {
        const user = await User.findOne({ token: token }).select("_id");
        if (!user) return res.status(404).json({ message: "User not found" });

        const comment = await Comment.findById(comment_id);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });

        // Initialize likes array if it doesn't exist (for old comments)
        if (!comment.likes) comment.likes = [];

        const index = comment.likes.indexOf(user._id);
        if (index === -1) {
            comment.likes.push(user._id);
        } else {
            comment.likes.splice(index, 1);
        }
        await comment.save();

        return res.json({
            message: "Success",
            likes: comment.likes,
            comment_id,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
