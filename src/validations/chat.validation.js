import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const createConversationSchema = Joi.object({
    body: Joi.object({
        participantId: objectId.required(),
    }),
});

export const sendMessageSchema = Joi.object({
    body: Joi.object({
        conversationId: objectId.required(),
        content: Joi.string().required().max(2000),
    }),
});

export const conversationIdParamSchema = Joi.object({
    params: Joi.object({
        conversationId: objectId.required(),
    }),
});
