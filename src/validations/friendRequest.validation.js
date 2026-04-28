import Joi from "joi";

export const sendRequestSchema = Joi.object({
    body: Joi.object({
        receiverId: Joi.string().hex().length(24).required().messages({
            "string.length": "Invalid receiver ID",
        }),
    }),
});

export const requestIdSchema = Joi.object({
    params: Joi.object({
        requestId: Joi.string().hex().length(24).required().messages({
            "string.length": "Invalid request ID",
        }),
    }),
});
