"use client";

import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { submitVideoReview } from "../../services/videoService";

const MAX_COMMENT = 500;

export default function VideoReviewSection({ videoId, className = "", onSubmitted }) {
  const { isAuthenticated } = useAuthContext();
  const { showError } = useApp();
  const [rating, setRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const display = hoverRating ?? rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating == null || submitting) return;

    setSubmitting(true);
    try {
      const savedReview = await submitVideoReview(videoId, { rating, comment: comment.trim() });
      setSubmitted(true);
      onSubmitted?.(savedReview);
    } catch (err) {
      showError(err.message || "Could not submit your review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`border-t border-white/10 bg-black/50 px-3 py-3 backdrop-blur-sm ${className}`}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/60">
        Review
      </p>

      {!isAuthenticated ? (
        <p className="text-sm text-gray-400">
          <Link href="/login" className="text-purple-400 underline-offset-2 hover:underline">
            Sign in
          </Link>{" "}
          to rate and comment.
        </p>
      ) : submitted ? (
        <p className="text-sm text-emerald-300/90">Thanks — your review was saved.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            className="flex items-center gap-0.5"
            role="group"
            aria-label="Star rating"
            onMouseLeave={() => setHoverRating(null)}
          >
            {[1, 2, 3, 4, 5].map((value) => {
              const active = display != null && value <= display;
              return (
                <button
                  key={value}
                  type="button"
                  className="rounded p-0.5 text-amber-400 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/80"
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  aria-pressed={rating === value}
                  onMouseEnter={() => setHoverRating(value)}
                  onFocus={() => setHoverRating(value)}
                  onBlur={() => setHoverRating(null)}
                  onClick={() => setRating(value)}
                >
                  <Star
                    size={22}
                    className={active ? "fill-amber-400 text-amber-400" : "fill-transparent text-white/25"}
                    strokeWidth={active ? 0 : 1.5}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-xs text-white/50">
              {rating == null ? "Tap to rate" : `${rating} / 5`}
            </span>
          </div>

          <div>
            <label htmlFor={`review-comment-${videoId}`} className="sr-only">
              Comment
            </label>
            <textarea
              id={`review-comment-${videoId}`}
              value={comment}
              maxLength={MAX_COMMENT}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a quick comment (optional)"
              rows={2}
              className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
            />
            <div className="mt-1 flex justify-end text-[10px] text-white/40">
              {comment.length}/{MAX_COMMENT}
            </div>
          </div>

          <button
            type="submit"
            disabled={rating == null || submitting}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </div>
  );
}
