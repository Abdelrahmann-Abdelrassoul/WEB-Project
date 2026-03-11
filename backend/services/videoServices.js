import Video from "../models/videoModel.js";

export const getVideoByID = async(videoID)=>{
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