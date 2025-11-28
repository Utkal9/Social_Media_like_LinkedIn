import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const generateToken = () => crypto.randomBytes(32).toString("hex");

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
        // Get the photo URL from the provider (Google/GitHub)
        const socialPicture =
            profile.photos && profile.photos.length > 0
                ? profile.photos[0].value
                : null;

        if (user) {
            // 2. USER EXISTS: Update Token & Info
            user.token = newToken;
            if (profile.provider === "google" && !user.googleId)
                user.googleId = profile.id;
            if (profile.provider === "github" && !user.githubId)
                user.githubId = profile.id;

            // --- FORCE PHOTO SYNC ---
            // Always update the photo to the latest one from Google/GitHub
            // This fixes broken images automatically on next login
            if (socialPicture) {
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
                // Use social picture directly
                profilePicture:
                    socialPicture ||
                    "https://res.cloudinary.com/dx28uxwrg/image/upload/v1762799986/default_dlizpg.jpg",
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
