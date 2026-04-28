import Joi from "joi";

export const registerSchema = Joi.object({
    body: Joi.object({
        fullName: Joi.string().required().min(3).max(50),
        username: Joi.string().required().min(3).max(20).alphanum().lowercase(),
        email: Joi.string().required().email(),
        password: Joi.string().required().min(6),
        confirmPassword: Joi.any()
            .equal(Joi.ref("password"))
            .required()
            .messages({ "any.only": "Passwords do not match" }),
    }),
});

export const loginSchema = Joi.object({
    body: Joi.object({
        identifier: Joi.string().required().messages({
            "any.required": "Email or username is required",
        }),
        password: Joi.string().required(),
    }),
});
