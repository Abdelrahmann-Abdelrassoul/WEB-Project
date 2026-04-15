"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthContext } from "../../../../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Eye, UserRound } from "lucide-react";
import VideoPlayer from "../../../../components/ui/VideoPlayer";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { getVideos } from "../../../../services/videoService";
import { isOwner } from "../../../../utils/ownership";

export default function UserProfilePage() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const isOwnProfile = user?._id === id;
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const canManageVideo = isOwner(user?._id, id);
  

  useEffect(() => {
    let isMounted = true;

    const loadProfileVideos = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const { videos: profileVideos } = await getVideos({
          limit: 50,
          skip: 0,
          feed: "all",
          owner: id,
        });

        if (!isMounted) {
          return;
        }

        setVideos(profileVideos);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setLoadError(error.message || "Unable to load this profile's videos");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (id) {
      loadProfileVideos();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const profileIdentity = useMemo(() => {
    if (isOwnProfile) {
      return {
        username: user?.username || "User",
        email: user?.email || "",
      };
    }

    const firstVideoOwner = videos[0]?.owner;
    return {
      username: firstVideoOwner?.username || "User",
      email: firstVideoOwner?.email || "",
    };
  }, [isOwnProfile, user, videos]);

  const formatViews = (views = 0) =>
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(Math.max(Number(views) || 0, 0));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <div className="flex items-center gap-6">
          {/* Avatar Placeholder */}
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
        
        <div className="mt-8 pt-8 border-t border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Uploaded videos</h2>

          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <LoadingSpinner size="md" color="purple" />
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {loadError}
            </div>
          ) : null}

          {!isLoading && !loadError && !videos.length ? (
            <p className="text-sm text-gray-400">No videos uploaded yet.</p>
          ) : null}

          {!isLoading && !loadError && videos.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {videos.map((video) => (
                <article
                  key={video._id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                >
                  <div className="flex flex-col">
                    <VideoPlayer src={video.playbackUrl || video.videoURL} />
                  </div>
                  <Link
                    href={`/video/${video._id}`}
                    className="block space-y-3 p-4 transition-colors hover:bg-white/[0.03]"
                  >
                    <h3 className="text-base font-semibold text-white">
                      {video.title || "Untitled video"}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {video.description || "No description provided for this upload yet."}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <UserRound size={12} />
                        @{video.owner?.username || "unknown"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye size={12} />
                        {formatViews(video.viewscount)} views
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </div>
        
      </div>
    </div>
  );
}