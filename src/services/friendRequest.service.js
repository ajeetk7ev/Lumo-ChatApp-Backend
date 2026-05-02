import { FriendRequest } from "../models/friendRequest.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { emitEvent } from "../socket/index.js";

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

        // Emit real-time notification to receiver
        const populatedRequest = await FriendRequest.findById(newRequest._id).populate("sender", "username fullName avatar");
        emitEvent(receiverId.toString(), "friend:request_received", populatedRequest);

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

        // Populate to get friend details
        const populatedRequest = await FriendRequest.findById(request._id).populate("sender receiver", "username fullName avatar");
        
        const friend = populatedRequest.sender._id.toString() === userId.toString() 
            ? populatedRequest.receiver 
            : populatedRequest.sender;

        // Emit to the sender that their request was accepted
        emitEvent(populatedRequest.sender._id.toString(), "friend:request_accepted", {
            request: populatedRequest,
            friend: populatedRequest.receiver // If sender is the one who sent, receiver is the friend
        });

        // Emit to the receiver (current user) as well (for other devices)
        emitEvent(populatedRequest.receiver._id.toString(), "friend:request_accepted", {
            request: populatedRequest,
            friend: populatedRequest.sender // If receiver is the one who accepted, sender is the friend
        });

        return { request: populatedRequest, friend };
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

    /**
     * Search users by username or fullName with pagination
     */
    static async searchUsers(query, currentUserId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        
        let filter = { _id: { $ne: currentUserId } };
        
        if (query) {
            filter = {
                $and: [
                    filter,
                    {
                        $or: [
                            { username: { $regex: query, $options: "i" } },
                            { fullName: { $regex: query, $options: "i" } },
                        ],
                    },
                ],
            };
        }

        const totalUsers = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select("username fullName avatar")
            .skip(skip)
            .limit(limit);

        const userIds = users.map(u => u._id);

        const requests = await FriendRequest.find({
            $or: [
                { sender: currentUserId, receiver: { $in: userIds } },
                { sender: { $in: userIds }, receiver: currentUserId }
            ]
        });

        const usersWithStatus = users.map(user => {
            const request = requests.find(r => 
                (r.sender.toString() === currentUserId.toString() && r.receiver.toString() === user._id.toString()) ||
                (r.sender.toString() === user._id.toString() && r.receiver.toString() === currentUserId.toString())
            );

            return {
                ...user.toObject(),
                friendshipStatus: request ? request.status : "none",
                isSender: request ? request.sender.toString() === currentUserId.toString() : false
            };
        });

        return {
            users: usersWithStatus,
            pagination: {
                total: totalUsers,
                page: Number(page),
                limit: Number(limit),
                hasNextPage: totalUsers > skip + users.length
            }
        };
    }
}

export { FriendRequestService };
