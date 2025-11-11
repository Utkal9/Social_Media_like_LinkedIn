import mongoose, { Schema } from "mongoose";
const PostSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    body: {
        type: String,
        required: true,
    },
    // --- THIS IS THE FIX ---
    // Add default: [] to ensure 'likes' is always an array
    likes: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        default: [], // <-- THIS LINE FIXES THE BUG
    },
    // --- END FIX ---
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    media: {
        type: String,
        default: "",
    },
    active: {
        type: Boolean,
        default: true,
    },
    fileType: {
        type: String,
        default: "",
    },
});
const Post = mongoose.model("Post", PostSchema);
export default Post;
