import mongoose, { Schema } from "mongoose";

const connectionSchema = new mongoose.Schema(
    {
        // The user who sent the request
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // The user who received the request
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // The status of the connection
        status: {
            type: String,
            enum: ["pending", "accepted", "declined"],
            default: "pending",
        },
    },
    { timestamps: true }
); // Add timestamps

// Ensure a user can't send multiple requests to the same person
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
// Add an index for the recipient to quickly find incoming requests
connectionSchema.index({ recipient: 1, status: 1 });

const Connection = mongoose.model("Connection", connectionSchema);
export default Connection;
