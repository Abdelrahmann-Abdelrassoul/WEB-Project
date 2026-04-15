import EmailQueue from "../models/emailQueueModel.js";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import { sendEngagementEmail } from "./emailService.js";
import Video from "../models/videoModel.js";

export const getNotificationRecipient = async (recipientId) => {
  if (!recipientId) {
    return null;
  }

  return User.findById(recipientId).select("username email notificationPreferences");
};

export const isNotificationChannelEnabled = (recipient, channel, type) =>
  recipient?.notificationPreferences?.[channel]?.[type] ?? true;

export const canReceiveNotificationEmail = async ({ recipientId, type }) => {
  const recipient = await getNotificationRecipient(recipientId);

  if (!recipient) {
    return {
      allowed: false,
      reason: "recipient-not-found",
      recipient: null,
    };
  }

  if (!recipient.email) {
    return {
      allowed: false,
      reason: "recipient-email-missing",
      recipient,
    };
  }

  const allowed = isNotificationChannelEnabled(recipient, "email", type);

  return {
    allowed,
    reason: allowed ? null : "preference-disabled",
    recipient,
  };
};

export const trackNotificationEvent = async ({
  recipientId,
  actorId,
  type,
  entityId = null,
  entityModel = null,
}) => {
  if (!recipientId || !actorId || recipientId.toString() === actorId.toString()) {
    return { notification: null, emailQueue: null };
  }

  const recipient = await getNotificationRecipient(recipientId);
  if (!recipient) {
    return { notification: null, emailQueue: null };
  }

  const inAppEnabled = isNotificationChannelEnabled(recipient, "inApp", type);
  const emailEnabled = isNotificationChannelEnabled(recipient, "email", type);

  const [notification, emailQueue] = await Promise.all([
    inAppEnabled
      ? Notification.create({
          recipient: recipientId,
          actor: actorId,
          type,
          entityId,
          entityModel,
        })
      : null,
    emailEnabled
      ? (async () => {
          const [queueRecord, recipientFull, actorFull, video] = await Promise.all([
            EmailQueue.create({ recipient: recipientId, actor: actorId, type, entityId, entityModel }),
            User.findById(recipientId).select("email username"),
            User.findById(actorId).select("username"),
            entityModel === "Video" && entityId
              ? Video.findById(entityId).select("title").lean()
              : Promise.resolve(null),
          ]);

          sendEngagementEmail({
            recipientEmail: recipientFull.email,
            recipientUsername: recipientFull.username,
            actorUsername: actorFull.username,
            type,
            videoTitle: video?.title || "",
          }).catch((err) =>
            console.error(`[Email] Failed to send engagement email (${type}):`, err.message)
          );

          return queueRecord;
        })()
      : null,
  ]);

  return { notification, emailQueue };
};
