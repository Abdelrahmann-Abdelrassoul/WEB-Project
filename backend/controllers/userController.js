import catchAsync from "../utils/catchAsync.js";
import {
  getCurrentUser,
  updateCurrentUser,
  getPublicUserById,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  updateNotificationPreferences,
} from "../services/userService.js";

const getMe = catchAsync(async (req, res) => {
  const user = await getCurrentUser(req.user.id);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

const updateMe = catchAsync(async (req, res) => {
  const user = await updateCurrentUser(req.user.id, req.body);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

const getUserById = catchAsync(async (req, res) => {
  const user = await getPublicUserById(req.params.id);

  if (!user) {
    return res.status(404).json({
      status: "fail",
      message: "User not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

const follow = catchAsync(async (req, res,next) => {
  const followRecord = await followUser(req.user.id, req.params.id);

  res.status(201).json({
    status: "success",
    data: { follow: followRecord },
  });
});

const unfollow = catchAsync(async (req, res) => {
  await unfollowUser(req.user.id, req.params.id);

  res.status(204).send();
});

const listFollowers = catchAsync(async (req, res) => {
  const followers = await getFollowers(req.params.id);

  res.status(200).json({
    status: "success",
    results: followers.length,
    data: { followers },
  });
});

const listFollowing = catchAsync(async (req, res) => {
  const following = await getFollowing(req.params.id);

  res.status(200).json({
    status: "success",
    results: following.length,
    data: { following },
  });
});

const updatePreferences = catchAsync(async (req, res) => {
  const user = await updateNotificationPreferences(req.user.id, req.body);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

export {
  getMe,
  updateMe,
  getUserById,
  follow,
  unfollow,
  listFollowers,
  listFollowing,
  updatePreferences,
};
