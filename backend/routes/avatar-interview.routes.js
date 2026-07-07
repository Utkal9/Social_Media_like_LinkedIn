// backend/routes/avatar-interview.routes.js

import { Router } from "express";
import {
    createDIDStream,
    sendDIDSDP,
    sendDIDICE,
    sendDIDTalk,
    closeDIDStream,
    serveTempAudio,
} from "../controllers/avatar-interview.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Avatar Interview
 *   description: Photorealistic AI interviewer — D-ID WebRTC proxy + ElevenLabs audio serving
 */

/**
 * @swagger
 * /api/avatar/stream/create:
 *   post:
 *     summary: Create a D-ID streaming session (returns WebRTC SDP offer + ICE servers)
 *     tags: [Avatar Interview]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               source_url:
 *                 type: string
 *                 description: URL of the avatar presenter image (optional — uses DID_PRESENTER_URL env default)
 *     responses:
 *       200:
 *         description: Stream created. Contains id, session_id, offer (SDP), ice_servers.
 *       500:
 *         description: D-ID API error
 */
router.post("/api/avatar/stream/create", createDIDStream);

/**
 * @swagger
 * /api/avatar/stream/{id}/sdp:
 *   post:
 *     summary: Send the browser SDP answer to complete WebRTC negotiation with D-ID
 *     tags: [Avatar Interview]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answer, session_id]
 *             properties:
 *               answer: { type: object, description: RTCSessionDescriptionInit }
 *               session_id: { type: string }
 *     responses:
 *       200:
 *         description: SDP accepted
 */
router.post("/api/avatar/stream/:id/sdp", sendDIDSDP);

/**
 * @swagger
 * /api/avatar/stream/{id}/ice:
 *   post:
 *     summary: Relay an ICE candidate from the browser to D-ID
 *     tags: [Avatar Interview]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [candidate, sdpMid, sdpMLineIndex, session_id]
 *             properties:
 *               candidate: { type: string }
 *               sdpMid: { type: string }
 *               sdpMLineIndex: { type: integer }
 *               session_id: { type: string }
 *     responses:
 *       200:
 *         description: ICE candidate accepted
 */
router.post("/api/avatar/stream/:id/ice", sendDIDICE);

/**
 * @swagger
 * /api/avatar/stream/{id}/talk:
 *   post:
 *     summary: Send a talk task — avatar lip-syncs to the ElevenLabs audio URL
 *     tags: [Avatar Interview]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id]
 *             properties:
 *               session_id: { type: string }
 *               audio_url: { type: string, description: "Public URL to .mp3 — preferred for perfect lip sync" }
 *               text: { type: string, description: "Fallback if audio_url not provided — D-ID calls ElevenLabs internally" }
 *     responses:
 *       200:
 *         description: Avatar talk task queued
 */
router.post("/api/avatar/stream/:id/talk", sendDIDTalk);

/**
 * @swagger
 * /api/avatar/stream/{id}:
 *   delete:
 *     summary: Close and release a D-ID stream
 *     tags: [Avatar Interview]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id]
 *             properties:
 *               session_id: { type: string }
 *     responses:
 *       200:
 *         description: Stream closed
 */
router.delete("/api/avatar/stream/:id", closeDIDStream);

/**
 * @swagger
 * /api/avatar/audio/{filename}:
 *   get:
 *     summary: Serve a temp ElevenLabs audio file for D-ID to fetch (auto-expires in 10 min)
 *     tags: [Avatar Interview]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: audio/mpeg stream
 *       404:
 *         description: File not found or expired
 */
router.get("/api/avatar/audio/:filename", serveTempAudio);

export default router;
