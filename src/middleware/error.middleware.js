import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import logger from "../config/logger.js";
import env from "../config/env.js";

/**
 * Global error handling middleware for Express.
 * Formats errors and logs them using Winston.
 */
const errorHandler = (err, req, res, next) => {
    let error = err;

    // Check if the error is an instance of ApiError, if not, create one
    if (!(error instanceof ApiError)) {
        const statusCode =
            error.statusCode || (error instanceof mongoose.Error ? 400 : 500);
        const message = error.message || "Internal Server Error";
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        ...error,
        message: error.message,
        ...(env.isDev ? { stack: error.stack } : {}), // only include stack trace in development
    };

    // Log error using Winston
    logger.error(`${req.method} ${req.url} - ${error.message} - ${error.stack}`);

    return res.status(error.statusCode).json(response);
};

export { errorHandler };
