"use client";

import { useAuthContext } from "../../../context/AuthContext";

export default function SettingsPage() {
  const { user } = useAuthContext();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
      
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Username</label>
              <p className="text-white">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-white">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Role</label>
              <p className="text-white capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Notification Preferences</h2>
          <p className="text-gray-400 text-sm">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}