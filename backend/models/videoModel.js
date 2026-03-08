import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    videoURL: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      required: true,
      max: 300,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewscount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["public", "private", "flagged"],
      default: "public",
    },
  },
  { timestamps: true }
);

const Video = mongoose.model("Video", videoSchema);

export default Video;