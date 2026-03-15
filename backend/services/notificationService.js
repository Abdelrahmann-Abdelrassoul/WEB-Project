import EmailQueue from "../models/emailQueueModel.js";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

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

  const recipient = await User.findById(recipientId).select("notificationPreferences");
  if (!recipient) {
    return { notification: null, emailQueue: null };
  }

  const inAppEnabled = recipient.notificationPreferences?.inApp?.[type] ?? true;
  const emailEnabled = recipient.notificationPreferences?.email?.[type] ?? true;

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
