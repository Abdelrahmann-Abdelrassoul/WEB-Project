import { buildApiUrl, readJsonSafely } from "./api.js";

export const getVideos = async ({ limit = 8, skip = 0, feed = "all", owner = "" } = {}) => {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    skip: String(skip),
    feed,
  });

  if (owner) {
    searchParams.set("owner", String(owner));
  }

  const res = await fetch(`${buildApiUrl("/videos")}?${searchParams.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });

  const payload = await readJsonSafely(res);

  if (!res.ok) {
    throw new Error(payload?.message || "Unable to load the video feed");
  }

  return {
    videos: payload?.data?.videos ?? [],
    pagination: {
      limit: payload?.pagination?.limit ?? limit,
      skip: payload?.pagination?.skip ?? skip,
      total: payload?.pagination?.total ?? 0,
      hasMore: payload?.pagination?.hasMore ?? false,
      nextSkip: payload?.pagination?.nextSkip ?? null,
      feed: payload?.pagination?.feed ?? feed,
    },
  };
};

export const uploadVideo = async ({ title, description = "", file, duration = null }) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("video", file);
  if (duration !== null && Number.isFinite(Number(duration))) {
    formData.append("duration", String(duration));
  }

  const res = await fetch(buildApiUrl("/videos"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const payload = await readJsonSafely(res);

  if (!res.ok) {
    throw new Error(payload?.message || "Video upload failed");
  }

  return payload;
};

export const submitVideoReview = async (videoId, { rating, comment = "" }) => {
  const res = await fetch(buildApiUrl(`/videos/${videoId}/reviews`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating, comment }),
  });

  const payload = await readJsonSafely(res);

  if (!res.ok) {
    const err = new Error(payload?.message || "Unable to submit review");
    err.status = res.status;
    throw err;
  }

  return payload?.data?.review ?? null;
};

export const getVideoDetails = async (videoId) => {
  const res = await fetch(buildApiUrl(`/videos/${videoId}`), {
    credentials: "include",
    cache: "no-store",
  });

  const payload = await readJsonSafely(res);

  if (!res.ok) {
    throw new Error(payload?.message || "Unable to load video details");
  }

  return {
    video: payload?.data?.video ?? null,
    reviews: payload?.data?.reviews ?? [],
  };
};
