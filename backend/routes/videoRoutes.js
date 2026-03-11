import express from "express";
import { createVideo } from "../controllers/videoController.js";
import { createVideoSchema } from "../utils/validators.js";
import validate from "../middleware/validateMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, validate(createVideoSchema), createVideo);

export default router;