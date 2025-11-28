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
    verifyEmail,
    requestAccountDeletion,
    confirmAccountDeletion,
} from "../controllers/user.controller.js";

import upload from "../config/cloudinary.config.js";
import { MulterError } from "multer";

const router = Router();

const handleUpload = (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
        if (err) {
            console.error(`[Upload Error] ${fieldName}:`, err);
            if (err instanceof MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res
                        .status(400)
                        .json({ message: "File too large. Limit is 10MB." });
                }
                return res.status(400).json({ message: err.message });
            }
            return res
                .status(500)
                .json({ message: err.message || "File upload failed." });
        }
        next();
    });
};

router
    .route("/update_profile_picture")
    .post(handleUpload("profile_picture"), uploadProfilePicture);

router
    .route("/update_background_picture")
    .post(handleUpload("background_picture"), uploadBackgroundPicture);

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/forgot_password").post(forgotPassword);
router.route("/reset_password/:token").put(resetPassword);

// --- NEW VERIFICATION ROUTE ---
router.route("/verify/:token").get(verifyEmail);

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

router.route("/request_account_deletion").post(requestAccountDeletion);
router.route("/confirm_delete_account/:token").delete(confirmAccountDeletion);

export default router;
