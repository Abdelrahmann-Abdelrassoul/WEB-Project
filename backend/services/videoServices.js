import Video from "../models/videoModel.js";
import { getCache, setCache } from "../config/cache.js";
import Follow from "../models/followModel.js";
import mongoose from "mongoose";
import AppError from "../utils/appError.js";
import {
  buildOwnerLookupStages,
  buildReviewMetricsLookupStages,
  buildTrendingScoringStages,
} from "./videoAggregationService.js";

export const listVideos = async ({
  limit = 20,
  skip = 0,
  feed = "all",
  currentUserId = null,
  ownerId = null,
}) => {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safeSkip = Math.max(skip, 0);
  const normalizedFeed = ["following", "trending", "foryou"].includes(feed) ? feed : "all";
  const filter = { status: "public" };

  if (ownerId) {
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      throw new AppError("Invalid owner id", 400);
    }
    filter.owner = ownerId;
  }

  if (normalizedFeed === "trending") {
    const cacheKey = `trending:${safeLimit}:${safeSkip}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`[cache] HIT ${cacheKey}`);
      return cached;
    }
    console.log(`[cache] MISS ${cacheKey}`);

    const [aggregationResult] = await Video.aggregate([
      { $match: filter },
      ...buildReviewMetricsLookupStages(),
      ...buildTrendingScoringStages(),
      {
        $facet: {
          videos: [
            { $skip: safeSkip },
            { $limit: safeLimit },
            ...buildOwnerLookupStages(),
            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
                videoURL: 1,
                duration: 1,
                viewscount: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                avgRating: 1,
                reviewCount: 1,
                recentReviewCount: 1,
                recentEngagementScore: { $round: ["$recentEngagementScore", 2] },
                trendingScore: { $round: ["$trendingScore", 2] },
                owner: {
                  _id: "$owner._id",
                  username: "$owner.username",
                  avatarKey: "$owner.avatarKey",
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const videos = aggregationResult?.videos ?? [];
    const total = aggregationResult?.totalCount?.[0]?.count ?? 0;

    const result = {
      videos,
      total,
      limit: safeLimit,
      skip: safeSkip,
      hasMore: safeSkip + videos.length < total,
      feed: normalizedFeed,
    };
    await setCache(cacheKey, result, 60); // 60s TTL
    return result;
  }

  // ── "For You" feed — Following-first + Trending fill (#141 #142 #143 #144) ──
  if (normalizedFeed === "following" || normalizedFeed === "foryou") {
    if (!currentUserId) {
      throw new AppError("You must be logged in to load this feed", 401);
    }

    // #141 — fetch followed user IDs
    const followedUserIds = await Follow.find({ follower: currentUserId }).distinct("following");

    // #141 — fetch videos from followed users sorted by trendingScore desc
    const followingVideos = followedUserIds.length
      ? await Video.find({ status: "public", owner: { $in: followedUserIds } })
          .sort({ trendingScore: -1, createdAt: -1 })
          .populate("owner", "username avatarKey")
          .lean()
      : [];

    // #142 — fetch globally trending videos sorted by trendingScore desc
    const followingIds = new Set(followingVideos.map((v) => String(v._id)));
    const trendingVideos = await Video.find({ status: "public" })
      .sort({ trendingScore: -1, createdAt: -1 })
      .limit(safeLimit * 3) // fetch extra to account for deduplication
      .populate("owner", "username avatarKey")
      .lean();

    // #143 — merge: following-first, then trending, deduplicated
    const merged = [...followingVideos];
    for (const video of trendingVideos) {
      if (!followingIds.has(String(video._id))) {
        merged.push(video);
      }
    }

    // #144 — pagination over the merged feed
    const total = merged.length;
    const paginated = merged.slice(safeSkip, safeSkip + safeLimit);

    return {
      videos: paginated,
      total,
      limit: safeLimit,
      skip: safeSkip,
      hasMore: safeSkip + paginated.length < total,
      feed: normalizedFeed,
    };
  }

  // ── "All" feed — all public videos, newest first ──────────────────────────
  const [videos, total] = await Promise.all([
    Video.find(filter)
      .sort({ createdAt: -1 })
      .skip(safeSkip)
      .limit(safeLimit)
      .populate("owner", "username avatarKey"),
    Video.countDocuments(filter),
  ]);

  return {
    videos,
    total,
    limit: safeLimit,
    skip: safeSkip,
    hasMore: safeSkip + videos.length < total,
    feed: normalizedFeed,
  };
};

export const getVideoByID = async (videoID) => {
  return await Video.findById(videoID);
};

export const updateVideo = async (videoId, data) => {
  const video = await Video.findByIdAndUpdate(
    videoId,
    { $set: data },
    { new: true, runValidators: true }
  );
  return video;
};

export const deleteVideo = async (videoId) => {
  const video = await Video.findByIdAndDelete(videoId);
  return video;
};

export const createVideo = async({ title, description, videoURL, duration, ownerId })=>{
  // Freshness bonus: 20 points for brand-new videos, decays to 0 over 7 days
  const freshnessBonus = 20;

  const video = await Video.create({
    title,
    description,
    videoURL,
    duration,
    owner: ownerId,
    trendingScore: freshnessBonus,
  });

  return video;
};