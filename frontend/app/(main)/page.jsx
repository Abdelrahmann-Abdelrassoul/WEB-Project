"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { Heart, MessageCircle, Share2, Play, Clock } from "lucide-react";

// Mock data - replace with your API calls
const mockVideos = [
  { id: 1, title: "Amazing sunset", user: "john_doe", views: "12.5K", likes: 1234, duration: "0:45" },
  { id: 2, title: "Coding session", user: "dev_ninja", views: "8.2K", likes: 892, duration: "2:30" },
  { id: 3, title: "Travel vlog", user: "wanderlust", views: "45K", likes: 3421, duration: "3:15" },
];

export default function HomePage() {
  const { user } = useAuthContext();
  const [videos, setVideos] = useState(mockVideos);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-white/10">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-400 mt-2">Discover amazing videos from creators around the world</p>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Video Thumbnail Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center">
              <Play className="text-white/50 group-hover:text-white/80 transition-colors" size={48} />
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
                <Clock size={12} />
                {video.duration}
              </div>
            </div>
            
            {/* Video Info */}
            <div className="p-4">
              <h3 className="text-white font-semibold text-lg mb-1">{video.title}</h3>
              <p className="text-gray-400 text-sm mb-3">@{video.user}</p>
              
              <div className="flex items-center gap-4 text-gray-400">
                <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                  <Heart size={18} />
                  <span className="text-sm">{video.likes}</span>
                </button>
                <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                  <MessageCircle size={18} />
                  <span className="text-sm">Comment</span>
                </button>
                <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                  <Share2 size={18} />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}