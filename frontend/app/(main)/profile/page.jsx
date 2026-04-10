"use client";

import { useAuthContext } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfileIndexPage() {
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (user?._id) {
      router.replace(`/profile/${user._id}`);
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-gray-400">Redirecting to your profile...</div>
    </div>
  );
}