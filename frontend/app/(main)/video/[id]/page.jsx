"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, Eye, RefreshCw, Star, UserRound } from "lucide-react";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import VideoPlayer from "../../../../components/ui/VideoPlayer";
import CommentComposer from "../../../../components/ui/CommentComposer";
import LikeButton from "../../../../components/ui/LikeButton";
import ShareButton from "../../../../components/ui/ShareButton";
import {
  deleteReview,
  deleteVideo,
  getVideoDetails,
  submitVideoReview,
  updateReview,
  updateVideo,
} from "../../../../services/videoService";
import { useAuthContext } from "../../../../context/AuthContext";
import { useApp } from "../../../../context/AppContext";
import { isOwner } from "../../../../utils/ownership";

const MAX_COMMENT = 500;

const renderStars = (rating) =>
  [1, 2, 3, 4, 5].map((value) => (
    <Star
      key={value}
      size={14}
      className={value <= Number(rating || 0) ? "fill-amber-400 text-amber-400" : "fill-transparent text-white/25"}
      strokeWidth={value <= Number(rating || 0) ? 0 : 1.5}
    />
  ));

const formatViews = (views = 0) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.max(Number(views) || 0, 0));

export default function VideoDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [video, setVideo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [videoDraft, setVideoDraft] = useState({ title: "", description: "" });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({ rating: 5, comment: "" });
  const { user } = useAuthContext();
  const { showError } = useApp();
  const isVideoOwner = isOwner(user?._id, video?.owner?._id);
  const hasCurrentUserReview = reviews.some((review) => isOwner(user?._id, review.user?._id));
  const reviewCount = reviews.length;
  const avgRating = reviewCount
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
    : 0;

  const loadVideoDetails = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setLoadError("");
    try {
      const payload = await getVideoDetails(id);
      setVideo(payload.video);
      setReviews(payload.reviews);
      setVideoDraft({
        title: payload.video?.title || "",
        description: payload.video?.description || "",
      });
    } catch (error) {
      setLoadError(error.message || "Unable to load this video");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadVideoDetails();
  }, [loadVideoDetails]);

  const onEditVideo = useCallback(() => {
    setIsEditingVideo(true);
  }, []);

  const onCancelEditVideo = useCallback(() => {
    setIsEditingVideo(false);
    setVideoDraft({
      title: video?.title || "",
      description: video?.description || "",
    });
  }, [video]);

  const onSaveVideo = useCallback(async () => {
    if (!video?._id) return;
    const trimmedTitle = videoDraft.title.trim();
    if (!trimmedTitle) {
      showError("Video title cannot be empty");
      return;
    }

    try {
      const updated = await updateVideo(video._id, {
        title: trimmedTitle,
        description: videoDraft.description.trim(),
      });
      setVideo((current) => ({ ...current, ...updated }));
      setIsEditingVideo(false);
    } catch (error) {
      showError(error.message || "Failed to update video");
    }
  }, [showError, video?._id, videoDraft.description, videoDraft.title]);

  const onDeleteVideo = useCallback(async (videoId) => {
    if (!videoId) {
      return;
    }

    const confirmed = window.confirm("Delete this video permanently?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteVideo(videoId);
      router.push("/");
      router.refresh();
    } catch (error) {
      showError(error.message || "Failed to delete video");
    }
  }, [router, showError]);

  const onStartEditReview = useCallback((review) => {
    setEditingReviewId(review._id);
    setReviewDraft({
      rating: Number(review.rating || 5),
      comment: review.comment || "",
    });
  }, []);

  const onCancelEditReview = useCallback(() => {
    setEditingReviewId(null);
    setReviewDraft({ rating: 5, comment: "" });
  }, []);

  const onSaveReview = useCallback(async (reviewId) => {
    if (!video?._id || !reviewId) {
      return;
    }
    try {
      await updateReview(video._id, reviewId, {
        rating: Number(reviewDraft.rating),
        comment: reviewDraft.comment.trim(),
      });
      setEditingReviewId(null);
      await loadVideoDetails();
    } catch (error) {
      showError(error.message || "Failed to update review");
    }
  }, [loadVideoDetails, reviewDraft.comment, reviewDraft.rating, showError, video?._id]);

  const onDeleteReview = useCallback(async (reviewId) => {
    if (!video?._id || !reviewId) {
      return;
    }
    const confirmed = window.confirm("Delete this review?");
    if (!confirmed) {
      return;
    }
    try {
      await deleteReview(video._id, reviewId);
      if (editingReviewId === reviewId) {
        onCancelEditReview();
      }
      await loadVideoDetails();
    } catch (error) {
      showError(error.message || "Failed to delete review");
    }
  }, [editingReviewId, loadVideoDetails, onCancelEditReview, showError, video?._id]);

  const addOptimisticReview = useCallback((optimisticReview) => {
    setReviews((current) => [optimisticReview, ...current]);
  }, []);

  const commitOptimisticReview = useCallback((optimisticId, savedReview) => {
    setReviews((current) => {
      const replaced = current.map((review) =>
        review._id === optimisticId ? savedReview : review
      );

      return replaced.some((review) => review._id === savedReview?._id)
        ? replaced
        : [savedReview, ...replaced];
    });
  }, []);

  const rollbackOptimisticReview = useCallback((optimisticId) => {
    setReviews((current) => current.filter((review) => review._id !== optimisticId));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <LoadingSpinner size="lg" color="purple" />
      </div>
    );
  }

  if (loadError || !video) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="text-lg font-semibold text-white">Video not available</p>
        <p className="text-sm text-red-100/80">{loadError || "The requested video could not be found."}</p>
        <Link href="/" className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {video.playbackUrl ? (
          <VideoPlayer src={video.playbackUrl} />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-black/40 text-sm text-gray-400">
            Video source unavailable
          </div>
        )}
        <CommentComposer
          resourceId={video._id}
          hasSubmitted={hasCurrentUserReview}
          submitComment={({ resourceId, rating, comment }) =>
            submitVideoReview(resourceId, { rating, comment })
          }
          onOptimisticAdd={addOptimisticReview}
          onOptimisticCommit={commitOptimisticReview}
          onOptimisticRollback={rollbackOptimisticReview}
        />
      </div>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        {!isEditingVideo ? (
          <>
            <h1 className="text-2xl font-bold text-white">{video.title || "Untitled video"}</h1>
            <p className="text-sm text-gray-300">
              {video.description || "No description provided for this upload yet."}
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={videoDraft.title}
              onChange={(e) => setVideoDraft((current) => ({ ...current, title: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              maxLength={100}
            />
            <textarea
              value={videoDraft.description}
              onChange={(e) => setVideoDraft((current) => ({ ...current, description: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              rows={3}
              maxLength={1000}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1">
            <UserRound size={12} />@{video.owner?.username || "unknown"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={12} />
            {formatViews(video.viewscount)} views
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={12} />
            {new Date(video.createdAt).toLocaleDateString()}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/25 bg-yellow-500/10 px-2 py-1 text-yellow-100">
            <Star size={12} />
            {Number(avgRating || 0).toFixed(1)} avg ({reviewCount} reviews)
          </span>
          <LikeButton
            key={`${video._id}-${video.likeCount}-${video.likedByCurrentUser ? "liked" : "unliked"}`}
            videoId={video._id}
            initialLiked={video.likedByCurrentUser}
            initialCount={video.likeCount}
          />
          <ShareButton title={video.title} />
        </div>
        {isVideoOwner ? (
          <div className="flex gap-2">
            {!isEditingVideo ? (
              <>
                <button
                  type="button"
                  onClick={onEditVideo}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                >
                  Edit video
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteVideo(video._id)}
                  className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
                >
                  Delete video
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onSaveVideo}
                  className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={onCancelEditVideo}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Comments and reviews</h2>
          <button
            type="button"
            onClick={loadVideoDetails}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-gray-200 transition hover:bg-white/10"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {!reviews.length ? (
          <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-gray-400">
            No reviews yet. Be the first to rate this video.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {reviews.map((review) => {
                const isReviewOwner = isOwner(user?._id, review.user?._id);
                const isEditingThisReview = editingReviewId === review._id;

                return (
                <article key={review._id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">@{review.user?.username || "user"}</p>
                    <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                  </div>
                  {isEditingThisReview ? (
                    <div className="mt-3 space-y-2">
                      <label className="block">
                        <span className="mb-1 block text-xs text-gray-400">Rating</span>
                        <select
                          value={reviewDraft.rating}
                          onChange={(e) =>
                            setReviewDraft((current) => ({ ...current, rating: Number(e.target.value) }))
                          }
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs text-gray-400">Comment</span>
                        <textarea
                          value={reviewDraft.comment}
                          maxLength={MAX_COMMENT}
                          onChange={(e) =>
                            setReviewDraft((current) => ({ ...current, comment: e.target.value }))
                          }
                          rows={3}
                          className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                        />
                      </label>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-300">
                      {review.comment?.trim() ? review.comment : "No written comment."}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleString()}</p>
                    {review.pending ? (
                      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-100">
                        Sending
                      </span>
                    ) : null}
                  </div>
                  {isReviewOwner ? (
                    <div className="mt-3 flex gap-2">
                      {!isEditingThisReview ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onStartEditReview(review)}
                            className="rounded-lg border border-white/20 px-2.5 py-1 text-[11px] text-white hover:bg-white/10"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteReview(review._id)}
                            className="rounded-lg border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-200 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onSaveReview(review._id)}
                            className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={onCancelEditReview}
                            className="rounded-lg border border-white/20 px-2.5 py-1 text-[11px] text-white hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}
                </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
