"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { likeVideo, unlikeVideo } from "../../services/videoService.js";
import SocialActionButton from "./SocialActionButton.jsx";

export default function LikeButton({
  videoId,
  initialLiked = false,
  initialCount = 0,
  className = "",
}) {
  const { isAuthenticated } = useAuthContext();
  const { showError } = useApp();
  const [state, setState] = useState({
    liked: Boolean(initialLiked),
    count: Number(initialCount || 0),
    pending: false,
  });

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      showError("Sign in to like videos.");
      return;
    }

    if (!videoId || state.pending) {
      return;
    }

    const previous = state;
    const nextLiked = !previous.liked;

    setState({
      liked: nextLiked,
      count: Math.max(0, previous.count + (nextLiked ? 1 : -1)),
      pending: true,
    });

    try {
      const result = nextLiked ? await likeVideo(videoId) : await unlikeVideo(videoId);

      setState({
        liked: Boolean(result?.liked ?? nextLiked),
        count: Number(result?.likeCount ?? previous.count),
        pending: false,
      });
    } catch (error) {
      setState({ ...previous, pending: false });
      showError(error.message || "Unable to update like");
    }
  };

  return (
    <SocialActionButton
      icon={Heart}
      label={state.liked ? "Liked" : "Like"}
      count={state.count}
      active={state.liked}
      pending={state.pending}
      onClick={handleToggleLike}
      className={className}
      iconClassName={state.liked ? "fill-rose-300 text-rose-300" : ""}
    />
  );
}
