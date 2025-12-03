import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const generateToken = () => crypto.randomBytes(32).toString("hex");

// Default image URL (Used to check if user has changed their pic)
const DEFAULT_PROFILE_PIC =
    "https://res.cloudinary.com/dx28uxwrg/image/upload/v1762799986/default_dlizpg.jpg";

const authCallback = async (_accessToken, _refreshToken, profile, done) => {
    try {
        // 1. Check if user exists
        let user = await User.findOne({
            $or: [
                { email: profile.emails[0].value },
                { googleId: profile.id },
                { githubId: profile.id },
            ],
        });

        const newToken = generateToken();

        // --- Get HD Photo from Provider ---
        let socialPicture = null;
        if (profile.photos && profile.photos.length > 0) {
            socialPicture = profile.photos[0].value;
            // Google: Replace s96-c (small) with s1024-c (HD)
            if (profile.provider === "google") {
                socialPicture = socialPicture.replace("=s96-c", "=s1024-c");
            }
        }

        if (user) {
            // 2. USER EXISTS: Update Token & IDs
            user.token = newToken;
            if (profile.provider === "google" && !user.googleId)
                user.googleId = profile.id;
            if (profile.provider === "github" && !user.githubId)
                user.githubId = profile.id;

            // --- SMART PHOTO SYNC LOGIC ---
            // Only overwrite if:
            // A. The current picture is the DEFAULT placeholder.
            // B. OR The current picture is NOT from Cloudinary (meaning it's an old/expired social link).
            // This PRESERVES custom pictures uploaded by the user (which are on Cloudinary).

            const currentPic = user.profilePicture;
            const isDefault = currentPic === DEFAULT_PROFILE_PIC;
            const isCustomUpload =
                currentPic && currentPic.includes("cloudinary") && !isDefault;

            // If we have a new social picture AND the current one is NOT a custom upload
            if (socialPicture && !isCustomUpload) {
                user.profilePicture = socialPicture;
            }

            await user.save();
            return done(null, user);
        } else {
            // 3. NEW USER: Create account
            const baseUsername = profile.emails[0].value.split("@")[0];
            const uniqueUsername = `${baseUsername}_${crypto.randomInt(
                1000,
                9999
            )}`;

            const newUser = new User({
                name: profile.displayName || profile.username,
                email: profile.emails[0].value,
                username: uniqueUsername,
                // Use social picture if available, otherwise default
                profilePicture: socialPicture || DEFAULT_PROFILE_PIC,
                token: newToken,
                googleId:
                    profile.provider === "google" ? profile.id : undefined,
                githubId:
                    profile.provider === "github" ? profile.id : undefined,
            });

            // Create the Profile Document
            const newProfile = new Profile({ userId: newUser._id });

            await newUser.save();
            await newProfile.save();

            return done(null, newUser);
        }
    } catch (error) {
        return done(error, null);
    }
};

// --- STRATEGIES ---

const BASE_URL = process.env.BACKEND_URL || "http://localhost:9090";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${BASE_URL}/auth/google/callback`,
            proxy: true,
        },
        authCallback
    )
);

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${BASE_URL}/auth/github/callback`,
            scope: ["user:email"],
            proxy: true,
        },
        authCallback
    )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => done(null, user));
});

export default passport;
