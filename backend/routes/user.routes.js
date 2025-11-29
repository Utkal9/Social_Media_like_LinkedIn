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

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: User authentication and account management
 *   - name: Profile
 *     description: User profile and resume data
 *   - name: Connections
 *     description: Network and connection requests
 */

/**
 * @openapi
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: User already exists
 */
router.route("/register").post(register);

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       403:
 *         description: Email verification required
 *       404:
 *         description: User not found
 */
router.route("/login").post(login);

/**
 * @openapi
 * /verify/{token}:
 *   get:
 *     summary: Verify email address
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to login page
 *       400:
 *         description: Invalid token
 */
router.route("/verify/:token").get(verifyEmail);

/**
 * @openapi
 * /forgot_password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent
 *       404:
 *         description: User not found
 */
router.route("/forgot_password").post(forgotPassword);

/**
 * @openapi
 * /reset_password/{token}:
 *   put:
 *     summary: Reset password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 */
router.route("/reset_password/:token").put(resetPassword);

/**
 * @openapi
 * /request_account_deletion:
 *   post:
 *     summary: Request account deletion (email sent)
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.route("/request_account_deletion").post(requestAccountDeletion);

/**
 * @openapi
 * /confirm_delete_account/{token}:
 *   delete:
 *     summary: Confirm account deletion
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account deleted
 */
router.route("/confirm_delete_account/:token").delete(confirmAccountDeletion);

/**
 * @openapi
 * /update_profile_picture:
 *   post:
 *     summary: Upload profile picture
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               profile_picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image updated
 */
router
    .route("/update_profile_picture")
    .post(handleUpload("profile_picture"), uploadProfilePicture);

/**
 * @openapi
 * /update_background_picture:
 *   post:
 *     summary: Upload background picture
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               background_picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image updated
 */
router
    .route("/update_background_picture")
    .post(handleUpload("background_picture"), uploadBackgroundPicture);

/**
 * @openapi
 * /get_user_and_profile:
 *   get:
 *     summary: Get current user and profile
 *     tags: [Profile]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile data
 */
router.route("/get_user_and_profile").get(getUserAndProfile);

/**
 * @openapi
 * /user_update:
 *   post:
 *     summary: Update user basic info
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 */
router.route("/user_update").post(updateUserProfile);

/**
 * @openapi
 * /update_profile_data:
 *   post:
 *     summary: Update extended profile (bio, skills, work, education)
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               bio:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               pastWork:
 *                 type: array
 *                 items:
 *                   type: object
 *               education:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.route("/update_profile_data").post(updateProfileData);

/**
 * @openapi
 * /user/getAllUserProfile:
 *   get:
 *     summary: Get all user profiles
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: List of profiles
 */
router.route("/user/getAllUserProfile").get(getAllUserProfile);

/**
 * @openapi
 * /user/download_resume:
 *   get:
 *     summary: Download resume in DOCX format
 *     tags: [Profile]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: DOCX file
 */
router.route("/user/download_resume").get(downloadProfile);

/**
 * @openapi
 * /user/get_profile_based_on_username:
 *   get:
 *     summary: Get profile by username
 *     tags: [Profile]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public profile
 */
router
    .route("/user/get_profile_based_on_username")
    .get(getUserProfileAndUserBasedOnUername);

/**
 * @openapi
 * /user/send_connection_request:
 *   post:
 *     summary: Send connection request
 *     tags: [Connections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               connectionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request sent
 */
router.route("/user/send_connection_request").post(sendConnectionRequest);

/**
 * @openapi
 * /user/getConnectionRequests:
 *   get:
 *     summary: Get requests sent BY user
 *     tags: [Connections]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of sent requests
 */
router.route("/user/getConnectionRequests").get(getMyConnectionsRequests);

/**
 * @openapi
 * /user/user_connection_request:
 *   get:
 *     summary: Get connection requests RECEIVED by user
 *     tags: [Connections]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of received requests
 */
router.route("/user/user_connection_request").get(whatAreMyConnections);

/**
 * @openapi
 * /user/accept_connection_request:
 *   post:
 *     summary: Accept or decline connection request
 *     tags: [Connections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               requestId:
 *                 type: string
 *               action_type:
 *                 type: string
 *                 enum:
 *                   - accept
 *                   - decline
 *     responses:
 *       200:
 *         description: Action complete
 */
router.route("/user/accept_connection_request").post(acceptConnectionRequest);

export default router;
