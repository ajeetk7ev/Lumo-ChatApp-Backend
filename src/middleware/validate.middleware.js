import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to validate request data using Joi schemas.
 * @param {Object} schema - Joi schema object containing body, query, and params schemas.
 */
const validate = (schema) => (req, res, next) => {
    const validSchema = ["body", "query", "params"];
    const object = {};

    validSchema.forEach((key) => {
        if (schema[key] && req[key]) {
            object[key] = req[key];
        }
    });

    const { value, error } = schema.validate(object, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
    });

    if (error) {
        const errorMessage = error.details
            .map((details) => details.message)
            .join(", ");
        return next(new ApiError(400, errorMessage));
    }

    Object.assign(req, value);
    return next();
};

export { validate };
