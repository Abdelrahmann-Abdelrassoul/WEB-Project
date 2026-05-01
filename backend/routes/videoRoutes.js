import express from "express";
import {
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  loadVideo,
  streamVideo,
  getVideo,
  listVideoReviews,
  likeVideo,
  unlikeVideo,
} from "../controllers/videoController.js";
import { createReview, loadReview, updateReview, deleteReview as deleteReviewController } from "../controllers/reviewController.js";
import { createVideoSchema, updateVideoSchema, createReviewSchema, updateReviewSchema } from "../utils/validators.js";
import validate from "../middleware/validateMiddleware.js";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";
import { handleVideoUpload } from "../middleware/uploadMiddleware.js";
import { checkOwnership } from "../middleware/ownershipMiddleware.js";
import { uploadLimiter } from "../config/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: List all public videos (paginated)
 *     tags: [Videos]
 *     parameters:
 *       - $ref: '#/components/parameters/limitQuery'
 *       - $ref: '#/components/parameters/skipQuery'
 *       - $ref: '#/components/parameters/pageQuery'
 *       - in: query
 *         name: feed
 *         schema:
 *           type: string
 *           enum: [all, following, trending]
 *         description: Feed mode. Use `following` to return videos only from accounts the authenticated user follows, or `trending` to rank by recent engagement and average review score.
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string
 *         description: Filter videos by owner user id.
 *     responses:
 *       200:
 *         description: A paginated list of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 20
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     skip:
 *                       type: integer
 *                       example: 40
 *                     total:
 *                       type: integer
 *                       example: 128
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *                     nextSkip:
 *                       type: integer
 *                       nullable: true
 *                       example: 60
 *                     feed:
 *                       type: string
 *                       example: all
 *                 data:
 *                   type: object
 *                   properties:
 *                     videos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Video'
 */
router.get("/", optionalProtect, listVideos);

/**
 * @swagger
 * /videos:
 *   post:
 *     summary: Create a new video
 *     tags: [Videos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVideoRequest'
 *     responses:
 *       201:
 *         description: Video created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     video:
 *                       $ref: '#/components/schemas/Video'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/", protect, uploadLimiter, handleVideoUpload, validate(createVideoSchema), createVideo);

/**
 * @swagger
 * /videos/{id}/reviews:
 *   post:
 *     summary: Add a review to a video
 *     tags: [Videos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/videoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: User has already reviewed this video
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/:id/reviews",
  protect,
  loadVideo,
  validate(createReviewSchema),
  createReview
);

router.post(
  "/:id/likes",
  protect,
  loadVideo,
  likeVideo
);

router.delete(
  "/:id/likes",
  protect,
  loadVideo,
  unlikeVideo
);

router.patch(
  "/:id/reviews/:reviewId",
  protect,
  loadVideo,
  loadReview,
  checkOwnership((req) => req.review.user),
  validate(updateReviewSchema),
  updateReview
);

router.delete(
  "/:id/reviews/:reviewId",
  protect,
  loadVideo,
  loadReview,
  checkOwnership((req) => req.review.user),
  deleteReviewController
);

router.get(
  "/:id/reviews",
  optionalProtect,
  loadVideo,
  listVideoReviews
);

router.get(
  "/:id",
  optionalProtect,
  loadVideo,
  getVideo
);

/**
 * @swagger
 * /videos/{id}:
 *   patch:
 *     summary: Update a video (owner only)
 *     tags: [Videos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/videoId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVideoRequest'
 *     responses:
 *       200:
 *         description: Video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     video:
 *                       $ref: '#/components/schemas/Video'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  "/:id",
  protect,
  loadVideo,
  checkOwnership((req) => req.video.owner),
  validate(updateVideoSchema),
  updateVideo
);

/**
 * @swagger
 * /videos/{id}:
 *   delete:
 *     summary: Delete a video (owner only)
 *     tags: [Videos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/videoId'
 *     responses:
 *       204:
 *         description: Video deleted — no content returned
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/:id",
  protect,
  loadVideo,
  checkOwnership((req) => req.video.owner),
  deleteVideo
);

router.get(
  "/:id/stream",
  protect,
  streamVideo
)

export default router;