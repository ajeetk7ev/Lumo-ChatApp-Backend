import mongoose from 'mongoose';
import env from '../config/env.js';
import logger from '../config/logger.js';

const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGO_URI);
        logger.info("MongoDB Connected!");
    } catch (error) {
        logger.error("MONGODB connection FAILED ", error);
        process.exit(1);
    }
};

export default connectDB;