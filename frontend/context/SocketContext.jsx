"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuthContext } from "./AuthContext.jsx";

const SocketContext = createContext({});

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

const TOAST_DURATION_MS = 5000;

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuthContext();

  const [badgeCount, setBadgeCount] = useState(0);

  const [toasts, setToasts] = useState([]);

  const socketRef = useRef(null);

  // Helper: add a toast and schedule its removal
  const pushToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearBadge = useCallback(() => {
    setBadgeCount(0);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect any lingering socket when the user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setBadgeCount(0);
      setToasts([]);
      return;
    }

    // Avoid opening a second connection on StrictMode double-mount
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true, // send the httpOnly auth cookie
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("[socket] connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("[socket] connection error:", err.message);
    });

    socket.on("new-like", (payload) => {
      const { likerUsername, videoTitle } = payload;

      pushToast({
        type: "new-like",
        likerUsername,
        videoTitle,
      });

      setBadgeCount((n) => n + 1);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user, pushToast]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        badgeCount,
        clearBadge,
        toasts,
        dismissToast,
      }}
    >
      {children}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  // Trigger entrance animation on mount
  useEffect(() => {
    // Small delay lets the browser paint the initial hidden state first
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm
        bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl
        px-4 py-3 shadow-2xl
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
    >
      <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
        <HeartIcon />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">
          New like!
        </p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug truncate">
          <span className="text-pink-400 font-medium">{toast.likerUsername}</span>
          {" liked "}
          <span className="text-gray-300 font-medium">"{toast.videoTitle}"</span>
        </p>
      </div>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 mt-0.5 text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// Inline SVG icons to avoid extra icon-library imports
const HeartIcon = () => (
  <svg
    className="w-4 h-4 text-white"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-3.5 h-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
