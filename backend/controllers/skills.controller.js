import Profile from "../models/profile.model.js";
import MarketData from "../models/marketData.model.js";
import User from "../models/user.model.js";

// ---------------------------------------------------------------
// HELPER: resolve user from JWT token (matches existing pattern)
// ---------------------------------------------------------------
const getUserByToken = async (token) => {
    if (!token) return null;
    return await User.findOne({ token });
};

// ---------------------------------------------------------------
// HELPER: Parse all skill strings from a user's profile into a
// flat, normalized (lowercase) Set for fast comparison.
// Handles both the skills[] array AND all categorized skill strings.
// ---------------------------------------------------------------
const extractUserSkills = (profile) => {
    if (!profile) return new Set();

    const rawSkills = [];

    // skills[] array (e.g. ["React", "Node.js"])
    if (Array.isArray(profile.skills)) {
        rawSkills.push(...profile.skills);
    }

    // Categorized skill strings — comma/semicolon separated
    const categorizedFields = [
        profile.skillLanguages,
        profile.skillFrontend,
        profile.skillBackend,
        profile.skillCloudDevOps,
        profile.skillFrameworks,
        profile.skillTools,
        profile.skillCoreConcepts,
        profile.skillSoft,
        profile.specLanguages,
        profile.specTechFrameworks,
        profile.specDomainSkills,
    ];

    categorizedFields.forEach((field) => {
        if (field && typeof field === "string" && field.trim().length > 0) {
            // Split by comma or semicolon
            const parts = field.split(/[,;]+/).map((s) => s.trim());
            rawSkills.push(...parts);
        }
    });

    // Normalize: lowercase, strip whitespace, drop empties
    return new Set(
        rawSkills
            .map((s) => s.toLowerCase().trim())
            .filter((s) => s.length > 0)
    );
};

// ---------------------------------------------------------------
// GET /api/skills/recommendations
//
// Query params:
//   token (string, required) — user JWT
//   limit (number, optional) — max trending skills to return (default 10)
// ---------------------------------------------------------------
export const getSkillRecommendations = async (req, res) => {
    try {
        const { token, limit = 10 } = req.query;

        // --- Auth ---
        const user = await getUserByToken(token);
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized. Please provide a valid token.",
            });
        }

        // --- Fetch user profile ---
        const profile = await Profile.findOne({ userId: user._id });
        const userSkillSet = extractUserSkills(profile);

        // --- Fetch trending skills from DB (sorted by rank) ---
        const trendingSkills = await MarketData.find({})
            .sort({ rank: 1, frequency: -1 })
            .limit(parseInt(limit))
            .lean();

        if (trendingSkills.length === 0) {
            return res.status(200).json({
                message:
                    "Market data is still being processed. Check back shortly.",
                recommendedSkills: [],
                trendingSkills: [],
                userSkillCount: userSkillSet.size,
                lastUpdated: null,
            });
        }

        // --- Compute gaps: trending skills the user does NOT have ---
        const recommendedSkills = trendingSkills
            .filter((trendSkill) => {
                const normalized = trendSkill.skill; // already lowercase in DB
                // Check if user has any variation of this skill
                return !userSkillSet.has(normalized);
            })
            .map((trendSkill) => ({
                displayName: trendSkill.displayName,
                skill: trendSkill.skill,
                frequency: trendSkill.frequency,
                rank: trendSkill.rank,
                category: trendSkill.category,
                lastUpdated: trendSkill.lastUpdated,
            }));

        // --- Skills the user already has that are trending (for encouragement) ---
        const matchedSkills = trendingSkills
            .filter((trendSkill) => userSkillSet.has(trendSkill.skill))
            .map((s) => s.displayName);

        const lastUpdated =
            trendingSkills[0]?.lastUpdated || null;

        return res.status(200).json({
            recommendedSkills,
            trendingSkills: trendingSkills.map((s) => ({
                displayName: s.displayName,
                frequency: s.frequency,
                rank: s.rank,
                category: s.category,
            })),
            matchedSkills,
            userSkillCount: userSkillSet.size,
            lastUpdated,
            meta: {
                totalTrending: trendingSkills.length,
                totalRecommended: recommendedSkills.length,
                totalMatched: matchedSkills.length,
            },
        });
    } catch (error) {
        console.error("[Skills Controller] getSkillRecommendations error:", error);
        return res.status(500).json({
            message: "Server error while fetching recommendations.",
            error: error.message,
        });
    }
};

// ---------------------------------------------------------------
// GET /api/skills/trending
// Public endpoint — returns current trending skills without auth
// ---------------------------------------------------------------
export const getTrendingSkills = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const trendingSkills = await MarketData.find({})
            .sort({ rank: 1, frequency: -1 })
            .limit(parseInt(limit))
            .lean();

        const lastUpdated = trendingSkills[0]?.lastUpdated || null;

        return res.status(200).json({
            trendingSkills: trendingSkills.map((s) => ({
                displayName: s.displayName,
                frequency: s.frequency,
                rank: s.rank,
                category: s.category,
                source: s.source,
            })),
            lastUpdated,
            total: trendingSkills.length,
        });
    } catch (error) {
        console.error("[Skills Controller] getTrendingSkills error:", error);
        return res.status(500).json({
            message: "Server error while fetching trending skills.",
            error: error.message,
        });
    }
};
