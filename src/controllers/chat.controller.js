import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ConversationService } from "../services/conversation.service.js";
import { MessageService } from "../services/message.service.js";

class ChatController {
    // --- Conversation Methods ---

    static getOrCreateConversation = asyncHandler(async (req, res) => {
        const { participantId } = req.body;
        const conversation = await ConversationService.getOrCreateConversation(
            req.user._id,
            participantId
        );

        return res.status(200).json(
            new ApiResponse(200, conversation, "Conversation retrieved/created")
        );
    });

    static getConversations = asyncHandler(async (req, res) => {
        const conversations = await ConversationService.getUserConversations(req.user._id);

        return res.status(200).json(
            new ApiResponse(200, conversations, "Conversations fetched")
        );
    });

    // --- Message Methods ---

    static sendMessage = asyncHandler(async (req, res) => {
        const { conversationId, content } = req.body;
        const message = await MessageService.sendMessage(
            req.user._id,
            conversationId,
            content
        );

        return res.status(201).json(
            new ApiResponse(201, message, "Message sent successfully")
        );
    });

    static getMessages = asyncHandler(async (req, res) => {
        const { conversationId } = req.params;
        const messages = await MessageService.getMessages(
            req.user._id,
            conversationId
        );

        return res.status(200).json(
            new ApiResponse(200, messages, "Messages fetched")
        );
    });

    static markMessagesAsSeen = asyncHandler(async (req, res) => {
        const { conversationId } = req.params;
        await MessageService.markAsSeen(req.user._id, conversationId);

        return res.status(200).json(
            new ApiResponse(200, {}, "Messages marked as seen")
        );
    });
}


export { ChatController };
