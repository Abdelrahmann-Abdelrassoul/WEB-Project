import {
  createReview as createReviewService,
  getReviewById,
  updateReview as updateReviewService,
  deleteReview as deleteReviewService,
} from "../services/reviewService.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const createReview = catchAsync(async (req, res) => {
  const { rating, comment } = req.body;
  const videoId = req.video._id;
  const userId = req.user.id;

  const review = await createReviewService({
    videoId,
    userId,
    rating,
    comment,
  });

  res.status(201).json({
    status: "success",
    data: {
      review,
    },
  });
});

const loadReview = catchAsync(async (req, res, next) => {
  const review = await getReviewById(req.params.reviewId);
  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (String(review.video) !== String(req.video._id)) {
    return next(new AppError("Review not found for this video", 404));
  }

  req.review = review;
  next();
});

const updateReview = catchAsync(async (req, res) => {
  const review = await updateReviewService(req.review._id, req.body);
  res.status(200).json({
    status: "success",
    data: { review },
  });
});

const deleteReview = catchAsync(async (req, res) => {
  await deleteReviewService(req.review._id);
  res.status(204).send();
});

export { createReview, loadReview, updateReview, deleteReview };
