"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const eventColors: Record<string, { bg: string; text: string }> = {
  Delivered: {
    bg: "bg-[#b8d8c7]",
    text: "text-[#0d7a43]",
  },
  Retrieved: {
    bg: "bg-[#cfe8ec]",
    text: "text-[#1383a3]",
  },
};
interface Parcel {
  _id: string;
  trackingNumber: string;
  parcelName: string;
  status: "PENDING" | "DELIVERED" | "RETRIEVED";
  deliveryDate: string | null;
  retrievedDate: string | null;
}

interface OverviewStats {
  pending: number;
  delivered: number;
  retrieved: number;
}

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-2.5 " +
  "[&::-webkit-scrollbar-track]:bg-[#f2d9e2] " +
  "[&::-webkit-scrollbar-track]:rounded-full " +
  "[&::-webkit-scrollbar-thumb]:bg-[#d985a1] " +
  "[&::-webkit-scrollbar-thumb]:rounded-full " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-[#cf6c91]";

export default function HomePage() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [stats, setStats] = useState<OverviewStats>({
    pending: 0,
    delivered: 0,
    retrieved: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      window.location.href = "/login";
      return;
    }
    
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated === true) {
      fetchOverviewStats();
    }
  }, [isAuthenticated]);

  const fetchOverviewStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token")!;
      
      const response = await fetch("/api/parcels", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch parcels");
      }

      const parcels: Parcel[] = await response.json();
      const recentEvents = parcels
        .flatMap((p) => {
          const events = [];

          if (p.deliveryDate) {
            events.push({
              type: "Delivered",
              parcelName: p.parcelName,
              trackingNumber: p.trackingNumber,
              date: new Date(p.deliveryDate),
            });
          }

          if (p.retrievedDate) {
            events.push({
              type: "Retrieved",
              parcelName: p.parcelName,
              trackingNumber: p.trackingNumber,
              date: new Date(p.retrievedDate),
            });
          }

          return events;
        })
        .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);
      console.log(recentEvents);  
      setRecent(recentEvents);

      const stats = parcels.reduce(
        (acc, parcel) => {
          switch (parcel.status) {
            case "PENDING":
              acc.pending++;
              break;
            case "DELIVERED":
              acc.delivered++;
              break;
            case "RETRIEVED":
              if (parcel.retrievedDate) {
                const date = new Date(parcel.retrievedDate);
                const now = new Date();

                const isToday = date.toDateString() === now.toDateString();

                const isWeek = date >= new Date(new Date().setDate(new Date().getDate() - 7));

                const isMonth =
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();

                const isYear = date.getFullYear() === now.getFullYear();

                if (
                  (filter === "today" && isToday) ||
                  (filter === "week" && isWeek) ||
                  (filter === "month" && isMonth) ||
                  (filter === "year" && isYear)
                ) {
                  acc.retrieved++;
                }
              }
              break;
          }
          return acc;
        },
        { pending: 0, delivered: 0, retrieved: 0 } as OverviewStats
      );

      setStats(stats);
    } catch (err) {
      setError("Failed to load parcel stats");
      console.error("Error fetching parcels:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  if (isAuthenticated === null) {
    return (
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] flex items-center justify-center">
        <div className="text-white text-xl font-extrabold animate-pulse">
          Checking authentication...
        </div>
      </main>
    );
  }

  if (isAuthenticated === false) {
    return (
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-white text-2xl md:text-3xl font-extrabold mb-4 leading-tight">
            Looks like you&apos;re not logged in
          </div>
          <div className="text-white/90 text-lg md:text-xl font-semibold animate-pulse">
            Redirecting to login...
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] flex items-center justify-center">
        <div className="text-white text-xl font-extrabold animate-pulse">Loading dashboard...</div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      
      {/* Structural Animation Framework — No alterations made to UI layout hierarchy */}
      <style jsx global>{`
        @keyframes containerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes blockScaleUp {
          from { opacity: 0; transform: scale(0.975) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rightFeedEntrance {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes filterDropdownReveal {
          from { opacity: 0; transform: translateY(-4px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        main {
          animation: containerFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        section > div {
          animation: blockScaleUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        section > aside {
          animation: blockScaleUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards;
        }
        .overview-card-node {
          animation: blockScaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .feed-item-node {
          animation: rightFeedEntrance 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .dropdown-mount-node {
          animation: filterDropdownReveal 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top center;
        }
        header a, nav a, button, .overview-card-node, .feed-item-node {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        header a:hover, nav a:hover {
          transform: translateY(-0.5px);
          filter: brightness(1.04);
        }
        button:active {
          transform: scale(0.97);
        }
        .overview-card-node:hover {
          box-shadow: 0 10px 25px -5px rgba(223, 68, 115, 0.08);
        }
        .feed-item-node:hover {
          transform: translateX(3px) !important;
          filter: brightness(1.015);
        }
      `}</style>

      <div className="mx-auto flex h-full w-full flex-col gap-4">
        <header className="shrink-0 rounded-[1.5rem] bg-[#FFFFFF]/25 px-4 py-3 backdrop-blur-sm md:px-6 md:py-3 lg:px-8 lg:py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Image
              src="/padalock-logo.png"
              alt="PadaLock logo"
              width={340}
              height={70}
              className="h-auto w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px]"
              priority
            />

            <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-white sm:text-sm md:text-base lg:justify-end lg:gap-x-6 lg:text-lg">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="transition hover:opacity-80"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[2.2fr_0.95fr]">
          <div className="flex min-h-0 flex-col rounded-[2rem] bg-white/25 p-4 backdrop-blur-sm sm:p-5 md:p-6">
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <h2 className="text-xl font-extrabold text-white md:text-2xl">
                Overview
              </h2>
              <button
                onClick={fetchOverviewStats}
                disabled={loading}
                className="rounded-full bg-white/30 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/40 disabled:opacity-50 md:text-base"
              >
                {loading ? "⟳" : "↻"}
              </button>
            </div>

            {error ? (
              <div className="flex flex-1 items-center justify-center rounded-[1.5rem] bg-white/30 p-6">
                <p className="text-center text-sm text-white/80">{error}</p>
              </div>
            ) : (
              <div className="grid min-h-0 flex-1 gap-4 sm:grid-cols-1 md:grid-cols-3">
                <div style={{ animationDelay: '0ms' }} className="overview-card-node opacity-0 flex min-h-[170px] flex-col rounded-[1.5rem] bg-white/50 p-4 transition hover:scale-[1.02] md:p-5">
                  <h3 className="text-center text-base font-extrabold text-[#df4473] md:text-lg lg:text-xl">
                    Pending
                  </h3>
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-5xl font-light text-[#df4473] md:text-6xl lg:text-7xl">
                      {formatNumber(stats.pending)}
                    </p>
                  </div>
                </div>

                <div style={{ animationDelay: '40ms' }} className="overview-card-node opacity-0 flex min-h-[170px] flex-col rounded-[1.5rem] bg-white/50 p-4 transition hover:scale-[1.02] md:p-5">
                  <h3 className="text-center text-base font-extrabold text-[#df4473] md:text-lg lg:text-xl">
                    Delivered
                  </h3>
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-5xl font-light text-[#df4473] md:text-6xl lg:text-7xl">
                      {formatNumber(stats.delivered)}
                    </p>
                  </div>
                </div>

                <div style={{ animationDelay: '80ms' }} className="overview-card-node opacity-0 flex min-h-[170px] flex-col rounded-[1.5rem] bg-white/50 p-4 transition hover:scale-[1.02] md:p-5">
                  <h3 className="text-center text-base font-extrabold text-[#df4473] md:text-lg lg:text-xl">
                    Retrieved
                  </h3>
                  <div className="flex flex-1 flex-col items-center justify-center">
                    <p className="text-5xl font-light text-[#df4473] md:text-6xl lg:text-7xl">
                      {formatNumber(stats.retrieved)}
                    </p>
                    <div className="relative mt-2 w-full max-w-[140px]">
                      <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex w-full items-center justify-between rounded-full bg-white/50 px-3 py-1 text-xs text-[#df4473]"
                      >
                        <span className="capitalize">{filter}</span>
                        <span>˅</span>
                      </button>

                      {showDropdown && (
                        <div className="dropdown-mount-node absolute mt-1 w-full rounded-lg bg-white shadow-md text-xs text-[#df4473] overflow-hidden z-10">
                          {["today", "week", "month", "year"].map((item) => (
                            <button
                              key={item}
                              onClick={() => {
                                setFilter(item);
                                setShowDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-[#f4d2dc]"
                            >
                              {item === "today"
                                ? "Today"
                                : item === "week"
                                ? "This Week"
                                : item === "month"
                                ? "This Month"
                                : "This Year"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="flex min-h-0 flex-col rounded-[2rem] bg-white/25 p-4 backdrop-blur-sm sm:p-5 md:p-6">
            <h2 className="mb-4 shrink-0 text-xl font-extrabold text-white md:text-2xl">
              Recent
            </h2>

            <div className={`flex-1 overflow-y-auto rounded-[1.5rem] bg-white/35 p-3 pr-2 ${scrollbarClass}`}>
              <div className="flex flex-col gap-3 w-full">
                {recent.length > 0 ? (
                recent.map((item, index) => {

                const colors =
                  eventColors[item.type] || {
                    bg: "bg-[#edd9cb]",
                    text: "text-[#d46800]",
                  };

                return (
                  <div
                    key={index}
                    style={{ animationDelay: `${index * 30}ms` }}
                    className="feed-item-node opacity-0 flex w-full items-start gap-3 rounded-[1.25rem] bg-white/55 px-4 py-3"
                  >
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${colors.bg}`}
                    >
                      <span className={`text-2xl md:text-3xl ${colors.text}`}>  
                      {item.type === "Delivered" ? "📥" : "📤"}
                    </span>
                    </div>

                    <div className="min-w-0">
                      <p className={`text-sm font-extrabold md:text-base ${colors.text}`}>
                        {item.type}
                      </p>

                      <p className="text-xs md:text-sm text-[#df4473]/80 truncate">
                        {item.parcelName && item.parcelName !== "Parcel"
                          ? item.parcelName
                          : `Tracking #${item.trackingNumber}`}
                      </p>

                      <p className="text-xs text-[#df4473]/60">
                        {item.date.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
              ) : (
                <div className="flex w-full flex-col items-center justify-center text-center py-8">
                  <p className="text-xl font-bold text-[#df4473]/80 md:text-3xl">
                    No recent updates
                  </p>
                  
                  <p className="mt-2 text-sm text-[#df4473]/60 md:text-lg">
                    Activity will appear here once parcels are processed.
                  </p>
                </div>
              )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}