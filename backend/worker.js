/**
 * Email Worker — runs as a separate process (not part of the Express server).
 *
 * Start via:
 *   node worker.js
 * or in Docker via the `worker` service defined in docker-compose.yml.
 */

import "./config/env.js";
import { Worker } from "bullmq";
import connectDB from "./config/db.js";
import { QUEUE_NAMES, JOB_NAMES } from "./queues/emailQueue.js";
import { sendNotificationEmail } from "./services/emailDeliveryService.js";
import { sendWelcomeEmail } from "./services/emailService.js";
import EmailQueue from "./models/emailQueueModel.js";

const bullMQConnection = {
  host: new URL(process.env.REDIS_URL || "redis://localhost:6379").hostname,
  port: Number(new URL(process.env.REDIS_URL || "redis://localhost:6379").port) || 6379,
};

// ── Connect to MongoDB (worker needs it for EmailQueue model) ──────────────────
await connectDB();

// ── Job processor ──────────────────────────────────────────────────────────────
const processJob = async (job) => {
  console.log(`[Worker] Processing job ${job.id} — ${job.name}`);

  switch (job.name) {
    case JOB_NAMES.SEND_NOTIFICATION_EMAIL: {
      const { recipientId, actorId, type, queueModelId } = job.data;

      const result = await sendNotificationEmail({ recipientId, actorId, type });

      // If this job was created from a legacy EmailQueue document, update its status
      if (queueModelId) {
        const status = result.sent ? "sent" : "skipped";
        await EmailQueue.findByIdAndUpdate(queueModelId, { status });
      }

      console.log(
        `[Worker] Email job ${job.id} done — sent=${result.sent} skipped=${result.skipped} reason=${result.reason ?? "—"}`
      );
      return result;
    }

    case JOB_NAMES.SEND_WELCOME_EMAIL: {
      const { email, username } = job.data;
      const info = await sendWelcomeEmail({ email, username });
      console.log(`[Worker] Welcome email sent to ${email} — messageId=${info.messageId ?? "—"}`);
      return { sent: true, messageId: info.messageId ?? null };
    }

    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};

// ── Create the BullMQ worker ───────────────────────────────────────────────────
const worker = new Worker(QUEUE_NAMES.EMAIL, processJob, {
  connection: bullMQConnection,
  concurrency: 5, // process up to 5 jobs in parallel
});

// ── Event listeners ────────────────────────────────────────────────────────────
worker.on("completed", (job, result) => {
  console.log(`[Worker] Job ${job.id} (${job.name}) completed.`, result);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} (${job?.name}) failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[Worker] Worker error:", err);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`[Worker] Received ${signal} — closing worker gracefully…`);
  await worker.close();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log(`[Worker] Email worker started — listening on queue "${QUEUE_NAMES.EMAIL}"`);
