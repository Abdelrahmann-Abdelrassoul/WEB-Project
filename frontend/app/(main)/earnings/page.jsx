"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../../context/AuthContext";
import { getMyBalance, getMyTipHistory } from "../../../services/tipService";
import LoadingSpinner from "../../../components/ui/LoadingSpinner.jsx";


const PAGE_SIZE = 10;

export default function EarningsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const router = useRouter();

  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (newSkip = 0) => {
    setPageLoading(true);
    setError("");
    try {
      const [bal, hist] = await Promise.all([
        getMyBalance(),
        getMyTipHistory({ limit: PAGE_SIZE, skip: newSkip }),
      ]);
      setBalance(bal);
      setTransactions(hist.data.transactions);
      setTotal(hist.total);
      setSkip(newSkip);
    } catch (err) {
      setError(err.message || "Failed to load earnings");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    load(0);
  }, [authLoading, isAuthenticated, load, router]);

  if (authLoading || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={() => load(0)} className="mt-4 text-sm text-gray-400 hover:text-white underline">
          Try again
        </button>
      </div>
    );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Earnings</h1>
        <p className="text-gray-500 text-sm mt-1">Tips received from your viewers</p>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-yellow-500/15 to-orange-500/10 border border-yellow-500/20 p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-300/70 font-medium uppercase tracking-wide">Pending Balance</p>
          <p className="text-4xl font-bold text-white mt-1">
            ${balance?.pendingBalanceDollars?.toFixed(2) ?? "0.00"}
          </p>
          <p className="text-xs text-gray-500 mt-1">From {total} completed tip{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
          <span className="text-2xl">💛</span>
        </div>
      </div>

      {/* Tip history */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Tip History</h2>

        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-gray-500 text-sm">No tips received yet.</p>
            <p className="text-gray-600 text-xs mt-1">Tips from your viewers will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4"
              >
                {/* Avatar placeholder */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white uppercase">
                  {tx.tipper?.username?.[0] ?? "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">
                    @{tx.tipper?.username ?? "unknown"}
                  </p>
                  {tx.video?.title && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      on "{tx.video.title}"
                    </p>
                  )}
                  {tx.message && (
                    <p className="text-xs text-gray-400 italic mt-1 truncate">"{tx.message}"</p>
                  )}
                </div>

                {/* Amount + date */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-yellow-400">
                    +${(tx.amountCents / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(tx.confirmedAt ?? tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => load(skip - PAGE_SIZE)}
              disabled={skip === 0}
              className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => load(skip + PAGE_SIZE)}
              disabled={skip + PAGE_SIZE >= total}
              className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
