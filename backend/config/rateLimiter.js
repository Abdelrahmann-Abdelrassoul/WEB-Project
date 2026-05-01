import rateLimit from "express-rate-limit";

const json429 = (req, res) =>
  res.status(429).json({
    status: "fail",
    message: "Too many requests, please slow down and try again later.",
  });

/**
 * General API limiter — applied to all /api/v1/* routes.
 * 100 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

/**
 * Auth limiter — login and register only.
 * 10 attempts per 15 minutes per IP.
 * Prevents brute-force credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

/**
 * Upload limiter — video upload route.
 * 10 uploads per hour per IP.
 * Uploads hit MinIO and ffmpeg — expensive operations.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

/**
 * Tip/checkout limiter — Stripe session creation.
 * 20 per 15 minutes per IP.
 * Prevents checkout session spam.
 */
export const tipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});