import mongoose from "mongoose";

/**
 * Transaction collection as financial ledger.
 *
 * Every tip creates one Transaction document.  The `status` field
 * acts as the ledger state machine:
 *
 *   pending   → Checkout session created, payment not yet confirmed.
 *   completed → webhook confirmed checkout.session.completed.
 *   failed    → Payment failed or session expired.
 *   refunded  → Stripe refund processed (future use).
 *
 * `amountCents` stores the raw Stripe amount (cents / smallest currency unit)
 * so arithmetic is always integer-safe.  A virtual `amountDollars` is exposed
 * for convenience.
 */
const transactionSchema = new mongoose.Schema(
  {
    // Who sent the tip
    tipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who receives the tip (the video creator)
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The video that prompted the tip (optional but useful for history)
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },

    // Amount in the smallest currency unit (e.g. cents for USD)
    amountCents: {
      type: Number,
      required: true,
      min: [50, "Minimum tip is $0.50"],
    },

    currency: {
      type: String,
      default: "usd",
      lowercase: true,
      trim: true,
    },

    // Ledger state
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    // Stripe identifiers – stored for idempotency & webhook matching
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true, // allows null before session is created
      trim: true,
    },

    stripePaymentIntentId: {
      type: String,
      default: null,
      trim: true,
    },

    // Optional personal message from tipper
    message: {
      type: String,
      default: "",
      maxlength: [200, "Tip message must not exceed 200 characters"],
      trim: true,
    },

    // Timestamp when the webhook confirmed payment
    confirmedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Convenience virtual – dollars as a float
transactionSchema.virtual("amountDollars").get(function () {
  return this.amountCents / 100;
});

// Compound index: fast lookup of a creator's completed tips (for balance calc)
transactionSchema.index({ creator: 1, status: 1 });
// Fast lookup by Stripe session (webhook handler)
transactionSchema.index({ stripeSessionId: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
