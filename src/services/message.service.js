import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";
import { ApiError } from "../utils/ApiError.js";
import { emitEvent } from "../socket/index.js";

class MessageService {
    /**
     * Send a message in a conversation
     */
    static async sendMessage(senderId, conversationId, content) {
        // 1. Verify user is part of the conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new ApiError(404, "Conversation not found");
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === senderId.toString()
        );

        if (!isParticipant) {
            throw new ApiError(403, "You are not authorized to send messages here");
        }

        // 2. Create message
        const message = await Message.create({
            conversationId,
            sender: senderId,
            content,
        });

        // 3. Update conversation last message
        conversation.lastMessage = message._id;
        await conversation.save();

        const populatedMessage = await message.populate("sender", "username fullName avatar");

        // 4. Emit to socket room
        emitEvent(conversationId.toString(), "message:receive", populatedMessage);

        return populatedMessage;
    }

    /**
     * Get all messages for a conversation
     */
    static async getMessages(userId, conversationId) {
        // 1. Verify access
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new ApiError(404, "Conversation not found");
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId.toString()
        );

        if (!isParticipant) {
            throw new ApiError(403, "You are not authorized to view these messages");
        }

        // 2. Fetch messages
        return await Message.find({ conversationId })
            .populate("sender", "username fullName avatar")
            .sort({ createdAt: 1 });
    }

    /**
     * Mark all messages in a conversation as seen
     */
    static async markAsSeen(userId, conversationId) {
        // 1. Verify access
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new ApiError(404, "Conversation not found");
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId.toString()
        );

        if (!isParticipant) {
            throw new ApiError(403, "Unauthorized");
        }

        // 2. Update all messages sent by others in this conversation to 'seen'
        await Message.updateMany(
            {
                conversationId,
                sender: { $ne: userId },
                status: { $ne: "seen" },
            },
            {
                $set: { status: "seen" },
            }
        );

        // 3. Notify the other user(s)
        emitEvent(conversationId.toString(), "message:seen", {
            conversationId,
            seenBy: userId,
        });

        return true;
    }
}

export { MessageService };
