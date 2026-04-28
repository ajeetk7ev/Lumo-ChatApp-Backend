import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import env from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { ApiResponse } from "./utils/ApiResponse.js";

const app = express();

// Security Middleware
app.use(helmet());

// CORS Middleware
app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
}));

// Standard Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Health Check Route
app.get("/api/v1/health", (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, { status: "OK" }, "Server is healthy")
    );
});

// Error handling middleware (must be last)
app.use(errorHandler);

export { app };