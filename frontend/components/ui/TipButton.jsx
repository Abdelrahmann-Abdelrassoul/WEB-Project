"use client";

import { useState, useEffect } from "react";
import { createTipCheckout, getTipPresets } from "../../services/tipService.js";
import { useAuthContext } from "../../context/AuthContext.jsx";

/**
 * TipButton
 *
 * Drop-in component for the video detail page.
 * Shows a "Tip Creator" button that opens a modal where the viewer can
 * pick a preset amount or enter a custom one, then redirects to Stripe
 * Checkout (Test Mode).
 *
 * Props:
 *   videoId   {string}  – MongoDB video _id
 *   creatorId {string}  – Video owner's _id (to prevent self-tipping)
 *   className {string}  – Optional extra Tailwind classes on the trigger button
 */
export default function TipButton({ videoId, creatorId, className = "" }) {
  const { user, isAuthenticated } = useAuthContext();

  const [isOpen, setIsOpen] = useState(false);
  const [presets, setPresets] = useState([]);
  const [selectedCents, setSelectedCents] = useState(null);
  const [customDollars, setCustomDollars] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Don't render for unauthenticated users or the creator themselves
  if (!isAuthenticated || (user?._id && String(user._id) === String(creatorId))) {
    return null;
  }

  const openModal = async () => {
    setIsOpen(true);
    setError("");
    if (presets.length === 0) {
      try {
        const data = await getTipPresets();
        setPresets(data);
        if (data.length > 0) setSelectedCents(data[1]?.cents ?? data[0].cents); // default to second preset
      } catch {
        setPresets([
          { cents: 100, label: "$1.00" },
          { cents: 200, label: "$2.00" },
          { cents: 500, label: "$5.00" },
          { cents: 1000, label: "$10.00" },
        ]);
      }
    }
  };

  const closeModal = () => {
    if (loading) return;
    setIsOpen(false);
    setCustomDollars("");
    setMessage("");
    setError("");
  };

  const effectiveCents = customDollars
    ? Math.round(parseFloat(customDollars) * 100)
    : selectedCents;

  const handleSend = async () => {
    setError("");

    if (!effectiveCents || effectiveCents < 50) {
      setError("Minimum tip is $0.50");
      return;
    }
    if (effectiveCents > 100000) {
      setError("Maximum tip is $1,000");
      return;
    }

    setLoading(true);
    try {
      const { checkoutUrl } = await createTipCheckout({
        videoId,
        amountCents: effectiveCents,
        message,
      });
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openModal}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-orange-500/25 ${className}`}
      >
        <TipIcon />
        Tip Creator
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">💛</span>
                <h2 className="text-white font-bold text-lg">Send a Tip</h2>
              </div>
              <button
                onClick={closeModal}
                disabled={loading}
                className="text-gray-500 hover:text-white transition-colors disabled:opacity-30"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Preset amounts */}
              <div>
                <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">
                  Choose an amount
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.cents}
                      onClick={() => {
                        setSelectedCents(p.cents);
                        setCustomDollars("");
                      }}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all duration-150
                        ${selectedCents === p.cents && !customDollars
                          ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-md"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">
                  Or enter a custom amount
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    min="0.50"
                    max="1000"
                    step="0.50"
                    placeholder="0.00"
                    value={customDollars}
                    onChange={(e) => {
                      setCustomDollars(e.target.value);
                      setSelectedCents(null);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">
                  Add a message <span className="normal-case text-gray-600">(optional)</span>
                </p>
                <textarea
                  placeholder="Say something nice..."
                  maxLength={200}
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors text-sm resize-none"
                />
                <p className="text-right text-xs text-gray-600 mt-1">{message.length}/200</p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              {/* Summary + CTA */}
              <button
                onClick={handleSend}
                disabled={loading || !effectiveCents || effectiveCents < 50}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-orange-500/25 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinnerSmall />
                    Redirecting to Stripe…
                  </span>
                ) : effectiveCents && effectiveCents >= 50 ? (
                  `Send $${(effectiveCents / 100).toFixed(2)} tip →`
                ) : (
                  "Select an amount"
                )}
              </button>

              <p className="text-center text-xs text-gray-600">
                Powered by Stripe · Test mode · No real charges
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Inline icons ───────────────────────────────────────────────────────────────
const TipIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LoadingSpinnerSmall = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);
