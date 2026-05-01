import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { FriendRequestService } from "../services/friendRequest.service.js";

class FriendRequestController {
    static sendRequest = asyncHandler(async (req, res) => {
        const { receiverId } = req.body;
        const request = await FriendRequestService.sendRequest(req.user._id, receiverId);

        return res.status(201).json(
            new ApiResponse(201, request, "Friend request sent successfully")
        );
    });

    static acceptRequest = asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const request = await FriendRequestService.acceptRequest(req.user._id, requestId);

        return res.status(200).json(
            new ApiResponse(200, request, "Friend request accepted")
        );
    });

    static rejectRequest = asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const request = await FriendRequestService.rejectRequest(req.user._id, requestId);

        return res.status(200).json(
            new ApiResponse(200, request, "Friend request rejected")
        );
    });

    static getPendingRequests = asyncHandler(async (req, res) => {
        const requests = await FriendRequestService.getPendingRequests(req.user._id);

        return res.status(200).json(
            new ApiResponse(200, requests, "Pending requests fetched")
        );
    });

    static getFriends = asyncHandler(async (req, res) => {
        const friends = await FriendRequestService.getFriends(req.user._id);

        return res.status(200).json(
            new ApiResponse(200, friends, "Friends list fetched")
        );
    });

    static searchUsers = asyncHandler(async (req, res) => {
        const { query } = req.query;
        const users = await FriendRequestService.searchUsers(query, req.user._id);

        return res.status(200).json(
            new ApiResponse(200, users, "Users searched successfully")
        );
    });
}

export { FriendRequestController };
