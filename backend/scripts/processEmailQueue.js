import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import EmailQueue from "../models/emailQueueModel.js";
import { processQueuedNotificationEmail } from "../services/emailDeliveryService.js";

const queueId = process.argv[2]?.trim();

const run = async () => {
  try {
    await connectDB();

    const queueItems = queueId
      ? [{ _id: queueId }]
      : await EmailQueue.find({ status: "queued" }).sort({ createdAt: 1 }).limit(20).select("_id");

    if (!queueItems.length) {
      console.log("No queued emails found.");
      return;
    }

    for (const item of queueItems) {
      const result = await processQueuedNotificationEmail(item._id);
      console.log(
        JSON.stringify(
          {
            queueId: result.queueEntry._id,
            status: result.queueEntry.status,
            sent: result.sent,
            skipped: result.skipped,
            reason: result.reason ?? null,
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    console.error("Failed to process queued emails:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
