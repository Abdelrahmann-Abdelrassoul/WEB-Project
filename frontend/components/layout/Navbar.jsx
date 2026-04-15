"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { logout } from "../../services/authService.js";
import { Home, Upload, User, LogOut, Menu, X, Settings, LogIn, Shield } from "lucide-react";

export default function Navbar() {
  const { user, refetchUser } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await logout();
      await refetchUser();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      await refetchUser(); // Still refetch to clear user state
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Don't render navbar on auth pages
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) return null;

  return (
    <>
      {/* Desktop Navbar - Glassmorphism */}
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 hidden md:block ${
        scrolled ? "w-[90%] bg-black/80 backdrop-blur-xl border border-white/10" : "w-[95%] bg-black/50 backdrop-blur-md border border-white/5"
      } rounded-2xl px-6 py-3`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            ClipSphere
          </Link>

          {/* Navigation Links - Show different based on auth state */}
          <div className="flex items-center gap-2">
            {user ? (
              // LOGGED IN NAVIGATION
              <>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <Home size={18} />
                  <span>Home</span>
                </Link>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <Upload size={18} />
                  <span>Upload</span>
                </Link>
                {user?._id && (
                  <Link
                    href={`/profile/${user._id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <User size={18} />
                    <span>Profile</span>
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>
                {user?.role === "admin" ? (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <Shield size={18} />
                    <span>Admin</span>
                  </Link>
                ) : null}
                <div className="ml-4 pl-4 border-l border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{user?.username || "User"}</p>
                      <p className="text-xs text-gray-400">{user?.email || ""}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // LOGGED OUT NAVIGATION
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <Home size={18} />
                  <span>Home</span>
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {user ? (
        // LOGGED IN MOBILE NAV
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 md:hidden">
          <div className="flex justify-around py-3">
            <Link href="/" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-400 hover:text-white transition-colors">
              <Home size={22} />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/upload" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-400 hover:text-white transition-colors">
              <Upload size={22} />
              <span className="text-xs">Upload</span>
            </Link>
            {user?.role === "admin" ? (
              <Link href="/admin" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-400 hover:text-white transition-colors">
                <Shield size={22} />
                <span className="text-xs">Admin</span>
              </Link>
            ) : null}
            {user?._id && (
              <Link href={`/profile/${user._id}`} className="flex flex-col items-center gap-1 px-4 py-1 text-gray-400 hover:text-white transition-colors">
                <User size={22} />
                <span className="text-xs">Profile</span>
              </Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex flex-col items-center gap-1 px-4 py-1 text-gray-400 hover:text-white"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
              <span className="text-xs">Menu</span>
            </button>
          </div>
        </nav>
      ) : (
        // LOGGED OUT MOBILE NAV
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 md:hidden">
          <div className="flex justify-around py-3">
            <Link href="/" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-400 hover:text-white transition-colors">
              <Home size={22} />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/login" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-400 hover:text-white transition-colors">
              <LogIn size={22} />
              <span className="text-xs">Sign In</span>
            </Link>
            <Link href="/register" className="flex flex-col items-center gap-1 px-4 py-1 text-purple-400 hover:text-purple-300 transition-colors">
              <span className="text-xs font-medium">Sign Up</span>
            </Link>
          </div>
        </nav>
      )}

      {/* Mobile Menu Drawer - Logged In */}
      {user && isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
          <div className="fixed bottom-20 left-4 right-4 z-50 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4 md:hidden animate-slide-up">
            <div className="flex flex-col gap-2">
              {user?.role === "admin" ? (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <Shield size={20} />
                  <span>Admin Panel</span>
                </Link>
              ) : null}
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10"
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                disabled={isLoggingOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                <LogOut size={20} />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
              <div className="pt-3 mt-2 border-t border-white/10">
                <p className="text-sm text-gray-400 px-4">{user?.username || "User"}</p>
                <p className="text-xs text-gray-500 px-4">{user?.email || ""}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
