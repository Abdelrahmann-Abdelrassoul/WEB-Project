"use client";

import { useParams } from "next/navigation";
import { useAuthContext } from "../../../../context/AuthContext";

export default function UserProfilePage() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const isOwnProfile = user?._id === id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <div className="flex items-center gap-6">
          {/* Avatar Placeholder */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.username}</h1>
            <p className="text-gray-400">{user?.email}</p>
            {isOwnProfile && (
              <span className="inline-block mt-2 text-xs text-purple-400">Your profile</span>
            )}
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-gray-400">Profile page coming soon...</p>
        </div>
      </div>
    </div>
  );
}