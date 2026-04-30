"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * /tip/success
 * Stripe redirects here after a completed checkout session.
 * URL contains ?session_id=cs_test_...
 *
 * We just show a confirmation — the webhook has already handled the
 * database update on the backend.
 */
export default function TipSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(5);

  // Auto-redirect home after 5 s
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/");
      return;
    }
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Animated checkmark */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/30">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Tip Sent! 💛</h1>
          <p className="text-gray-400 leading-relaxed">
            Your tip has been processed successfully. The creator will be notified and your support makes a real difference.
          </p>
        </div>

        {sessionId && (
          <p className="text-xs text-gray-600 font-mono bg-white/5 border border-white/10 rounded-lg px-4 py-2 break-all">
            Session: {sessionId}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold text-sm transition-all duration-200 text-center"
          >
            Back to Home
          </Link>
          <Link
            href="/earnings"
            className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-medium text-sm transition-all duration-200 text-center"
          >
            View My Earnings
          </Link>
        </div>

        <p className="text-xs text-gray-600">
          Redirecting to home in {countdown}s…
        </p>
      </div>
    </main>
  );
}
