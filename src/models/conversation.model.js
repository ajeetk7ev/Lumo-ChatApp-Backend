import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
        type: {
            type: String,
            enum: ["direct", "group"],
            default: "direct",
        },
    },
    {
        timestamps: true,
    }
);

// Index to quickly find direct conversations between two specific users
conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
