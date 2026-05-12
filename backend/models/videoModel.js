import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title must not exceed 100 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [1000, "Description must not exceed 1000 characters"],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Video owner is required"],
    },
    videoURL: {
      type: String,
      required: [true, "Video object key is required"],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, "Video duration is required"],
      min: [1, "Video duration must be at least 1 second"],
      max: [300, "Video duration must not exceed 300 seconds"],
    },
    viewscount: {
      type: Number,
      default: 0,
      min: [0, "View count cannot be negative"],
    },
    status: {
      type: String,
      enum: ["public", "private", "flagged"],
      default: "public",
    },
    trendingScore: {
      type: Number,
      default: 0,
      min: [0, "Trending score cannot be negative"],
    },
  },
  { timestamps: true }
);

// --- #146 Index Optimization ---

// "All" feed: list public videos newest-first
videoSchema.index({ status: 1, createdAt: -1 });

// Trending feed: public videos sorted by trendingScore descending
videoSchema.index({ status: 1, trendingScore: -1 });

// "For You" / Following feed: public videos by a specific owner, sorted by trendingScore
videoSchema.index({ status: 1, owner: 1, trendingScore: -1 });

// Profile page: all videos by owner regardless of status
videoSchema.index({ owner: 1, createdAt: -1 });

const Video = mongoose.model("Video", videoSchema);

export default Video;