import User from "../models/userModel.js";
import Video from "../models/videoModel.js";
import Review from "../models/reviewModel.js";
import AppError from "../utils/appError.js";

// GET /api/v1/admin/stats
export const getAdminStats = async () => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [userStats, videoStats, mostActiveUsers] = await Promise.all([

    // Total users + total tips (single pass via $facet)
    User.aggregate([
      {
        $facet: {
          totalUsers: [{ $count: "count" }],

          // Phase 3: $lookup into the "tips" collection.
          // Safely returns 0 until tips exist.
          // Adjust "tips" below if your collection name differs.
          totalTips: [
            {
              $lookup: {
                from: "tips",
                pipeline: [{ $count: "count" }],
                as: "tipsResult",
              },
            },
            { $limit: 1 },
            { $unwind: { path: "$tipsResult", preserveNullAndEmptyArrays: true } },
            { $project: { count: { $ifNull: ["$tipsResult.count", 0] } } },
          ],
        },
      },
      {
        $project: {
          totalUsers: { $ifNull: [{ $arrayElemAt: ["$totalUsers.count", 0] }, 0] },
          totalTips:  { $ifNull: [{ $arrayElemAt: ["$totalTips.count",  0] }, 0] },
        },
      },
    ]),

    // Total videos
    Video.aggregate([
      { $count: "totalVideos" },
    ]),

    // Most active users of the week (most videos uploaded)
    Video.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      {
        $group: {
          _id: "$owner",
          videosUploaded: { $sum: 1 },
        },
      },
      { $sort: { videosUploaded: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          username: "$user.username",
          avatarKey: "$user.avatarKey",
          videosUploaded: 1,
        },
      },
    ]),
  ]);

  const [statsDoc] = userStats;
  const [videoDoc] = videoStats;

  return {
    totalUsers:      statsDoc?.totalUsers  ?? 0,
    totalVideos:     videoDoc?.totalVideos ?? 0,
    totalTips:       statsDoc?.totalTips   ?? 0,
    mostActiveUsers,
  };
};

// PATCH /api/v1/admin/users/:id/status
// Body: { "accountStatus": "active" | "suspended" | "banned" }
export const updateUserStatus = async (targetUserId, accountStatus) => {
  const VALID_STATUSES = ["active", "suspended", "banned"];

  if (!VALID_STATUSES.includes(accountStatus)) {
    throw new AppError(
      `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      400
    );
  }

  // "active"              → re-enable account  (active: true)
  // "suspended" / "banned" → soft-deactivate   (active: false)
  const isActive = accountStatus === "active";

  const user = await User.findByIdAndUpdate(
    targetUserId,
    { accountStatus, active: isActive },
    { new: true, runValidators: true }
  ).select("username email role active accountStatus");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

// GET /api/v1/admin/moderation
// Query param: ?ratingThreshold=2.0 (optional, defaults to 2.0)
export const getModerationContent = async ({ ratingThreshold = 2.0 } = {}) => {
  const threshold = parseFloat(ratingThreshold);

  const [flaggedVideos, lowRatedVideos] = await Promise.all([

    // Explicitly flagged videos
    Video.aggregate([
      { $match: { status: "flagged" } },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      {
        $project: {
          title: 1,
          description: 1,
          status: 1,
          videoURL: 1,
          viewscount: 1,
          createdAt: 1,
          "owner._id": 1,
          "owner.username": 1,
          "owner.avatarKey": 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]),

    // Low-rated videos (avg rating < threshold with ≥3 reviews)
    // Aggregates from reviews → joins video + owner details.
    // Excludes already-flagged videos to avoid duplicates.
    Review.aggregate([
      {
        $group: {
          _id: "$video",
          avgRating:   { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
      {
        $match: {
          avgRating:   { $lt: threshold },
          reviewCount: { $gte: 3 },
        },
      },
      { $sort: { avgRating: 1 } }, // worst-rated first
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "_id",
          as: "video",
        },
      },
      { $unwind: "$video" },
      { $match: { "video.status": { $ne: "flagged" } } }, // already in flaggedVideos
      {
        $lookup: {
          from: "users",
          localField: "video.owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      {
        $project: {
          _id: 0,
          videoId:     "$video._id",
          avgRating:   { $round: ["$avgRating", 2] },
          reviewCount: 1,
          title:       "$video.title",
          status:      "$video.status",
          videoURL:    "$video.videoURL",
          createdAt:   "$video.createdAt",
          "owner._id":       "$owner._id",
          "owner.username":  "$owner.username",
          "owner.avatarKey": "$owner.avatarKey",
        },
      },
    ]),
  ]);

  return { flaggedVideos, lowRatedVideos };
};