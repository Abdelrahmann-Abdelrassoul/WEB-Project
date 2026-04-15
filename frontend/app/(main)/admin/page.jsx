"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Cpu,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import { useApp } from "../../../context/AppContext.jsx";
import LoadingSpinner from "../../../components/ui/LoadingSpinner.jsx";
import { getAdminHealth, getAdminStats } from "../../../services/adminService.js";

const numberFormatter = new Intl.NumberFormat("en-US");
const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatMetricValue = (value) => compactNumberFormatter.format(Number(value) || 0);

const formatBytes = (value) => {
  const bytes = Number(value) || 0;

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let nextValue = bytes / 1024;
  let unitIndex = 0;

  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024;
    unitIndex += 1;
  }

  return `${nextValue.toFixed(nextValue >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatUptime = (seconds) => {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { showError } = useApp();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [dashboardError, setDashboardError] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const isAdmin = user?.role === "admin";

  const loadDashboard = useCallback(async ({ manual = false } = {}) => {
    if (!isAdmin) {
      return;
    }

    if (manual) {
      setRefreshing(true);
    } else {
      setLoadingDashboard(true);
    }

    setDashboardError("");

    try {
      const [statsPayload, healthPayload] = await Promise.all([
        getAdminStats(),
        getAdminHealth(),
      ]);

      setStats(statsPayload);
      setHealth(healthPayload);
      setLastUpdated(new Date());
    } catch (error) {
      const message = error.message || "Unable to load the admin dashboard";
      setDashboardError(message);
      showError(message);

      if (error.status === 401) {
        router.replace("/login");
      }

      if (error.status === 403) {
        router.replace("/");
      }
    } finally {
      setLoadingDashboard(false);
      setRefreshing(false);
    }
  }, [isAdmin, router, showError]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      return;
    }

    if (!isAdmin) {
      router.replace("/");
      return;
    }

    loadDashboard();
  }, [authLoading, isAdmin, loadDashboard, router, user]);

  const overviewCards = useMemo(() => {
    if (!stats) {
      return [];
    }

    return [
      {
        label: "Total Users",
        value: formatMetricValue(stats.totalUsers),
        description: `${numberFormatter.format(Number(stats.totalUsers) || 0)} registered accounts`,
        icon: Users,
        accent: "from-cyan-500/30 to-sky-500/10",
      },
      {
        label: "Total Videos",
        value: formatMetricValue(stats.totalVideos),
        description: `${numberFormatter.format(Number(stats.totalVideos) || 0)} videos stored on the platform`,
        icon: Video,
        accent: "from-violet-500/30 to-fuchsia-500/10",
      },
      {
        label: "Total Tips",
        value: formatMetricValue(stats.totalTips),
        description: `${numberFormatter.format(Number(stats.totalTips) || 0)} tips tracked so far`,
        icon: Wallet,
        accent: "from-amber-500/30 to-orange-500/10",
      },
    ];
  }, [stats]);

  const healthCards = useMemo(() => {
    if (!health) {
      return [];
    }

    return [
      {
        label: "System Status",
        value: health.ok ? "Healthy" : "Attention Needed",
        description: "Realtime response from the admin health endpoint",
        icon: ShieldCheck,
      },
      {
        label: "Uptime",
        value: formatUptime(health.uptimeSeconds),
        description: `${Math.round(Number(health.uptimeSeconds) || 0)} seconds since startup`,
        icon: TimerReset,
      },
      {
        label: "Heap Usage",
        value: `${formatBytes(health.memory?.heapUsed)} / ${formatBytes(health.memory?.heapTotal)}`,
        description: "Node.js heap currently in use vs allocated heap",
        icon: Cpu,
      },
      {
        label: "RSS Memory",
        value: formatBytes(health.memory?.rss),
        description: `External memory: ${formatBytes(health.memory?.external)}`,
        icon: HardDrive,
      },
    ];
  }, [health]);

  if (authLoading || (loadingDashboard && !stats && !health)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/5">
        <LoadingSpinner size="lg" color="purple" />
        <div className="text-center">
          <p className="text-lg font-semibold text-white">Loading admin dashboard</p>
          <p className="text-sm text-gray-400">Pulling phase 1 statistics and system health data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-400/20 bg-amber-500/10 p-8 text-center">
        <p className="text-2xl font-semibold text-white">Admin access is required</p>
        <p className="mt-3 text-sm text-amber-100/80">
          You are signed in, but this route is reserved for accounts with the admin role.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
              <ShieldCheck size={16} />
              Protected Admin Route
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">Admin Dashboard</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">
              Monitor platform growth and backend health from the phase 1 admin endpoints without leaving the frontend.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <p className="text-sm text-slate-400">
              Signed in as <span className="font-semibold text-white">{user.username}</span>
            </p>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {lastUpdated
                ? `Last refreshed ${lastUpdated.toLocaleTimeString()}`
                : "Waiting for initial snapshot"}
            </p>
            <button
              type="button"
              onClick={() => loadDashboard({ manual: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh data"}
            </button>
          </div>
        </div>
      </section>

      {dashboardError ? (
        <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-lg font-semibold text-white">Dashboard data could not be loaded.</p>
          <p className="mt-2 text-sm text-red-100/80">{dashboardError}</p>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {overviewCards.map(({ label, value, description, icon: Icon, accent }) => (
          <article
            key={label}
            className={`rounded-3xl border border-white/10 bg-gradient-to-br ${accent} p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)]`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">{label}</p>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-white">
                <Icon size={20} />
              </div>
            </div>
            <p className="mt-6 text-4xl font-bold text-white">{value}</p>
            <p className="mt-3 text-sm text-slate-300">{description}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-cyan-100">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">System Health</h2>
              <p className="text-sm text-gray-400">Directly sourced from `/api/v1/admin/health`.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {healthCards.map(({ label, value, description, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">{label}</p>
                  <Icon size={18} className="text-cyan-100" />
                </div>
                <p className="mt-4 text-2xl font-semibold text-white">{value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
            Report timestamp: <span className="font-medium text-white">{health?.timestamp ? new Date(health.timestamp).toLocaleString() : "Unavailable"}</span>
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3 text-violet-100">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Most Active This Week</h2>
              <p className="text-sm text-gray-400">Users ranked by uploads in the last 7 days.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {stats?.mostActiveUsers?.length ? (
              stats.mostActiveUsers.map((entry, index) => (
                <div
                  key={`${entry.userId}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">#{index + 1} {entry.username}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {entry.userId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">{numberFormatter.format(entry.videosUploaded || 0)}</p>
                    <p className="text-sm text-slate-400">videos uploaded</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-slate-400">
                No recent uploader activity yet. Once users publish videos this week, they will appear here.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
