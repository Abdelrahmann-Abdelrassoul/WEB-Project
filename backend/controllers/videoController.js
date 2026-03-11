import {
  createVideo as createVideoService,
  listVideos as listVideosService,
} from "../services/videoServices.js";
import catchAsync from "../utils/catchAsync.js";

const listVideos = catchAsync(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const skip = (page - 1) * limit;

  const videos = await listVideosService({ limit, skip });

  res.status(200).json({
    status: "success",
    results: videos.length,
    data: {
      videos,
    },
  });
});

const createVideo = catchAsync(async (req, res) => {
  const { title, description, videoURL, duration } = req.body;
  const ownerId = req.user.id;

  const video = await createVideoService({
    title,
    description,
    videoURL,
    duration,
    ownerId,
  });

  res.status(201).json({
    status: "success",
    data: {
      video,
    },
  });
});

export { listVideos, createVideo };