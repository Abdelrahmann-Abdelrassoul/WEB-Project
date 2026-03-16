import catchAsync from "../utils/catchAsync.js";
import {
  getAdminStats,
  updateUserStatus,
  getModerationContent,
} from "../services/adminService.js";

// GET /api/v1/admin/stats
export const getStats = catchAsync(async (req, res) => {
  const stats = await getAdminStats();

  res.status(200).json({
    status: "success",
    data: { stats },
  });
});

// PATCH /api/v1/admin/users/:id/status
// Body: { "accountStatus": "active" | "suspended" | "banned" }
export const patchUserStatus = catchAsync(async (req, res) => {
  const user = await updateUserStatus(req.params.id, req.body.accountStatus);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

// GET /api/v1/admin/moderation
// Optional query: ?ratingThreshold=2.0
export const getModeration = catchAsync(async (req, res) => {
  const { ratingThreshold } = req.query;
  const content = await getModerationContent({ ratingThreshold });

  res.status(200).json({
    status: "success",
    data: content,
  });
});