import User from "../models/userModel.js";

const getCurrentUser = async (userId) => {
  return await User.findById(userId);
};

const updateCurrentUser = async (userId, updates) => {
  const allowedFields = ["username", "bio", "avatarKey"];

  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  if (filteredUpdates.email || filteredUpdates.password || filteredUpdates.role) {
    throw new Error("You cannot update email, password, or role here");
  }

  if (filteredUpdates.username) {
    const existingUsername = await User.findOne({
      username: filteredUpdates.username,
      _id: { $ne: userId },
    });

    if (existingUsername) {
      throw new Error("Username already in use");
    }
  }

  return await User.findByIdAndUpdate(userId, filteredUpdates, {
    new: true,
    runValidators: true,
  });
};

const getPublicUserById = async (userId) => {
  return await User.findById(userId).select("username bio avatarKey role createdAt");
};

export { getCurrentUser, updateCurrentUser, getPublicUserById };