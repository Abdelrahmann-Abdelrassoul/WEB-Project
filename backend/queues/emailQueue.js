import { Queue } from "bullmq";

const bullMQConnection = {
  host: new URL(process.env.REDIS_URL || "redis://localhost:6379").hostname,
  port: Number(new URL(process.env.REDIS_URL || "redis://localhost:6379").port) || 6379,
};

// ── Queue names ────────────────────────────────────────────────────────────────
export const QUEUE_NAMES = {
  EMAIL: "email",
};

// ── Job names ──────────────────────────────────────────────────────────────────
export const JOB_NAMES = {
  SEND_NOTIFICATION_EMAIL: "send-notification-email",
  SEND_WELCOME_EMAIL: "send-welcome-email",
};

// ── Default job options ────────────────────────────────────────────────────────
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000, // 5 s, then 10 s, then 20 s
  },
  removeOnComplete: { count: 100 }, // keep last 100 completed jobs for inspection
  removeOnFail: { count: 200 },     // keep last 200 failed jobs for debugging
};

// ── Singleton queues ───────────────────────────────────────────────────────────
let emailQueue;

export const getEmailQueue = () => {
  if (!emailQueue) {
    emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
      connection: bullMQConnection,
      defaultJobOptions,
    });
  }
  return emailQueue;
};

// ── Helper: enqueue a notification email ──────────────────────────────────────
/**
 * Add a "send-notification-email" job to the email queue.
 *
 * @param {{ recipientId: string, actorId?: string, type: string, entityId?: string, entityModel?: string }} payload
 * @param {import("bullmq").JobsOptions} [opts]  – override default job options
 */
export const enqueueNotificationEmail = async (payload, opts = {}) => {
  const queue = getEmailQueue();
  const job = await queue.add(JOB_NAMES.SEND_NOTIFICATION_EMAIL, payload, opts);
  return job;
};

/**
 * Add a "send-welcome-email" job to the email queue.
 *
 * @param {{ email: string, username: string }} payload
 * @param {import("bullmq").JobsOptions} [opts]
 */
export const enqueueWelcomeEmail = async (payload, opts = {}) => {
  const queue = getEmailQueue();
  const job = await queue.add(JOB_NAMES.SEND_WELCOME_EMAIL, payload, opts);
  return job;
};
