import {
  createVideo as createVideoService,
  listVideos as listVideosService,
  updateVideo as updateVideoService,
  deleteVideo as deleteVideoService,
  getVideoByID,
} from "../services/videoServices.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3, { BUCKET_NAME } from "../config/minio.js";

const listVideos = catchAsync(async (req, res) => {
  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const parsedSkip = Number.parseInt(req.query.skip, 10);
  const parsedPage = Number.parseInt(req.query.page, 10);

  const limit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 50);
  const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1);
  const skip = Number.isNaN(parsedSkip) ? (page - 1) * limit : Math.max(parsedSkip, 0);

  const pagination = await listVideosService({ limit, skip });

  res.status(200).json({
    status: "success",
    results: pagination.videos.length,
    pagination: {
      limit: pagination.limit,
      skip: pagination.skip,
      total: pagination.total,
      hasMore: pagination.hasMore,
      nextSkip: pagination.hasMore ? pagination.skip + pagination.videos.length : null,
    },
    data: {
      videos: pagination.videos,
    },
  });
});

const createVideo = catchAsync(async (req, res) => {
  const { title, description } = req.body;
  const ownerId = req.user.id;

  const video = await createVideoService({
    title,
    description,
    videoURL: req.objectKey,
    duration: req.videoDuration,
    ownerId,
  });

  res.status(201).json({
    status: "success",
    data: { video }
  });
});

const updateVideo = catchAsync(async (req, res) => {
  const video = await updateVideoService(req.video._id, req.body);
  res.status(200).json({
    status: "success",
    data: {
      video,
    },
  });
});

const loadVideo = catchAsync(async (req, res, next) => {
  const video = await getVideoByID(req.params.id);
  if (!video) return next(new AppError("Video not found", 404));
  req.video = video;
  next();
});

const deleteVideo = catchAsync(async (req, res) => {
  await deleteVideoService(req.video._id);
  res.status(204).send();
});

const streamVideo = catchAsync(async (req, res, next) => {
  const video = await getVideoByID(req.params.id);
  if (!video) return next(new AppError("Video not found", 404));

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: video.videoURL,   // videoURL field stores the objectKey
  });

  const presignedUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 * 15,   // 15 minutes
  });

  res.status(200).json({
    status: "success",
    data: { url: presignedUrl },
  });
});

export { listVideos, createVideo, updateVideo, deleteVideo, loadVideo, streamVideo };
