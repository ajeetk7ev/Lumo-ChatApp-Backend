import { Router } from "express";
import { ChatController } from "../controllers/chat.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createConversationSchema,
    sendMessageSchema,
    conversationIdParamSchema,
} from "../validations/chat.validation.js";

const router = Router();

router.use(verifyJWT);

// Conversations
router.route("/conversations").get(ChatController.getConversations);
router.route("/conversations").post(
    validate(createConversationSchema),
    ChatController.getOrCreateConversation
);

// Messages
router.route("/messages").post(
    validate(sendMessageSchema),
    ChatController.sendMessage
);

router.route("/messages/:conversationId").get(
    validate(conversationIdParamSchema),
    ChatController.getMessages
);

router.route("/messages/:conversationId/seen").patch(
    validate(conversationIdParamSchema),
    ChatController.markMessagesAsSeen
);

export default router;

