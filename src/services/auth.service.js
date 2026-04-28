import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

/**
 * AuthService — contains all business logic for authentication.
 * Controllers delegate to these static methods.
 */
class AuthService {
    /**
     * Generate Access and Refresh Tokens for a user.
     * Saves the refresh token in the database.
     */
    static async generateTokens(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found during token generation");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    }

    /**
     * Register a new user.
     * Handles duplicate check, avatar upload, and user creation.
     */
    static async register({ fullName, email, username, password, file }) {
        // Check for existing user
        const existedUser = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (existedUser) {
            throw new ApiError(409, "User with email or username already exists");
        }

        // Upload avatar to Cloudinary
        if (!file) {
            throw new ApiError(400, "Avatar file is required");
        }

        const avatar = await uploadOnCloudinary(file.buffer, file.mimetype);

        if (!avatar) {
            throw new ApiError(400, "Avatar file upload failed");
        }


        // Create user
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            email,
            password,
            username,
        });

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        return createdUser;
    }

    /**
     * Login a user by email or username.
     * Returns the user object and tokens.
     */
    static async login({ identifier, password }) {
        const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier }],
        });

        if (!user) {
            throw new ApiError(404, "User does not exist");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
        }

        const { accessToken, refreshToken } = await AuthService.generateTokens(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        return { user: loggedInUser, accessToken, refreshToken };
    }

    /**
     * Logout a user by clearing their refresh token.
     */
    static async logout(userId) {
        await User.findByIdAndUpdate(
            userId,
            { $unset: { refreshToken: 1 } },
            { new: true }
        );
    }

    /**
     * Refresh the access token using a valid refresh token.
     * Also rotates the refresh token (refresh token rotation).
     */
    static async refreshAccessToken(incomingRefreshToken) {
        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET);
        } catch (error) {
            throw new ApiError(401, "Invalid or expired refresh token");
        }

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await AuthService.generateTokens(user._id);

        return { accessToken, refreshToken: newRefreshToken };
    }
}

export { AuthService };
