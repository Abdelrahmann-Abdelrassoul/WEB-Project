import Like from "../models/likeModel.js";
import Video from "../models/videoModel.js";

export const listLikeMetrics = async ({ videoIds = [], currentUserId = null }) => {
  if (!videoIds.length) {
    return { likeCountByVideoId: new Map(), likedVideoIds: new Set() };
  }

  const [counts, likedRows] = await Promise.all([
    Like.aggregate([
      { $match: { video: { $in: videoIds } } },
      { $group: { _id: "$video", count: { $sum: 1 } } },
    ]),
    currentUserId
      ? Like.find({ user: currentUserId, video: { $in: videoIds } }).select("video").lean()
      : Promise.resolve([]),
  ]);

  const likeCountByVideoId = new Map(
    counts.map((row) => [String(row._id), Number(row.count || 0)])
  );
  const likedVideoIds = new Set(likedRows.map((row) => String(row.video)));

  return { likeCountByVideoId, likedVideoIds };
};

export const listLikeMetricsForVideo = async ({ videoId, currentUserId = null }) => {
  const [likeCount, userLike] = await Promise.all([
    Like.countDocuments({ video: videoId }),
    currentUserId ? Like.exists({ video: videoId, user: currentUserId }) : Promise.resolve(null),
  ]);

  return {
    likeCount,
    likedByCurrentUser: Boolean(userLike),
  };
};

export const likeVideo = async ({ videoId, userId }) => {
  const result = await Like.findOneAndUpdate(
    { video: videoId, user: userId },
    { $setOnInsert: { video: videoId, user: userId } },
    { upsert: true, new: false }
  );

  // Only increment if this is a new like (not a duplicate)
  if (!result) {
    await Video.findByIdAndUpdate(videoId, { $inc: { trendingScore: 10 } });
  }

  return Like.countDocuments({ video: videoId });
};

export const unlikeVideo = async ({ videoId, userId }) => {
  const result = await Like.deleteOne({ video: videoId, user: userId });

  // Only decrement if a like was actually removed
  if (result.deletedCount > 0) {
    await Video.findByIdAndUpdate(videoId, {
      $inc: { trendingScore: -10 },
    });
    // Clamp to 0 — score should never go negative
    await Video.findByIdAndUpdate(videoId, [
      { $set: { trendingScore: { $max: ["$trendingScore", 0] } } },
    ]);
  }

  return Like.countDocuments({ video: videoId });
};