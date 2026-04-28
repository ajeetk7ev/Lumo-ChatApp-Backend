import { FriendRequest } from "../models/friendRequest.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

class FriendRequestService {
    /**
     * Send a friend request
     */
    static async sendRequest(senderId, receiverId) {
        if (senderId.toString() === receiverId.toString()) {
            throw new ApiError(400, "You cannot send a friend request to yourself");
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            throw new ApiError(404, "Receiver user not found");
        }

        // Check if a request already exists in either direction
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        });

        if (existingRequest) {
            if (existingRequest.status === "accepted") {
                throw new ApiError(400, "You are already friends with this user");
            }
            if (existingRequest.status === "pending") {
                throw new ApiError(400, "A friend request is already pending");
            }
            // If rejected, we allow sending again? Or update to pending?
            // Usually, we just update the existing one back to pending
            if (existingRequest.status === "rejected") {
                existingRequest.status = "pending";
                existingRequest.sender = senderId;
                existingRequest.receiver = receiverId;
                await existingRequest.save();
                return existingRequest;
            }
        }

        const newRequest = await FriendRequest.create({
            sender: senderId,
            receiver: receiverId,
            status: "pending",
        });

        return newRequest;
    }

    /**
     * Accept a friend request
     */
    static async acceptRequest(userId, requestId) {
        const request = await FriendRequest.findById(requestId);

        if (!request) {
            throw new ApiError(404, "Friend request not found");
        }

        // Only the receiver can accept
        if (request.receiver.toString() !== userId.toString()) {
            throw new ApiError(403, "You can only accept requests sent to you");
        }

        if (request.status !== "pending") {
            throw new ApiError(400, `Request is already ${request.status}`);
        }

        request.status = "accepted";
        await request.save();

        return request;
    }

    /**
     * Reject a friend request
     */
    static async rejectRequest(userId, requestId) {
        const request = await FriendRequest.findById(requestId);

        if (!request) {
            throw new ApiError(404, "Friend request not found");
        }

        if (request.receiver.toString() !== userId.toString()) {
            throw new ApiError(403, "You can only reject requests sent to you");
        }

        request.status = "rejected";
        await request.save();

        return request;
    }

    /**
     * Get all pending requests for a user
     */
    static async getPendingRequests(userId) {
        return await FriendRequest.find({
            receiver: userId,
            status: "pending",
        }).populate("sender", "username fullName avatar");
    }

    /**
     * Get all friends of a user
     */
    static async getFriends(userId) {
        const friendShips = await FriendRequest.find({
            $or: [{ sender: userId }, { receiver: userId }],
            status: "accepted",
        }).populate("sender receiver", "username fullName avatar");

        // Extract the friend object (the one who is not the current user)
        return friendShips.map((f) => {
            return f.sender._id.toString() === userId.toString()
                ? f.receiver
                : f.sender;
        });
    }
}

export { FriendRequestService };
