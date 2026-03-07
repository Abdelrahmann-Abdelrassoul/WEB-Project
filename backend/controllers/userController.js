import catchAsync from "../utils/catchAsync.js";
import {
  getCurrentUser,
  updateCurrentUser,
  getPublicUserById,
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

export { getMe, updateMe, getUserById };