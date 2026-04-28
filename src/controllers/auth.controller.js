import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AuthService } from "../services/auth.service.js";
import env from "../config/env.js";

/**
 * AuthController — thin layer that handles HTTP concerns
 * (req/res, cookies, status codes) and delegates to AuthService.
 */
class AuthController {
    static cookieOptions = {
        httpOnly: true,
        secure: env.isProd,
    };

    static register = asyncHandler(async (req, res) => {
        const { fullName, email, username, password } = req.body;
        const file = req.file;

        const createdUser = await AuthService.register({
            fullName,
            email,
            username,
            password,
            file,
        });


        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered successfully")
        );
    });

    static login = asyncHandler(async (req, res) => {
        const { identifier, password } = req.body;

        const { user, accessToken, refreshToken } = await AuthService.login({
            identifier,
            password,
        });

        return res
            .status(200)
            .cookie("accessToken", accessToken, AuthController.cookieOptions)
            .cookie("refreshToken", refreshToken, AuthController.cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { user, accessToken, refreshToken },
                    "User logged in successfully"
                )
            );
    });

    static logout = asyncHandler(async (req, res) => {
        await AuthService.logout(req.user._id);

        return res
            .status(200)
            .clearCookie("accessToken", AuthController.cookieOptions)
            .clearCookie("refreshToken", AuthController.cookieOptions)
            .json(new ApiResponse(200, {}, "User logged out"));
    });

    static refreshAccessToken = asyncHandler(async (req, res) => {
        const incomingRefreshToken =
            req.cookies.refreshToken || req.body.refreshToken;

        const { accessToken, refreshToken } =
            await AuthService.refreshAccessToken(incomingRefreshToken);

        return res
            .status(200)
            .cookie("accessToken", accessToken, AuthController.cookieOptions)
            .cookie("refreshToken", refreshToken, AuthController.cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            );
    });
}

export { AuthController };
