import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const updateMeSchema = z.object({
  username: z.string().min(3).optional(),
  bio: z.string().max(300).optional(),
  avatarKey: z.string().optional(),
});

const notificationChannelSchema = z.object({
  followers: z.boolean(),
  comments: z.boolean(),
  likes: z.boolean(),
  tips: z.boolean(),
});

const updateNotificationPreferencesSchema = z.object({
  inApp: notificationChannelSchema,
  email: notificationChannelSchema,
});

const createVideoSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must not exceed 100 characters"),
  description: z.string().max(1000, "Description must not exceed 1000 characters").optional().default(""),
});

const updateVideoSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must not exceed 100 characters").optional(),
  description: z.string().max(1000, "Description must not exceed 1000 characters").optional(),
  status: z.enum(["public", "private", "flagged"]).optional(),
});

const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must not exceed 5"),
  comment: z.string().max(500, "Comment must not exceed 500 characters").optional().default(""),
});

const updateReviewSchema = z
  .object({
    rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must not exceed 5").optional(),
    comment: z.string().max(500, "Comment must not exceed 500 characters").optional(),
  })
  .refine((data) => data.rating !== undefined || data.comment !== undefined, {
    message: "Provide at least one field to update",
    path: ["rating"],
  });

export {
  registerSchema,
  loginSchema,
  updateMeSchema,
  updateNotificationPreferencesSchema,
  createVideoSchema,
  updateVideoSchema,
  createReviewSchema,
  updateReviewSchema,
};

const createTipSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  amountCents: z
    .number({ invalid_type_error: "amountCents must be a number" })
    .int("amountCents must be an integer")
    .min(50, "Minimum tip is $0.50")
    .max(100000, "Maximum tip is $1,000"),
  message: z.string().max(200, "Message must not exceed 200 characters").optional().default(""),
});

export { createTipSchema };