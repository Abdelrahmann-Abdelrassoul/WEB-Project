// backend/services/emailService.js
import nodemailer from "nodemailer";

// Transporter
// Uses environment variables. For testing, Ethereal (fake SMTP) is used if
// EMAIL_HOST is not set. See .env section below.
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// HTML Templates
const welcomeTemplate = ({ username }) => `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0;">
    <div style="max-width:600px; margin:40px auto; background:#fff; border-radius:8px; overflow:hidden;">
      <div style="background:#6c63ff; padding:32px; text-align:center;">
        <h1 style="color:#fff; margin:0; font-size:28px;">🎬 ClipSphere</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#333;">Welcome, ${username}! 🎉</h2>
        <p style="color:#555; line-height:1.6;">
          Your account is all set. Start uploading short videos, follow creators,
          and discover trending content on ClipSphere.
        </p>
        <div style="text-align:center; margin:32px 0;">
          <a href="http://localhost:3000"
             style="background:#6c63ff; color:#fff; padding:14px 28px;
                    border-radius:6px; text-decoration:none; font-weight:bold;">
            Go to ClipSphere
          </a>
        </div>
        <p style="color:#999; font-size:12px; text-align:center;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    </div>
  </body>
</html>`;

const engagementTemplate = ({ recipientUsername, actorUsername, type, videoTitle }) => {
  const messages = {
    likes: `<strong>${actorUsername}</strong> liked your video <em>"${videoTitle}"</em>.`,
    comments: `<strong>${actorUsername}</strong> commented on your video <em>"${videoTitle}"</em>.`,
    followers: `<strong>${actorUsername}</strong> started following you.`,
    tips: `<strong>${actorUsername}</strong> sent you a tip!`,
  };

  const icons = { likes: "❤️", comments: "💬", followers: "👤", tips: "💰" };

  return `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0;">
    <div style="max-width:600px; margin:40px auto; background:#fff; border-radius:8px; overflow:hidden;">
      <div style="background:#6c63ff; padding:24px; text-align:center;">
        <h1 style="color:#fff; margin:0; font-size:24px;">🎬 ClipSphere</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#333;">Hey ${recipientUsername}, you have a new notification ${icons[type] || "🔔"}</h2>
        <p style="color:#555; font-size:16px; line-height:1.6;">
          ${messages[type] || "You have new activity on ClipSphere."}
        </p>
        <div style="text-align:center; margin:32px 0;">
          <a href="http://localhost:3000"
             style="background:#6c63ff; color:#fff; padding:14px 28px;
                    border-radius:6px; text-decoration:none; font-weight:bold;">
            View Activity
          </a>
        </div>
      </div>
      <div style="background:#f9f9f9; padding:16px; text-align:center;">
        <p style="color:#aaa; font-size:12px; margin:0;">
          You're receiving this because you have email notifications enabled.<br/>
          Manage preferences in your ClipSphere settings.
        </p>
      </div>
    </div>
  </body>
</html>`;
};

// Send Functions
export const sendWelcomeEmail = async ({ email, username }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"ClipSphere" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to ClipSphere! 🎬",
    html: welcomeTemplate({ username }),
  });
  console.log(`[Email] Welcome email sent to ${email} — MessageId: ${info.messageId}`);
  return info;
};

export const sendEngagementEmail = async ({
  recipientEmail,
  recipientUsername,
  actorUsername,
  type,           // "likes" | "comments" | "followers" | "tips"
  videoTitle = "",
}) => {
  const transporter = createTransporter();
  const subjectMap = {
    likes: `${actorUsername} liked your video`,
    comments: `${actorUsername} commented on your video`,
    followers: `${actorUsername} is now following you`,
    tips: `${actorUsername} sent you a tip!`,
  };

  const info = await transporter.sendMail({
    from: `"ClipSphere" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: subjectMap[type] || "New activity on ClipSphere",
    html: engagementTemplate({ recipientUsername, actorUsername, type, videoTitle }),
  });
  console.log(`[Email] Engagement email (${type}) sent to ${recipientEmail} — MessageId: ${info.messageId}`);
  return info;
};