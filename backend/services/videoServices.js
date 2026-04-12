import Video from "../models/videoModel.js";

export const listVideos = async ({ limit = 20, skip = 0 }) => {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safeSkip = Math.max(skip, 0);
  const filter = { status: "public" };

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
