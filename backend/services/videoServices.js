import Video from "../models/videoModel.js";

export const listVideos = async ({ limit = 20, skip = 0 }) => {
  const videos = await Video.find({ status: "public" })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Math.min(limit, 50))
    .populate("owner", "username avatarKey");
  return videos;
};

export const getVideoByID = async (videoID) => {
  return await Video.findById(videoID);
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