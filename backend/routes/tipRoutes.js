import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCheckout,
  stripeWebhook,
  getMyBalance,
  getMyTipHistory,
  getTipPresets,
} from "../controllers/tipController.js";

const router = express.Router();

/**
 * Webhook must receive the RAW body so Stripe can verify the
 * signature.  We mount this BEFORE the express.json() middleware that the
 * parent app applies, by using express.raw() here at the route level.
 *
 * Stripe CLI local testing:
 *   stripe listen --forward-to localhost:5000/api/v1/tips/webhook
 */
router.post("/webhook", stripeWebhook);

// All routes below use the normal JSON-parsed body
router.get("/presets", getTipPresets);
router.post("/checkout", protect, createCheckout);
router.get("/balance", protect, getMyBalance);
router.get("/history", protect, getMyTipHistory);

export default router;
