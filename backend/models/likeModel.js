import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
  },
  { timestamps: true }
);

// #147 Prevent duplicate likes — DB-level unique constraint so no user can
// like the same video twice even under concurrent requests. The error
// middleware catches the resulting E11000 and returns a 409 response.
likeSchema.index({ user: 1, video: 1 }, { unique: true });

// #146 Index optimization — fast lookup of all likes for a video (like counts)
likeSchema.index({ video: 1 });

export default mongoose.model("Like", likeSchema);