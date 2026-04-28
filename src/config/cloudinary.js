import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";
import logger from "./logger.js";

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary by converting to Data URI.
 * @param {Buffer} fileBuffer - The file buffer.
 * @param {string} mimetype - The file mimetype.
 * @returns {Promise<Object|null>}
 */
const uploadOnCloudinary = async (fileBuffer, mimetype) => {
    try {
        if (!fileBuffer) return null;

        const base64Data = fileBuffer.toString("base64");
        const dataUri = `data:${mimetype};base64,${base64Data}`;

        const response = await cloudinary.uploader.upload(dataUri, {
            resource_type: "auto",
            folder: "lumo-avatars",
        });

        logger.info(`File uploaded on Cloudinary: ${response.url}`);
        return response;
    } catch (error) {
        logger.error(`Cloudinary upload failed: ${error.message}`);
        return null;
    }
};

export { uploadOnCloudinary };
