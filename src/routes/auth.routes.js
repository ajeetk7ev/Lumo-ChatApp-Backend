import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";

const router = Router();

router.route("/register").post(
    upload.single("avatar"),
    validate(registerSchema),
    AuthController.register
);

router.route("/login").post(
    validate(loginSchema),
    AuthController.login
);

// Secured routes
router.route("/logout").post(verifyJWT, AuthController.logout);
router.route("/refresh-token").post(AuthController.refreshAccessToken);

export default router;
