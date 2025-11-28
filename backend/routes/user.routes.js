import { Router } from "express";
import {
    register,
    login,
    uploadProfilePicture,
    uploadBackgroundPicture,
    updateUserProfile,
    getUserAndProfile,
    updateProfileData,
    getAllUserProfile,
    downloadProfile,
    sendConnectionRequest,
    getMyConnectionsRequests,
    whatAreMyConnections,
    acceptConnectionRequest,
    getUserProfileAndUserBasedOnUername,
    forgotPassword,
    resetPassword,
} from "../controllers/user.controller.js";

import upload from "../config/cloudinary.config.js";
import { MulterError } from "multer"; // Ensure you have multer installed

const router = Router();

// --- Middleware to handle Upload Errors gracefully ---
const handleUpload = (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
        if (err) {
            console.error(`[Upload Error] ${fieldName}:`, err);

            // Handle specific Multer errors (like file size)
            if (err instanceof MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res
                        .status(400)
                        .json({ message: "File too large. Limit is 10MB." });
                }
                return res.status(400).json({ message: err.message });
            }

            // Handle other errors (Cloudinary, etc.)
            return res
                .status(500)
                .json({ message: err.message || "File upload failed." });
        }
        next();
    });
};

// Use the wrapper for profile picture
router
    .route("/update_profile_picture")
    .post(handleUpload("profile_picture"), uploadProfilePicture);

// Use the wrapper for background picture
router
    .route("/update_background_picture")
    .post(handleUpload("background_picture"), uploadBackgroundPicture);

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/forgot_password").post(forgotPassword);
router.route("/reset_password/:token").put(resetPassword); // <--- New Route

router.route("/user_update").post(updateUserProfile);
router.route("/get_user_and_profile").get(getUserAndProfile);
router.route("/update_profile_data").post(updateProfileData);
router.route("/user/getAllUserProfile").get(getAllUserProfile);
router.route("/user/download_resume").get(downloadProfile);
router.route("/user/send_connection_request").post(sendConnectionRequest);
router.route("/user/getConnectionRequests").get(getMyConnectionsRequests);
router.route("/user/user_connection_request").get(whatAreMyConnections);
router.route("/user/accept_connection_request").post(acceptConnectionRequest);
router
    .route("/user/get_profile_based_on_username")
    .get(getUserProfileAndUserBasedOnUername);

export default router;
