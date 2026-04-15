import EmailQueue from "../models/emailQueueModel.js";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

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
      ? EmailQueue.create({
          recipient: recipientId,
          actor: actorId,
          type,
          entityId,
          entityModel,
        })
      : null,
  ]);

  return { notification, emailQueue };
};
