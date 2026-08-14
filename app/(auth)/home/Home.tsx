"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  }, [isAuthenticated, filter]);

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
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);

      setRecent(recentEvents);

      const calculatedStats = parcels.reduce(
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
                const isWeek =
                  date >=
                  new Date(new Date().setDate(new Date().getDate() - 7));
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

      setStats(calculatedStats);
    } catch (err) {
      setError("Failed to load parcel stats");
      console.error("Error fetching parcels:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  if (isAuthenticated === null || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1]">
        <div className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/30 border-t-white" />
      </main>
    );
  }

  return (
    <main className="min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex h-full w-full flex-col gap-4">
        
        {/* HEADER */}
        <header className="relative z-[100] shrink-0 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-xl border border-white/30 shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="transition-transform duration-300 hover:scale-105">
              <Image
                src="/padalock-logo.png"
                alt="Logo"
                width={200}
                height={50}
                className="w-28 md:w-40"
                priority
              />
            </div>

            <nav className="hidden lg:flex gap-8 text-white font-bold">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative group transition-all duration-300 hover:text-white"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* ANIMATED HAMBURGER */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden relative z-[110] p-2 focus:outline-none"
              aria-label="Toggle Menu"
            >
              <div className="flex flex-col justify-between w-6 h-4 transform transition-all duration-300">
                <span
                  className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 origin-left ${
                    isMenuOpen ? "rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                    isMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 origin-left ${
                    isMenuOpen ? "-rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>

          {/* MOBILE NAV DROPDOWN */}
          <div
            className={`absolute left-0 right-0 top-full mt-3 px-2 transition-all duration-300 ease-out lg:hidden ${
              isMenuOpen
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
          >
            <nav className="flex flex-col overflow-hidden rounded-2xl bg-white/95 backdrop-blur-2xl p-2 shadow-2xl border border-white/40">
              {navItems.map((item, idx) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                  className={`p-4 text-[#df4473] font-bold hover:bg-pink-50 rounded-xl transition-all duration-200 transform ${
                    isMenuOpen ? "translate-x-0" : "-translate-x-4"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* SECTION - Main Content Area */}
        <section className="relative z-0 grid flex-1 gap-4 lg:grid-cols-[1.8fr_1fr] lg:min-h-0">
          
          {/* STATS CONTAINER */}
          <div className="relative z-30 flex flex-col rounded-[2.5rem] bg-black/5 backdrop-blur-md border border-white/20 p-6 shadow-inner lg:min-h-0 transition-transform duration-500">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-black text-white/80 uppercase tracking-[0.3em]">
                Overview
              </h2>
              <button
                onClick={fetchOverviewStats}
                disabled={loading}
                className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white transition-all hover:bg-white/30 border border-white/20 active:scale-95 disabled:opacity-50"
              >
                {loading ? "⟳" : "↻"}
              </button>
            </div>

            {error ? (
              <div className="flex flex-1 items-center justify-center rounded-[2rem] bg-white/10 p-6 border border-white/10">
                <p className="text-center text-xs font-bold text-white/80 uppercase tracking-wider">{error}</p>
              </div>
            ) : (
              <div className="grid flex-1 gap-4 sm:grid-cols-1 md:grid-cols-3">
                <div className="group flex flex-col items-center justify-center rounded-[2rem] bg-white/20 border border-white/40 p-4 shadow-sm transition-all duration-300 hover:bg-white/40 hover:scale-[1.02]">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-1">
                    Pending
                  </h3>
                  <div className="text-6xl font-extralight text-white drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                    {formatNumber(stats.pending)}
                  </div>
                </div>

                <div className="group flex flex-col items-center justify-center rounded-[2rem] bg-white/20 border border-white/40 p-4 shadow-sm transition-all duration-300 hover:bg-white/40 hover:scale-[1.02]">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-1">
                    Delivered
                  </h3>
                  <div className="text-6xl font-extralight text-white drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                    {formatNumber(stats.delivered)}
                  </div>
                </div>

                <div className="group flex flex-col items-center justify-center rounded-[2rem] bg-white/20 border border-white/40 p-4 shadow-sm transition-all duration-300 hover:bg-white/40 hover:scale-[1.02]">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-1">
                    Retrieved
                  </h3>
                  <div className="text-6xl font-extralight text-white drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                    {formatNumber(stats.retrieved)}
                  </div>
                  
                  {/* FILTER DROPDOWN */}
                  <div className="relative mt-3 w-full max-w-[120px]">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex w-full items-center justify-between rounded-full bg-white/30 px-3 py-1 text-[10px] font-bold text-white uppercase border border-white/20 transition-all hover:bg-white/40"
                    >
                      <span className="capitalize">{filter}</span>
                      <span className="text-[8px]">▼</span>
                    </button>

                    {showDropdown && (
                      <div className="absolute left-0 top-full z-[999] mt-2 w-full rounded-2xl bg-white/50 backdrop-blur-md p-1 shadow-2xl border border-white/40 text-[10px] font-bold text-[#df4473]">
                        {["today", "week", "month", "year"].map((item) => (
                          <button
                            key={item}
                            onClick={() => {
                              setFilter(item);
                              setShowDropdown(false);
                            }}
                            className="w-full rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-pink-50 capitalize"
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
            )}
          </div>

          {/* RECENT ACTIVITY */}
          <aside className="relative z-10 flex flex-col rounded-[2.5rem] bg-black/5 backdrop-blur-md border border-white/20 p-6 shadow-inner lg:min-h-0 transition-all duration-500">
            <h2 className="mb-4 text-xs font-black text-white/80 uppercase tracking-[0.3em]">
              Recent
            </h2>
            <div className={`flex-1 overflow-y-auto pr-1 ${scrollbarClass}`}>
              <div className="flex flex-col gap-3">
                {recent.length > 0 ? (
                  recent.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-2xl bg-white/10 p-3 border border-white/10 hover:bg-white/30 transition-all duration-200 cursor-default group"
                    >
                      <span className="text-xl drop-shadow-sm group-hover:scale-125 transition-transform duration-200">
                        {item.type === "Delivered" ? "📦" : "📤"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">
                          {item.type}
                        </p>
                        <p className="text-[11px] font-medium text-white/80 truncate">
                          {item.parcelName && item.parcelName !== "Parcel"
                            ? item.parcelName
                            : `Tracking #${item.trackingNumber}`}
                        </p>
                        <p className="text-[10px] font-bold text-white/50 uppercase">
                          {item.date.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <p className="text-sm font-bold text-white/80 uppercase tracking-wider">
                      No recent updates
                    </p>
                    <p className="mt-1 text-[10px] text-white/50 font-bold uppercase">
                      Activity will appear here once processed.
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