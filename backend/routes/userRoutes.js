import express from "express";
import { getMe, updateMe, getUserById } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { updateMeSchema } from "../utils/validators.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.patch("/updateMe", protect, validate(updateMeSchema), updateMe);
router.get("/:id", getUserById);

export default router;