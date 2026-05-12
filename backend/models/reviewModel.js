import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must not exceed 5"],
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Comment must not exceed 500 characters"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review user is required"],
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: [true, "Reviewed video is required"],
    },
  },
  { timestamps: true }
);

// #148 Prevent review duplication — DB-level unique constraint so no user can
// submit more than one review per video even under concurrent requests.
// The service layer also checks this explicitly (409 AppError), and the
// error middleware catches any E11000 that slips through as a 409 response.
reviewSchema.index({ user: 1, video: 1 }, { unique: true });

// #146 Index optimization — fast lookup of all reviews for a video
reviewSchema.index({ video: 1 });

// Fast lookup of all reviews by a user (profile / moderation views)
reviewSchema.index({ user: 1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;