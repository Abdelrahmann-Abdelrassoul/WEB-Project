import Review from "../models/reviewModel.js";
import AppError from "../utils/appError.js";
import Video from "../models/videoModel.js";
import { trackNotificationEvent } from "./notificationService.js";

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
  return Review.findByIdAndUpdate(
    reviewId,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate("user", "username avatarKey");
};

export const deleteReview = async (reviewId) => {
  return Review.findByIdAndDelete(reviewId);
};
