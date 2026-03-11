import { createVideo as createVideoService } from "../services/videoServices.js";
import catchAsync from "../utils/catchAsync.js";

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

export { createVideo };