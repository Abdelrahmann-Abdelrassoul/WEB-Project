/**
 * Seed script — creates fake users, videos, and reviews for stress testing.
 *
 * Run inside the backend container:
 *   docker exec -it backend node scripts/seedVideos.js --count=50
 *
 * Wipes existing seed data first so re-runs are safe.
 */

import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/userModel.js";
import Video from "../models/videoModel.js";
import Review from "../models/reviewModel.js";

const count = parseInt(process.argv.find((a) => a.startsWith("--count="))?.split("=")[1] ?? "20");

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const SEED_TAG = "seed-user";

async function run() {
  await connectDB();
  console.log(`Seeding ${count} videos...`);

  // ── Clean up previous seed data ──────────────────────────────────────────────
  const existingSeeds = await User.find({ username: new RegExp(`^${SEED_TAG}`) }).select("_id");
  const seedIds = existingSeeds.map((u) => u._id);
  if (seedIds.length) {
    await Video.deleteMany({ owner: { $in: seedIds } });
    await Review.deleteMany({ user: { $in: seedIds } });
    await User.deleteMany({ _id: { $in: seedIds } });
    console.log(`Removed ${seedIds.length} previous seed users and their data.`);
  }

  // ── Create seed users ────────────────────────────────────────────────────────
  const users = [];
  for (let i = 0; i < Math.max(5, Math.ceil(count / 5)); i++) {
    const user = await User.create({
      username: `${SEED_TAG}-${i}-${Date.now()}`,
      email: `seed${i}-${Date.now()}@seed.local`,
      password: "Seed1234!",
    });
    users.push(user);
  }
  console.log(`Created ${users.length} seed users.`);

  // ── Create seed videos ───────────────────────────────────────────────────────
  const titles = [
    "Sunset Drive", "Mountain Hike", "City Lights", "Ocean Waves",
    "Forest Walk", "Street Food Tour", "Drone Flight", "Night Sky",
    "Rainy Day", "Coffee Shop Vibes",
  ];
  const videos = [];
  for (let i = 0; i < count; i++) {
    const video = await Video.create({
      title: `${rand(titles)} #${i + 1}`,
      description: `Seed video ${i + 1} for stress testing.`,
      videoURL: `seed/video-${i + 1}.mp4`,
      duration: randInt(30, 300),
      owner: rand(users)._id,
      status: "public",
      viewscount: randInt(0, 10000),
    });
    videos.push(video);
  }
  console.log(`Created ${count} seed videos.`);

  // ── Create reviews ───────────────────────────────────────────────────────────
  let reviewCount = 0;
  for (const video of videos) {
    const reviewers = users.filter((u) => u._id.toString() !== video.owner.toString());
    const subset = reviewers.slice(0, randInt(1, Math.min(3, reviewers.length)));
    for (const reviewer of subset) {
      try {
        await Review.create({
          video: video._id,
          user: reviewer._id,
          rating: randInt(1, 5),
          body: `Seed review from ${reviewer.username}.`,
        });
        reviewCount++;
      } catch {
        // duplicate index — skip
      }
    }
  }
  console.log(`Created ${reviewCount} seed reviews.`);
  console.log("Seeding complete.");
}

run()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => mongoose.connection.close());