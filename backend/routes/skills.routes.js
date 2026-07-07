import { Router } from "express";
import {
    getSkillRecommendations,
    getTrendingSkills,
} from "../controllers/skills.controller.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Skills
 *     description: Labor market analytics and skill gap recommendations
 */

/**
 * @openapi
 * /api/skills/recommendations:
 *   get:
 *     summary: Get personalized skill recommendations
 *     description: >
 *       Compares the authenticated user's profile skills against the current
 *       trending skills database (updated every 6 hours via AI analysis of
 *       real job listings). Returns a list of high-demand skills the user
 *       has not yet listed on their profile.
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: User JWT token
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of trending skills to fetch (default 10)
 *     responses:
 *       200:
 *         description: Skill recommendations returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendedSkills:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       displayName:
 *                         type: string
 *                       frequency:
 *                         type: number
 *                       rank:
 *                         type: number
 *                       category:
 *                         type: string
 *                 trendingSkills:
 *                   type: array
 *                 matchedSkills:
 *                   type: array
 *                   items:
 *                     type: string
 *                 userSkillCount:
 *                   type: number
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                 meta:
 *                   type: object
 *       401:
 *         description: Unauthorized — invalid or missing token
 *       500:
 *         description: Server error
 */
router.route("/api/skills/recommendations").get(getSkillRecommendations);

/**
 * @openapi
 * /api/skills/trending:
 *   get:
 *     summary: Get current trending technical skills
 *     description: >
 *       Public endpoint. Returns the latest trending skills extracted from
 *       real job listings via AI analysis. Updated every 6 hours.
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending skills list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trendingSkills:
 *                   type: array
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                 total:
 *                   type: number
 *       500:
 *         description: Server error
 */
router.route("/api/skills/trending").get(getTrendingSkills);

export default router;
