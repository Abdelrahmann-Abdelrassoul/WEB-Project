import Video from "../models/videoModel.js";
import Follow from "../models/followModel.js";
import AppError from "../utils/appError.js";

export const listVideos = async ({ limit = 20, skip = 0, feed = "all", currentUserId = null }) => {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safeSkip = Math.max(skip, 0);
  const normalizedFeed = feed === "following" ? "following" : "all";
  const filter = { status: "public" };

  if (normalizedFeed === "following") {
    if (!currentUserId) {
      throw new AppError("You must be logged in to load the following feed", 401);
    }

    const followedUserIds = await Follow.find({ follower: currentUserId }).distinct("following");

    if (!followedUserIds.length) {
      return {
        videos: [],
        total: 0,
        limit: safeLimit,
        skip: safeSkip,
        hasMore: false,
        feed: normalizedFeed,
      };
    }

    filter.owner = { $in: followedUserIds };
  }

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

    const video = await Video.create({
        title,
        description,
        videoURL,
        duration,
        owner: ownerId,

    });

    return video;
};
