import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import env from "../config/env.js";
import logger from "../config/logger.js";

let io;

/**
 * Initialize Socket.IO with the HTTP server
 */
export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: env.CORS_ORIGIN,
            credentials: true,
        },
    });

    // Authentication Middleware for Socket.IO
    io.use(async (socket, next) => {
        try {
            const token = 
                socket.handshake.auth?.token || 
                socket.handshake.headers?.token ||
                socket.handshake.headers?.cookie?.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];

            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
            const user = await User.findById(decoded._id).select("-password -refreshToken");

            if (!user) {
                return next(new Error("Authentication error: User not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            logger.error(`Socket Auth Error: ${error.message}`);
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user._id.toString();
        logger.info(`User connected: ${socket.user.username} (${socket.id})`);

        // 1. Join a private room for the user (to receive personal notifications/messages)
        socket.join(userId);

        // 2. Online Presence Handling
        User.findByIdAndUpdate(userId, { isOnline: true }).then(() => {
            socket.broadcast.emit("user:online", { userId });
        });

        // 3. Join Conversation Rooms
        socket.on("chat:join", (conversationId) => {
            socket.join(conversationId);
            logger.debug(`User ${socket.user.username} joined room: ${conversationId}`);
        });

        socket.on("chat:leave", (conversationId) => {
            socket.leave(conversationId);
            logger.debug(`User ${socket.user.username} left room: ${conversationId}`);
        });

        // 4. Typing Indicators
        socket.on("chat:typing", ({ conversationId, isTyping }) => {
            socket.to(conversationId).emit("chat:typing", {
                userId,
                username: socket.user.username,
                isTyping,
            });
        });

        // 5. Disconnect handling
        socket.on("disconnect", () => {
            logger.info(`User disconnected: ${socket.user.username}`);
            User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() }).then(() => {
                socket.broadcast.emit("user:offline", { userId, lastSeen: new Date() });
            });
        });
    });

    return io;
};

/**
 * Helper to get the IO instance from anywhere in the app
 */
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized!");
    }
    return io;
};

/**
 * Helper to emit event to a specific room/user
 */
export const emitEvent = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
    }
};
