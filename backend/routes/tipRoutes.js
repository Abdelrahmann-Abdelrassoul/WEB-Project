import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCheckout,
  stripeWebhook,
  getMyBalance,
  getMyTipHistory,
  getTipPresets,
} from "../controllers/tipController.js";
import { tipLimiter } from "../config/rateLimiter.js";
import validate from "../middleware/validateMiddleware.js";
import { createTipSchema } from "../utils/validators.js";

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

router.get("/presets", getTipPresets);
router.post("/checkout", protect, tipLimiter, validate(createTipSchema), createCheckout);
router.get("/balance", protect, getMyBalance);
router.get("/history", protect, getMyTipHistory);

export default router;