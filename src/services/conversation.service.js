import { Conversation } from "../models/conversation.model.js";
import { FriendRequest } from "../models/friendRequest.model.js";
import { ApiError } from "../utils/ApiError.js";

class ConversationService {
    /**
     * Create or get a direct conversation between two users
     */
    static async getOrCreateConversation(userId, participantId) {
        if (userId.toString() === participantId.toString()) {
            throw new ApiError(400, "You cannot start a conversation with yourself");
        }

        // 1. Check if they are friends (Status must be accepted)
        const friendship = await FriendRequest.findOne({
            $or: [
                { sender: userId, receiver: participantId, status: "accepted" },
                { sender: participantId, receiver: userId, status: "accepted" },
            ],
        });

        if (!friendship) {
            throw new ApiError(403, "You can only start a conversation with your friends");
        }

        // 2. Check if conversation already exists
        let conversation = await Conversation.findOne({
            type: "direct",
            participants: { $all: [userId, participantId] },
        });

        // 3. Create if not exists
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [userId, participantId],
                type: "direct",
            });
        }

        return conversation;
    }

    /**
     * Get all conversations for a user
     */
    static async getUserConversations(userId) {
        return await Conversation.find({
            participants: { $in: [userId] },
        })
            .populate("participants", "username fullName avatar isOnline lastSeen")
            .populate({
                path: "lastMessage",
                populate: { path: "sender", select: "username" },
            })
            .sort({ updatedAt: -1 });
    }

    /**
     * Get conversation details by ID
     */
    static async getConversationById(userId, conversationId) {
        const conversation = await Conversation.findById(conversationId).populate(
            "participants",
            "username fullName avatar isOnline lastSeen"
        );

        if (!conversation) {
            throw new ApiError(404, "Conversation not found");
        }

        if (!conversation.participants.some((p) => p._id.toString() === userId.toString())) {
            throw new ApiError(403, "You are not a participant in this conversation");
        }

        return conversation;
    }
}

export { ConversationService };
