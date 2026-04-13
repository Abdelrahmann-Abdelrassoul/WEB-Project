const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const getVideos = async ({ limit = 8, skip = 0, feed = "all" } = {}) => {
  const searchParams = new URLSearchParams({
    limit: String(limit),
    skip: String(skip),
    feed,
  });

  const res = await fetch(`${API}/videos?${searchParams.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });

  const payload = await res.json().catch(() => null);

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
