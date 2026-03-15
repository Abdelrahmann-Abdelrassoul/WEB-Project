import User from "../models/userModel.js";
import Follow from "../models/followModel.js";
import AppError from "../utils/appError.js";
import { trackNotificationEvent } from "./notificationService.js";

export const getCurrentUser = async (userId) => {
  return await User.findById(userId);
};

export const updateCurrentUser = async (userId, updates) => {
  const allowedFields = ["username", "bio", "avatarKey"];
  const forbiddenFields = ["password", "email", "role"];

  for (const field of forbiddenFields) {
    if (updates[field] !== undefined) {
      throw new AppError(`You cannot update ${field} here`, 400);
    }
  }

  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  if (filteredUpdates.username) {
    const existingUsername = await User.findOne({
      username: filteredUpdates.username,
      _id: { $ne: userId },
    });

    if (existingUsername) {
      throw new AppError("Username already in use", 400);
    }
  }

  return await User.findByIdAndUpdate(userId, filteredUpdates, {
    new: true,
    runValidators: true,
  });
};

export const getPublicUserById = async (userId) => {
  return await User.findById(userId).select("username bio avatarKey role createdAt");
};

export const followUser = async (currentUserId, targetUserId) => {
  if (currentUserId.toString() === targetUserId.toString()) {
    throw new AppError("Users cannot follow themselves", 400);
  }

  const targetUser = await User.findById(targetUserId).select("_id");
  if (!targetUser) {
    throw new AppError("User not found", 404);
  }

  let follow;
  try {
    follow = await Follow.create({
      follower: currentUserId,
      following: targetUserId,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("You already follow this user", 409);
    }
    throw error;
  }

  await trackNotificationEvent({
    recipientId: targetUserId,
    actorId: currentUserId,
    type: "followers",
    entityId: follow._id,
    entityModel: "Follow",
  });

  return follow;
};

export const unfollowUser = async (currentUserId, targetUserId) => {
  const unfollowed = await Follow.findOneAndDelete({
    follower: currentUserId,
    following: targetUserId,
  });

  if (!unfollowed) {
    throw new AppError("Follow relationship not found", 404);
  }

  return unfollowed;
};

export const getFollowers = async (userId) => {
  const user = await User.findById(userId).select("_id");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const followers = await Follow.find({ following: userId })
    .sort({ createdAt: -1 })
    .populate("follower", "username bio avatarKey role createdAt");

  return followers.map((entry) => entry.follower);
};

export const getFollowing = async (userId) => {
  const user = await User.findById(userId).select("_id");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const following = await Follow.find({ follower: userId })
    .sort({ createdAt: -1 })
    .populate("following", "username bio avatarKey role createdAt");

  return following.map((entry) => entry.following);
};

export const updateNotificationPreferences = async (userId, preferences) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "notificationPreferences.inApp.followers": preferences.inApp.followers,
        "notificationPreferences.inApp.comments": preferences.inApp.comments,
        "notificationPreferences.inApp.likes": preferences.inApp.likes,
        "notificationPreferences.inApp.tips": preferences.inApp.tips,
        "notificationPreferences.email.followers": preferences.email.followers,
        "notificationPreferences.email.comments": preferences.email.comments,
        "notificationPreferences.email.likes": preferences.email.likes,
        "notificationPreferences.email.tips": preferences.email.tips,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("username email notificationPreferences");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};
