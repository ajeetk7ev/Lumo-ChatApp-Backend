import { Router } from "express";
import { FriendRequestController } from "../controllers/friendRequest.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { sendRequestSchema, requestIdSchema } from "../validations/friendRequest.validation.js";

const router = Router();

// All friend request routes require authentication
router.use(verifyJWT);

router.route("/send").post(
    validate(sendRequestSchema),
    FriendRequestController.sendRequest
);

router.route("/accept/:requestId").post(
    validate(requestIdSchema),
    FriendRequestController.acceptRequest
);

router.route("/reject/:requestId").post(
    validate(requestIdSchema),
    FriendRequestController.rejectRequest
);

router.route("/pending").get(FriendRequestController.getPendingRequests);
router.route("/friends").get(FriendRequestController.getFriends);
router.route("/search").get(FriendRequestController.searchUsers);

export default router;
