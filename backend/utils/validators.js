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

export { registerSchema, loginSchema, updateMeSchema };