import nodemailer from "nodemailer";
import EmailQueue from "../models/emailQueueModel.js";
import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import { canReceiveNotificationEmail } from "./notificationService.js";

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  transporter = hasSmtpConfig
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : nodemailer.createTransport({
        jsonTransport: true,
      });

  return transporter;
};

const getNotificationCopy = (type) => {
  switch (type) {
    case "followers":
      return "started following you";
    case "comments":
      return "left a new comment on your video";
    case "likes":
      return "liked your video";
    case "tips":
      return "sent you a tip";
    default:
      return "interacted with your account";
  }
};

const buildNotificationEmail = ({ recipient, actor, type }) => {
  const actorName = actor?.username || "Someone";
  const recipientName = recipient?.username || "there";
  const actionText = getNotificationCopy(type);

  return {
    from: process.env.EMAIL_FROM || "noreply@clipsphere.local",
    to: recipient.email,
    subject: `ClipSphere notification: ${type}`,
    text: `Hi ${recipientName}, ${actorName} ${actionText}.`,
    html: `<p>Hi ${recipientName},</p><p><strong>${actorName}</strong> ${actionText}.</p>`,
  };
};

export const sendNotificationEmail = async ({ recipientId, actorId = null, actor = null, type }) => {
  const preferenceCheck = await canReceiveNotificationEmail({ recipientId, type });

  if (!preferenceCheck.allowed) {
    return {
      sent: false,
      skipped: true,
      reason: preferenceCheck.reason,
      recipient: preferenceCheck.recipient,
    };
  }

  const resolvedActor =
    actor ?? (actorId ? await User.findById(actorId).select("username email") : null);

  const mail = buildNotificationEmail({
    recipient: preferenceCheck.recipient,
    actor: resolvedActor,
    type,
  });

  const info = await getTransporter().sendMail(mail);

  return {
    sent: true,
    skipped: false,
    messageId: info.messageId ?? null,
    recipient: preferenceCheck.recipient,
  };
};

export const processQueuedNotificationEmail = async (queueId) => {
  const queueEntry = await EmailQueue.findById(queueId)
    .populate("recipient", "username email notificationPreferences")
    .populate("actor", "username email");

  if (!queueEntry) {
    throw new AppError("Queued email not found", 404);
  }

  try {
    const result = await sendNotificationEmail({
      recipientId: queueEntry.recipient?._id,
      actor: queueEntry.actor,
      type: queueEntry.type,
    });

    queueEntry.status = result.sent ? "sent" : "skipped";
    await queueEntry.save();

    return {
      queueEntry,
      ...result,
    };
  } catch (error) {
    queueEntry.status = "failed";
    await queueEntry.save();
    throw error;
  }
};
