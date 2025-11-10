import { Router } from "express";
import {
    register,
    login,
    uploadProfilePicture,
    updateUserProfile,
    getUserAndProfile,
    updateProfileData,
    getAllUserProfile,
    downloadProfile,
    sendConnectionRequest,
    getUserProfileAndUserBasedOnUername,
    respondToConnectionRequest,
    getMyNetwork,
    getPendingIncomingRequests,
    getPendingSentRequests,
} from "../controllers/user.controller.js";

// --- CHANGED ---
// We import our configured Cloudinary uploader
import upload from "../config/cloudinary.config.js";
// We no longer need the local multer
// import multer from "multer";
// --- CHANGED ---

const router = Router();

// --- DELETED ---
// All of this local storage code is no longer needed.
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "uploads/");
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.originalname);
//     },
// });
// const upload = multer({ storage: storage });
// --- DELETED ---

router
    .route("/update_profile_picture")
    // This 'upload' is now the Cloudinary uploader we imported
    .post(upload.single("profile_picture"), uploadProfilePicture);

// --- All other routes are unchanged ---
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/user_update").post(updateUserProfile);
router.route("/get_user_and_profile").get(getUserAndProfile);
router.route("/update_profile_data").post(updateProfileData);
router.route("/user/getAllUserProfile").get(getAllUserProfile);
router.route("/user/download_resume").get(downloadProfile);
router.route("/user/send_connection_request").post(sendConnectionRequest);
router
    .route("/user/get_profile_based_on_username")
    .get(getUserProfileAndUserBasedOnUername);
router
    .route("/user/respond_connection_request")
    .post(respondToConnectionRequest);
router.route("/user/get_my_network").get(getMyNetwork);
router.route("/user/get_pending_incoming").get(getPendingIncomingRequests);
router.route("/user/get_pending_sent").get(getPendingSentRequests);
export default router;
