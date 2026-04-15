"use client";

import { useAuth } from "../../hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Navbar from "../../components/layout/Navbar";
import LoadingScreen from "../../components/ui/LoadingScreen";

// Define which routes require authentication
const PROTECTED_ROUTES = ["/upload", "/settings", "/profile", "/admin"];

export default function MainLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current route

  useEffect(() => {
    // Check if current route needs protection
    const needsAuth = PROTECTED_ROUTES.some(route => 
      pathname === route || pathname.startsWith(route + "/")
    );

    if (!loading && !user && needsAuth) {
      router.push("/login");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <LoadingScreen />;
  }

  // For protected routes without user, don't render (redirecting)
  const needsAuth = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );
  if (needsAuth && !user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-20 md:pb-0 min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </>
  );
}
