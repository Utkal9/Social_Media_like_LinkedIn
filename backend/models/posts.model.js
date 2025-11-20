import mongoose, { Schema } from "mongoose";

// Sub-schema for individual reactions
const ReactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "Like",
                "Love",
                "Celebrate",
                "Support",
                "Insightful",
                "Funny",
            ],
            default: "Like",
        },
    },
    { _id: false }
);

const PostSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    body: {
        type: String,
        required: true,
    },
    // REPLACED 'likes' with 'reactions'
    reactions: {
        type: [ReactionSchema],
        default: [],
    },
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
