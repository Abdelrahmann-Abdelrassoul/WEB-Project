import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import {
  createTipCheckoutSession,
  handleCheckoutCompleted,
  getCreatorBalance,
  getCreatorTipHistory,
  TIP_PRESETS_CENTS,
} from "../services/tipService.js";

/**
 * POST /api/v1/tips/checkout
 * Create a Stripe Checkout session for a one-time tip.
 *
 * Body: { videoId, amountCents, message? }
 */
export const createCheckout = catchAsync(async (req, res, next) => {
  const { videoId, amountCents, message } = req.body;

  if (!videoId) return next(new AppError("videoId is required", 400));
  if (!amountCents || typeof amountCents !== "number") {
    return next(new AppError("amountCents must be a positive number", 400));
  }

  const origin = req.headers.origin || process.env.CLIENT_URL || "http://localhost:3000";

  const result = await createTipCheckoutSession({
    videoId,
    tipperId: req.user._id,
    amountCents,
    message,
    successUrl: `${origin}/tip/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/video/${videoId}`,
  });

  res.status(201).json({
    status: "success",
    data: result,
  });
});

/**
 * POST /api/v1/tips/webhook
 * Receive and verify Stripe CLI / production webhook.
 *
 * Express must expose the RAW body on this route (no json() middleware).
 * See tipRoutes.js for how this is wired.
 */
export const stripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  try {
    const transaction = await handleCheckoutCompleted(req.body, signature);

    if (!transaction) {
      // Unhandled event type – acknowledge to stop Stripe retrying
      return res.status(200).json({ received: true });
    }

    return res.status(200).json({
      received: true,
      transactionId: String(transaction._id),
      status: transaction.status,
    });
  } catch (err) {
    console.error("[webhook] error:", err.message);
    return res.status(err.statusCode || 400).json({ error: err.message });
  }
};

/**
 * GET /api/v1/tips/balance
 * Return the authenticated creator's pending balance.
 */
export const getMyBalance = catchAsync(async (req, res) => {
  const balance = await getCreatorBalance(req.user._id);

  res.status(200).json({
    status: "success",
    data: balance,
  });
});

/**
 * GET /api/v1/tips/history
 * Return the authenticated creator's completed tip history.
 * Query params: limit, skip
 */
export const getMyTipHistory = catchAsync(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const skip = Math.max(Number(req.query.skip) || 0, 0);

  const { transactions, total } = await getCreatorTipHistory(req.user._id, { limit, skip });

  res.status(200).json({
    status: "success",
    results: transactions.length,
    total,
    data: { transactions },
  });
});

/**
 * GET /api/v1/tips/presets
 * Utility – return the tip amount presets so the frontend stays in sync.
 */
export const getTipPresets = catchAsync(async (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      presets: TIP_PRESETS_CENTS.map((cents) => ({
        cents,
        dollars: cents / 100,
        label: `$${(cents / 100).toFixed(2)}`,
      })),
    },
  });
});
