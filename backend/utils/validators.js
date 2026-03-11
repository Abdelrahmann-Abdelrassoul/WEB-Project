import { z } from "zod";
import { describe } from "zod/v4/core";

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

const createVideoSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().max(1000, "Description must not exceed 1000 characters").optional().default(""),
  videoURL: z.string().min(1, "Video URL is required"),
  duration: z.number().min(1, "Video duration must be at least 1 second")
    .max(300, "Video duration must not exceed 300 seconds"),
})

export { registerSchema, loginSchema, updateMeSchema, createVideoSchema};