import Review from "../models/reviewModel.js";
import AppError from "../utils/appError.js";
import Video from "../models/videoModel.js";
import { trackNotificationEvent } from "./notificationService.js";

/**
 * Recalculates the avg-rating contribution to trendingScore.
 * Formula: trendingScore = (likes * 10) + (avgRating * 2) + freshnessBonus
 * We only update the rating portion here — likes and freshness are handled separately.
 */
const updateVideoRatingScore = async (videoId) => {
  const [aggResult] = await Review.aggregate([
    { $match: { video: new (await import("mongoose")).default.Types.ObjectId(videoId) } },
    { $group: { _id: "$video", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const avgRating = aggResult?.avgRating ?? 0;
  const ratingContribution = avgRating * 2;

  // Count current likes to preserve their contribution
  const likeCount = await (await import("../models/likeModel.js")).default.countDocuments({ video: videoId });
  const video = await Video.findById(videoId).select("createdAt trendingScore");
  if (!video) return;

  // Freshness bonus: up to 20 points for videos under 7 days old
  const ageMs = Date.now() - new Date(video.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const freshnessBonus = ageDays < 7 ? Math.max(0, 20 - ageDays * (20 / 7)) : 0;

  const newScore = Math.max(0, (likeCount * 10) + ratingContribution + freshnessBonus);

  await Video.findByIdAndUpdate(videoId, { trendingScore: Math.round(newScore * 100) / 100 });
};

export const createReview = async ({ videoId, userId, rating, comment }) => {
  const existing = await Review.findOne({ video: videoId, user: userId });
  if (existing) {
    throw new AppError("You have already reviewed this video.", 409);
  }

  const review = await Review.create({
    video: videoId,
    user: userId,
    rating,
    comment: comment ?? "",
  });

  const video = await Video.findById(videoId).select("owner");
  if (video?.owner) {
    await trackNotificationEvent({
      recipientId: video.owner,
      actorId: userId,
      type: "comments",
      entityId: review._id,
      entityModel: "Review",
    });
  }

  await review.populate("user", "username avatarKey");

  // Update trendingScore with new avg rating contribution
  await updateVideoRatingScore(videoId);

  return review.toObject ? review.toObject() : review;
};

export const listReviewsByVideo = async (videoId) => {
  return Review.find({ video: videoId })
    .sort({ createdAt: -1 })
    .populate("user", "username avatarKey")
    .lean();
};

export const getReviewById = async (reviewId) => {
  return Review.findById(reviewId);
};

export const updateReview = async (reviewId, updates) => {
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate("user", "username avatarKey");

  if (review?.video) {
    await updateVideoRatingScore(review.video);
  }

  return review;
};

export const deleteReview = async (reviewId) => {
  const review = await Review.findByIdAndDelete(reviewId);

  if (review?.video) {
    await updateVideoRatingScore(review.video);
  }

  return review;
};