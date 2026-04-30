import { buildApiUrl, readJsonSafely } from "./api.js";

/**
 * Start a Stripe Checkout session for tipping a creator.
 * Returns { checkoutUrl, transactionId, sessionId }
 */
export const createTipCheckout = async ({ videoId, amountCents, message = "" }) => {
  const res = await fetch(buildApiUrl("/tips/checkout"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId, amountCents, message }),
  });

  const data = await readJsonSafely(res);
  if (!res.ok) throw new Error(data?.message || "Failed to start checkout");
  return data.data;
};

/**
 * Get the authenticated creator's pending balance.
 * Returns { pendingBalanceCents, pendingBalanceDollars }
 */
export const getMyBalance = async () => {
  const res = await fetch(buildApiUrl("/tips/balance"), {
    credentials: "include",
  });
  const data = await readJsonSafely(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch balance");
  return data.data;
};

/**
 * Get the authenticated creator's completed tip history.
 */
export const getMyTipHistory = async ({ limit = 20, skip = 0 } = {}) => {
  const res = await fetch(buildApiUrl(`/tips/history?limit=${limit}&skip=${skip}`), {
    credentials: "include",
  });
  const data = await readJsonSafely(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch tip history");
  return data;
};

/**
 * Get tip amount presets from the server.
 */
export const getTipPresets = async () => {
  const res = await fetch(buildApiUrl("/tips/presets"));
  const data = await readJsonSafely(res);
  if (!res.ok) throw new Error(data?.message || "Failed to fetch presets");
  return data.data.presets;
};
