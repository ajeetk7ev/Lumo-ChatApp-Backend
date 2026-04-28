/**
 * A wrapper to handle async route handlers and pass errors to the next middleware.
 * eliminates the need for try-catch blocks in controllers.
 */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

export { asyncHandler };
