import Stripe from "stripe";
import Transaction from "../models/transactionModel.js";
import Video from "../models/videoModel.js";
import User from "../models/userModel.js";
import AppError from "../utils/appError.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Preset tip amounts in cents that the UI offers (plus a custom option)
export const TIP_PRESETS_CENTS = [100, 200, 500, 1000, 2000];

/**
 * Create a Stripe Checkout Session for a one-time tip.
 *
 * @param {object} opts
 * @param {string} opts.videoId       - Video being tipped against
 * @param {string} opts.tipperId      - Authenticated user sending the tip
 * @param {number} opts.amountCents   - Tip amount in cents (min 50)
 * @param {string} [opts.message]     - Optional personal message
 * @param {string} opts.successUrl    - Frontend redirect on success
 * @param {string} opts.cancelUrl     - Frontend redirect on cancel
 * @returns {{ checkoutUrl: string, transactionId: string }}
 */
export const createTipCheckoutSession = async ({
  videoId,
  tipperId,
  amountCents,
  message = "",
  successUrl,
  cancelUrl,
}) => {
  if (!amountCents || amountCents < 50) {
    throw new AppError("Minimum tip amount is $0.50", 400);
  }

  // Resolve video + creator
  const video = await Video.findById(videoId).populate("owner", "_id username email").lean();
  if (!video) throw new AppError("Video not found", 404);

  const creatorId = String(video.owner._id);

  if (creatorId === String(tipperId)) {
    throw new AppError("You cannot tip your own video", 400);
  }

  // Create a pending Transaction document first so we have an ID to embed in
  // the Stripe metadata (enables reliable idempotency on the webhook side).
  const transaction = await Transaction.create({
    tipper: tipperId,
    creator: creatorId,
    video: videoId,
    amountCents,
    message,
    status: "pending",
  });

  // Build Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Tip for "${video.title}"`,
            description: message || `Supporting ${video.owner.username} on ClipSphere`,
          },
        },
      },
    ],
    metadata: {
      transactionId: String(transaction._id),
      tipperId: String(tipperId),
      creatorId,
      videoId: String(videoId),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  // Persist the session ID so the webhook can match it
  transaction.stripeSessionId = session.id;
  await transaction.save();

  return {
    checkoutUrl: session.url,
    transactionId: String(transaction._id),
    sessionId: session.id,
  };
};

/**
 * Handle checkout.session.completed webhook event.
 * Verifies the Stripe signature, marks the Transaction as completed.
 *
 * @param {Buffer}  rawBody   - Raw request body (required for sig verification)
 * @param {string}  signature - Value of stripe-signature header
 * @returns {Transaction}     - Updated transaction document
 */
export const handleCheckoutCompleted = async (rawBody, signature) => {
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new AppError(`Webhook signature verification failed: ${err.message}`, 400);
  }

  if (event.type !== "checkout.session.completed") {
    // We only process this event type; ignore others silently
    return null;
  }

  const session = event.data.object;
  const { transactionId } = session.metadata ?? {};

  if (!transactionId) {
    throw new AppError("Webhook payload missing transactionId metadata", 400);
  }

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new AppError(`Transaction ${transactionId} not found`, 404);
  }

  // Idempotency guard – don't double-process
  if (transaction.status === "completed") {
    return transaction;
  }

  transaction.status = "completed";
  transaction.stripePaymentIntentId = session.payment_intent ?? null;
  transaction.confirmedAt = new Date();
  await transaction.save();

  return transaction;
};

/**
 * Get a creator's pending balance (sum of completed tips).
 *
 * @param {string} creatorId
 * @returns {{ pendingBalanceCents: number, pendingBalanceDollars: number }}
 */
export const getCreatorBalance = async (creatorId) => {
  const result = await Transaction.aggregate([
    { $match: { creator: creatorId, status: "completed" } },
    { $group: { _id: null, total: { $sum: "$amountCents" } } },
  ]);

  const pendingBalanceCents = result[0]?.total ?? 0;

  return {
    pendingBalanceCents,
    pendingBalanceDollars: pendingBalanceCents / 100,
  };
};

/**
 * Get paginated tip history for a creator.
 *
 * @param {string} creatorId
 * @param {{ limit?: number, skip?: number }} pagination
 * @returns {{ transactions: Transaction[], total: number }}
 */
export const getCreatorTipHistory = async (creatorId, { limit = 20, skip = 0 } = {}) => {
  const [transactions, total] = await Promise.all([
    Transaction.find({ creator: creatorId, status: "completed" })
      .sort({ confirmedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("tipper", "username avatarKey")
      .populate("video", "title")
      .lean(),
    Transaction.countDocuments({ creator: creatorId, status: "completed" }),
  ]);

  return { transactions, total };
};
