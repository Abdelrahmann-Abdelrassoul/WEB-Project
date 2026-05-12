"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthContext } from "../../../../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Eye, UserRound, UserPlus, UserMinus } from "lucide-react";
import VideoPlayer from "../../../../components/ui/VideoPlayer";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { getVideos } from "../../../../services/videoService";
import { isOwner } from "../../../../utils/ownership";
import { buildApiUrl } from "../../../../services/api";

export default function UserProfilePage() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const isOwnProfile = user?._id === id;

  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Check follow state from the API on mount
  useEffect(() => {
    if (!user || isOwnProfile || !id) return;

    fetch(buildApiUrl(`/users/${user._id}/following`), { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        // getFollowing returns populated user objects directly
        const list = data?.data?.following ?? [];
        setIsFollowing(list.some((u) => String(u._id) === String(id)));
      })
      .catch(() => {});
  }, [user, id, isOwnProfile]);

  const handleFollow = async () => {
    if (!user || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await fetch(buildApiUrl(`/users/${id}/unfollow`), {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok || res.status === 204) setIsFollowing(false);
      } else {
        const res = await fetch(buildApiUrl(`/users/${id}/follow`), {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) setIsFollowing(true);
      }
    } catch {
      // silent
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfileVideos = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const { videos: profileVideos } = await getVideos({ limit: 50, skip: 0, feed: "all", owner: id });
        if (!isMounted) return;
        setVideos(profileVideos);
      } catch (error) {
        if (!isMounted) return;
        setLoadError(error.message || "Unable to load this profile's videos");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (id) loadProfileVideos();
    return () => { isMounted = false; };
  }, [id]);

  const profileIdentity = useMemo(() => {
    if (isOwnProfile) return { username: user?.username || "User", email: user?.email || "" };
    const firstVideoOwner = videos[0]?.owner;
    return { username: firstVideoOwner?.username || "User", email: firstVideoOwner?.email || "" };
  }, [isOwnProfile, user, videos]);

  const formatViews = (views = 0) =>
    new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
      Math.max(Number(views) || 0, 0)
    );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {profileIdentity.username?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{profileIdentity.username}</h1>
              <p className="text-gray-400">{profileIdentity.email || "Creator profile"}</p>
              {isOwnProfile && (
                <span className="inline-block mt-2 text-xs text-purple-400">Your profile</span>
              )}
            </div>
          </div>

          {user && !isOwnProfile && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                isFollowing
                  ? "bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-300 border border-white/10"
                  : "bg-purple-600 hover:bg-purple-500 text-white"
              }`}
            >
              {followLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isFollowing ? (
                <UserMinus size={16} />
              ) : (
                <UserPlus size={16} />
              )}
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Uploaded videos</h2>

          {isLoading && (
            <div className="flex min-h-[220px] items-center justify-center">
              <LoadingSpinner size="md" color="purple" />
            </div>
          )}

          {!isLoading && loadError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {loadError}
            </div>
          )}

          {!isLoading && !loadError && !videos.length && (
            <p className="text-sm text-gray-400">No videos uploaded yet.</p>
          )}

          {!isLoading && !loadError && videos.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {videos.map((video) => (
                <article key={video._id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <VideoPlayer src={video.playbackUrl || video.videoURL} />
                  <Link href={`/video/${video._id}`} className="block space-y-3 p-4 transition-colors hover:bg-white/[0.03]">
                    <h3 className="text-base font-semibold text-white">{video.title || "Untitled video"}</h3>
                    <p className="text-sm text-gray-300">{video.description || "No description provided."}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1"><UserRound size={12} />@{video.owner?.username || "unknown"}</span>
                      <span className="inline-flex items-center gap-1"><Eye size={12} />{formatViews(video.viewscount)} views</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}