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

  return review;
};
