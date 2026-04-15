import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { sendWelcomeEmail } from "./emailService.js";

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

const registerUser = async ({ username, email, password }) => {
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new Error("Email already in use");
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new Error("Username already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds  

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  sendWelcomeEmail({ email: user.email, username: user.username }).catch((err) =>
    console.error("[Email] Failed to send welcome email:", err.message)
  );

  const token = signToken(user);

  return {
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio,
      avatarKey: user.avatarKey,
      active: user.active,
      accountStatus: user.accountStatus,
    },
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = signToken(user);

  return {
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio,
      avatarKey: user.avatarKey,
    },
  };
};

export { registerUser, loginUser };