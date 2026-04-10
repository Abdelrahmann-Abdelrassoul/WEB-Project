"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function ErrorModal({ error, onClose }) {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md">
        <p className="text-sm flex-1">{error}</p>
        <button onClick={onClose} className="hover:text-gray-200 transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}