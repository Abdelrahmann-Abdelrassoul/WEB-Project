import {
  createVideo as createVideoService,
  listVideos as listVideosService,
  updateVideo as updateVideoService,
  deleteVideo as deleteVideoService,
  getVideoByID,
} from "../services/videoServices.js";
import { listReviewsByVideo } from "../services/reviewService.js";
import {
  likeVideo as likeVideoService,
  unlikeVideo as unlikeVideoService,
  listLikeMetrics,
  listLikeMetricsForVideo,
} from "../services/likeService.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3, { BUCKET_NAME } from "../config/minio.js";

const withPlaybackUrls = async (videos = []) => {
  const enriched = await Promise.all(
    videos.map(async (video) => {
      try {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: video.videoURL,
        });
        const playbackUrl = await getSignedUrl(s3, command, {
          expiresIn: 60 * 15,
        });
        const plainVideo = video?.toObject ? video.toObject() : { ...video };
        return { ...plainVideo, playbackUrl };
      } catch (err) {
        const plainVideo = video?.toObject ? video.toObject() : { ...video };
        return { ...plainVideo, playbackUrl: null };
      }
    })
  );

  return enriched;
};

const withPlaybackUrl = async (video) => {
  if (!video) {
    return null;
  }
  const [enrichedVideo] = await withPlaybackUrls([video]);
  return enrichedVideo ?? null;
};

const withLikeMetrics = async ({ videos = [], currentUserId = null }) => {
  if (!videos.length) {
    return [];
  }

  const videoIds = videos.map((video) => video?._id).filter(Boolean);
  const { likeCountByVideoId, likedVideoIds } = await listLikeMetrics({
    videoIds,
    currentUserId,
  });

  return videos.map((video) => {
    const key = String(video._id);
    return {
      ...video,
      likeCount: likeCountByVideoId.get(key) ?? 0,
      likedByCurrentUser: likedVideoIds.has(key),
    };
  });
};

const listVideos = catchAsync(async (req, res) => {
  const parsedLimit = Number.parseInt(req.query.limit, 10);
  const parsedSkip = Number.parseInt(req.query.skip, 10);
  const parsedPage = Number.parseInt(req.query.page, 10);
  const feed = ["following", "trending"].includes(req.query.feed) ? req.query.feed : "all";
  const ownerId = req.query.owner ? String(req.query.owner).trim() : null;

  const limit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 50);
  const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1);
  const skip = Number.isNaN(parsedSkip) ? (page - 1) * limit : Math.max(parsedSkip, 0);

  const pagination = await listVideosService({
    limit,
    skip,
    feed,
    currentUserId: req.user?.id ?? null,
    ownerId,
  });

  const videosWithPlayback = await withPlaybackUrls(pagination.videos);
  const videosWithLikes = await withLikeMetrics({
    videos: videosWithPlayback,
    currentUserId: req.user?.id ?? null,
  });

  res.status(200).json({
    status: "success",
    results: pagination.videos.length,
    pagination: {
      limit: pagination.limit,
      skip: pagination.skip,
      total: pagination.total,
      hasMore: pagination.hasMore,
      nextSkip: pagination.hasMore ? pagination.skip + pagination.videos.length : null,
      feed: pagination.feed,
    },
    data: {
      videos: videosWithLikes,
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

const getVideo = catchAsync(async (req, res, next) => {
  const isOwner = req.user?.id && String(req.video.owner) === String(req.user.id);
  if (req.video.status !== "public" && !isOwner) {
    return next(new AppError("Video not found", 404));
  }

  const [videoDoc, reviews, likeMetrics] = await Promise.all([
    getVideoByID(req.video._id),
    listReviewsByVideo(req.video._id),
    listLikeMetricsForVideo({
      videoId: req.video._id,
      currentUserId: req.user?.id ?? null,
    }),
  ]);

  const populatedVideo = videoDoc
    ? await videoDoc.populate("owner", "username email avatarKey")
    : null;
  const video = populatedVideo?.toObject ? populatedVideo.toObject() : populatedVideo;

  const videoWithPlayback = await withPlaybackUrl(video);
  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
    : 0;

  res.status(200).json({
    status: "success",
    data: {
      video: {
        ...videoWithPlayback,
        likeCount: likeMetrics.likeCount,
        likedByCurrentUser: likeMetrics.likedByCurrentUser,
        reviewCount,
        avgRating: Number(avgRating.toFixed(2)),
      },
      reviews,
    },
  });
});

const likeVideo = catchAsync(async (req, res) => {
  const likeCount = await likeVideoService({
    videoId: req.video._id,
    userId: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data: {
      liked: true,
      likeCount,
    },
  });
});

const unlikeVideo = catchAsync(async (req, res) => {
  const likeCount = await unlikeVideoService({
    videoId: req.video._id,
    userId: req.user.id,
  });

  res.status(200).json({
    status: "success",
    data: {
      liked: false,
      likeCount,
    },
  });
});

const listVideoReviews = catchAsync(async (req, res, next) => {
  const isOwner = req.user?.id && String(req.video.owner) === String(req.user.id);
  if (req.video.status !== "public" && !isOwner) {
    return next(new AppError("Video not found", 404));
  }

  const reviews = await listReviewsByVideo(req.video._id);

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: {
      reviews,
    },
  });
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

export {
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  loadVideo,
  streamVideo,
  getVideo,
  listVideoReviews,
  likeVideo,
  unlikeVideo,
};
