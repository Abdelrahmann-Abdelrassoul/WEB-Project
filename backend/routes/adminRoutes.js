import express from "express";
import { getStats, patchUserStatus, getModeration } from "../controllers/adminController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require a valid JWT + admin role
router.use(protect, restrictTo("admin"));

router.get("/stats",              getStats);
router.get("/moderation",         getModeration);
router.patch("/users/:id/status", patchUserStatus);

export default router;