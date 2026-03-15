import mongoose from "mongoose";

const emailQueueSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Email recipient is required"],
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Email actor is required"],
    },
    type: {
      type: String,
      enum: ["followers", "comments", "likes", "tips"],
      required: [true, "Email queue type is required"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    entityModel: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ["queued", "sent", "failed"],
      default: "queued",
    },
  },
  { timestamps: true }
);

const EmailQueue = mongoose.model("EmailQueue", emailQueueSchema);

export default EmailQueue;
