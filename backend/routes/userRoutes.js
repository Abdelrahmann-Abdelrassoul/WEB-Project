import express from "express";
import {
  getMe,
  updateMe,
  getUserById,
  follow,
  unfollow,
  listFollowers,
  listFollowing,
  updatePreferences,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import {
  updateMeSchema,
  updateNotificationPreferencesSchema,
} from "../utils/validators.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.patch("/updateMe", protect, validate(updateMeSchema), updateMe);
router.patch(
  "/preferences",
  protect,
  validate(updateNotificationPreferencesSchema),
  updatePreferences
);
router.post("/:id/follow", protect, follow);
router.delete("/:id/unfollow", protect, unfollow);
router.get("/:id/followers", listFollowers);
router.get("/:id/following", listFollowing);
router.get("/:id", getUserById);

export default router;
