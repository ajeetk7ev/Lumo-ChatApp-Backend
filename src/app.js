import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import env from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { ApiResponse } from "./utils/ApiResponse.js";

// Routes imports
import authRouter from "./routes/auth.routes.js";
import friendRequestRouter from "./routes/friendRequest.routes.js";
import chatRouter from "./routes/chat.routes.js";



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

// Routes declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/friends", friendRequestRouter);
app.use("/api/v1/chat", chatRouter);



// Error handling middleware (must be last)

app.use(errorHandler);

export { app };