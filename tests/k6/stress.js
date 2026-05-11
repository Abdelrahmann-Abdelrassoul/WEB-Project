/**
 * k6 stress test
 *
 * Two scenarios run concurrently:
 *   1. trending — hammers GET /api/v1/videos?feed=trending to prove cache effectiveness
 *   2. baseline  — hits health + all-feed as a general load check
 *
 * Run:
 *   k6 run --insecure-skip-tls-verify tests/k6/stress.js
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";

// ── Custom metrics ─────────────────────────────────────────────────────────────
const trendingDuration = new Trend("trending_duration", true);
const cacheHits        = new Counter("cache_hits");
const cacheTotal       = new Counter("cache_total");
const errorRate        = new Rate("error_rate");

// ── Config ─────────────────────────────────────────────────────────────────────
const BASE = __ENV.BASE_URL || "https://localhost";

export const options = {
  scenarios: {
    trending: {
      executor: "constant-vus",
      vus: 3,
      duration: "30s",
      exec: "trendingFeed",
    },
    baseline: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
      exec: "baselineFeed",
      startTime: "0s",
    },
  },
  thresholds: {
    trending_duration:        ["p(95)<800"],   // 95th percentile under 800ms
    error_rate:               ["rate<0.05"],   // less than 5% errors
    http_req_failed:          ["rate<0.05"],
  },
};

// ── Scenarios ──────────────────────────────────────────────────────────────────
export function trendingFeed() {
  const res = http.get(`${BASE}/api/v1/videos?feed=trending&limit=8&skip=0`, {
    tags: { scenario: "trending" },
  });

  const ok = check(res, {
    "trending 200": (r) => r.status === 200,
    "has videos":   (r) => {
      try { return Array.isArray(JSON.parse(r.body).data?.videos); } catch { return false; }
    },
  });

  errorRate.add(!ok);
  trendingDuration.add(res.timings.duration);
  cacheTotal.add(1);

  // Detect cache hit via X-Cache header (add to nginx if desired) or by speed
  if (res.timings.duration < 20) cacheHits.add(1);

  sleep(0.5);
}

export function baselineFeed() {
  const health = http.get(`http://localhost/health`, { tags: { scenario: "baseline" } });
  check(health, { "health 200": (r) => r.status === 200 });

  sleep(0.2);

  const all = http.get(`${BASE}/api/v1/videos?feed=all&limit=8&skip=0`, {
    tags: { scenario: "baseline" },
  });
  check(all, { "all-feed 200": (r) => r.status === 200 });

  errorRate.add(health.status !== 200 || all.status !== 200);
  sleep(1);
}

// ── Summary ────────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const hitRate = data.metrics.cache_hits
    ? (data.metrics.cache_hits.values.count / data.metrics.cache_total.values.count) * 100
    : 0;

  console.log(`Cache hit rate (speed heuristic): ${hitRate.toFixed(1)}%`);

  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "tests/k6/results.json": JSON.stringify(data, null, 2),
  };
}