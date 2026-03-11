import express from "express";
import { listVideos, createVideo } from "../controllers/videoController.js";
import { createVideoSchema } from "../utils/validators.js";
import validate from "../middleware/validateMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listVideos);
router.post("/", protect, validate(createVideoSchema), createVideo);

export default router;