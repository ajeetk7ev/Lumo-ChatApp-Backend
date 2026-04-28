import mongoose from "mongoose";
import connectDB from "./config/db.js";
import { app } from "./app.js";
import env from "./config/env.js";
import logger from "./config/logger.js";

const startServer = async () => {
    try {
        await connectDB();

        app.on("error", (error) => {
            logger.error("Express App Error: ", error);
            throw error;
        });

        const server = app.listen(config.PORT, () => {
            logger.info(`Server is running at port : ${env.PORT}`);
        });

        const shutdown = () => {
            logger.info("Closing HTTP server...");
            server.close(async () => {
                logger.info("HTTP server closed.");
                try {
                    await mongoose.connection.close();
                    logger.info("MongoDB connection closed.");
                    process.exit(0);
                } catch (err) {
                    logger.error("Error during MongoDB disconnect:", err);
                    process.exit(1);
                }
            });

            // Force close after 10s
            setTimeout(() => {
                logger.error("Could not close connections in time, forcefully shutting down");
                process.exit(1);
            }, 10000);
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);

        // Handle unhandled promise rejections
        process.on("unhandledRejection", (err) => {
            logger.error(`Unhandled Rejection at Promise: ${err.message}`);
            shutdown();
        });

        process.on("uncaughtException", (err) => {
            logger.error(`Uncaught Exception: ${err.message}`);
            shutdown();
        });
    } catch (err) {
        logger.error("Server startup failed !!! ", err);
        process.exit(1);
    }
};

startServer();