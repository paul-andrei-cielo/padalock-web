"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ---------- Types ---------- */

interface Parcel {
  _id: string;
  trackingNumber: string;
  parcelName: string;
  status: "PENDING" | "DELIVERED" | "RETRIEVED";
  deliveryDate: string | null;
  retrievedDate: string | null;
}

type Filter = "today" | "week" | "month" | "year";

interface ActivityEvent {
  type: "Delivered" | "Retrieved";
  parcelName: string;
  trackingNumber: string;
  date: Date;
}

/* ---------- Constants ---------- */

const navItems = [
  { label: "Parcels", href: "/register" },
  { label: "Activity", href: "/activity" },
  { label: "Notifications", href: "/notifications" },
  { label: "Account", href: "/account" },
];

const filterLabels: Record<Filter, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  year: "This year",
};

// Status colors are chosen to stay readable on the dark rose glass.
const COLORS = {
  pending: "#ffc46b", // amber
  delivered: "#ffffff", // white
  retrieved: "#7ee0b5", // mint
};

// Shared glass surface: a dark rose tint under the blur keeps white text
// readable, while the light border + top highlight keep the glass feel.
const glass =
  "relative rounded-[2rem] border border-white/35 bg-[#a82452]/60 backdrop-blur-xl " +
  "shadow-[0_8px_32px_rgba(120,20,55,0.25),inset_0_1px_0_rgba(255,255,255,0.25)]";

const glassInner =
  "rounded-3xl border border-white/20 bg-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8789b]";

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full";

/* ---------- Icons ---------- */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ClockIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const BoxIcon = () => (
  <svg {...iconProps}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </svg>
);
const CheckIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l3 3 5-6" />
  </svg>
);
const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg {...iconProps} width={16} height={16} className={spinning ? "animate-spin" : ""}>
    <path d="M20 11a8 8 0 10-2.3 5.7" />
    <path d="M20 4v7h-7" />
  </svg>
);
const ChevronIcon = () => (
  <svg {...iconProps} width={14} height={14}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/* ---------- Helpers ---------- */

const formatNumber = (num: number) => num.toString().padStart(2, "0");

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function isInRange(date: Date, filter: Filter) {
  const now = new Date();
  switch (filter) {
    case "today":
      return sameDay(date, now);
    case "week": {
      const weekAgo = startOfDay(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      return date >= weekAgo;
    }
    case "month":
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    case "year":
      return date.getFullYear() === now.getFullYear();
  }
}

/* ---------- Page ---------- */

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("today");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownClosing, setDropdownClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDropdown = () => {
    setDropdownClosing(false);
    setShowDropdown(true);
  };

  const closeDropdown = () => {
    // With reduced motion there is no animation to wait for, so close right away.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShowDropdown(false);
      setDropdownClosing(false);
      return;
    }
    setDropdownClosing(true);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      window.location.href = "/login";
      return;
    }
    setIsAuthenticated(true);
  }, []);

  const fetchParcels = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const token = localStorage.getItem("token")!;
      const response = await fetch("/api/parcels", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch parcels");

      setParcels(await response.json());
    } catch (err) {
      setError("Couldn't load parcel stats. Refresh to try again.");
      console.error("Error fetching parcels:", err);
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, []);

  // Fetch once after auth. Changing the filter no longer refetches or
  // flashes the full-screen spinner; stats are derived below.
  useEffect(() => {
    if (isAuthenticated === true) fetchParcels();
  }, [isAuthenticated, fetchParcels]);

  /* ----- Derived data ----- */

  const stats = useMemo(() => {
    return parcels.reduce(
      (acc, p) => {
        if (p.status === "PENDING") acc.pending++;
        else if (p.status === "DELIVERED") acc.delivered++;
        else if (
          p.status === "RETRIEVED" &&
          p.retrievedDate &&
          isInRange(new Date(p.retrievedDate), filter)
        ) {
          acc.retrieved++;
        }
        return acc;
      },
      { pending: 0, delivered: 0, retrieved: 0 }
    );
  }, [parcels, filter]);

  const events: ActivityEvent[] = useMemo(
    () =>
      parcels
        .flatMap((p) => {
          const list: ActivityEvent[] = [];
          if (p.deliveryDate)
            list.push({
              type: "Delivered",
              parcelName: p.parcelName,
              trackingNumber: p.trackingNumber,
              date: new Date(p.deliveryDate),
            });
          if (p.retrievedDate)
            list.push({
              type: "Retrieved",
              parcelName: p.parcelName,
              trackingNumber: p.trackingNumber,
              date: new Date(p.retrievedDate),
            });
          return list;
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [parcels]
  );

  const recent = events.slice(0, 8);

  // Last 7 days of deliveries vs retrievals, oldest → newest.
  const week = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return {
        date: d,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        delivered: 0,
        retrieved: 0,
      };
    });
    events.forEach((e) => {
      const day = days.find((d) => sameDay(d.date, e.date));
      if (!day) return;
      if (e.type === "Delivered") day.delivered++;
      else day.retrieved++;
    });
    const max = Math.max(1, ...days.map((d) => Math.max(d.delivered, d.retrieved)));
    const totalDelivered = days.reduce((s, d) => s + d.delivered, 0);
    const totalRetrieved = days.reduce((s, d) => s + d.retrieved, 0);
    return { days, max, totalDelivered, totalRetrieved };
  }, [events]);

  /* ----- Loading ----- */

  if (isAuthenticated === null || initialLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#df4473_0%,#e8789b_50%,#ee94ae_100%)]">
        <div
          role="status"
          aria-label="Loading dashboard"
          className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/30 border-t-white"
        />
      </main>
    );
  }

  /* ----- Render ----- */

  return (
    <main
      className="pl-fade min-h-screen p-4 md:p-6 lg:h-screen lg:overflow-hidden lg:p-8
        bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.28),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.35),transparent_50%),linear-gradient(180deg,#df4473_0%,#e8789b_50%,#ee94ae_100%)]"
    >
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-4 lg:gap-5">
        {/* HEADER */}
        <header
          className={`pl-fade ${glass} z-[100] shrink-0 !rounded-2xl px-4 py-3 md:px-6`}
        >
          <div className="flex items-center justify-between">
            <Link href="/home" className={`rounded-lg ${focusRing}`}>
              <Image
                src="/padalock-logo.png"
                alt="Padalock"
                width={200}
                height={50}
                className="w-28 md:w-40"
                priority
              />
            </Link>

            <nav className="hidden gap-8 font-semibold text-white lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group relative rounded py-1 ${focusRing}`}
                >
                  {item.label}
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-white transition-all duration-300 group-hover:w-full group-focus-visible:w-full" />
                </Link>
              ))}
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`relative z-[110] rounded-lg p-2 lg:hidden ${focusRing}`}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <div className="flex h-4 w-6 flex-col justify-between">
                <span
                  className={`h-0.5 w-full origin-left rounded-full bg-white transition-all duration-300 ${
                    isMenuOpen ? "rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full rounded-full bg-white transition-all duration-300 ${
                    isMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-full origin-left rounded-full bg-white transition-all duration-300 ${
                    isMenuOpen ? "-rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>

          {/* MOBILE NAV */}
          <div
            className={`absolute left-0 right-0 top-full mt-3 px-2 transition-all duration-300 ease-out lg:hidden ${
              isMenuOpen
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-4 opacity-0"
            }`}
          >
            <nav className="flex flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl p-4 font-semibold text-[#b02a58] transition-colors hover:bg-pink-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* CONTENT: left column = two rows, right column = full-height Recent */}
        <section className="grid flex-1 gap-4 lg:min-h-0 lg:grid-cols-[1.9fr_1fr] lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-5">
          {/* ROW 1 — OVERVIEW */}
          <div className={`pl-rise pl-d1 ${glass} z-30 flex flex-col p-5 lg:min-h-0 lg:p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Overview</h2>
              <button
                onClick={fetchParcels}
                disabled={refreshing}
                aria-label="Refresh stats"
                className={`flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25 active:scale-95 disabled:opacity-60 ${focusRing}`}
              >
                <RefreshIcon spinning={refreshing} />
                Refresh
              </button>
            </div>

            {error ? (
              <div
                role="alert"
                className={`${glassInner} flex flex-1 items-center justify-center p-6`}
              >
                <p className="text-center text-sm font-semibold text-white">
                  {error}
                </p>
              </div>
            ) : (
              <div className="pl-stagger pl-base-1 grid flex-1 gap-4 md:grid-cols-[0.75fr_1fr_1fr] lg:min-h-0">
                {/* Pending — compact */}
                <StatCard
                  label="Pending"
                  value={stats.pending}
                  color={COLORS.pending}
                  icon={<ClockIcon />}
                  compact
                />

                <StatCard
                  label="Delivered"
                  value={stats.delivered}
                  color={COLORS.delivered}
                  icon={<BoxIcon />}
                />

                <StatCard
                  label="Retrieved"
                  value={stats.retrieved}
                  color={COLORS.retrieved}
                  icon={<CheckIcon />}
                  action={
                    <div className="relative">
                      <button
                        onClick={() =>
                          showDropdown ? closeDropdown() : openDropdown()
                        }
                        aria-haspopup="listbox"
                        aria-expanded={showDropdown && !dropdownClosing}
                        className={`flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/25 ${focusRing}`}
                      >
                        {filterLabels[filter]}
                        <ChevronIcon />
                      </button>

                      {showDropdown && (
                        <>
                          <button
                            aria-label="Close filter"
                            className="fixed inset-0 z-[998] cursor-default"
                            onClick={closeDropdown}
                          />
                          <div
                            role="listbox"
                            className={`${
                              dropdownClosing ? "pl-drop-out" : "pl-drop"
                            } absolute right-0 top-full z-[999] mt-2 w-36 rounded-2xl border border-white/30 bg-[#7a1a3d]/95 p-1.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl`}
                            onAnimationEnd={(e) => {
                              if (e.target !== e.currentTarget) return;
                              if (dropdownClosing) {
                                setShowDropdown(false);
                                setDropdownClosing(false);
                              }
                            }}
                          >
                            {(Object.keys(filterLabels) as Filter[]).map(
                              (item) => (
                                <button
                                  key={item}
                                  role="option"
                                  aria-selected={filter === item}
                                  onClick={() => {
                                    setFilter(item);
                                    closeDropdown();
                                  }}
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/15 ${
                                    filter === item ? "bg-white/20" : ""
                                  }`}
                                >
                                  {filterLabels[item]}
                                  {filter === item && <span>✓</span>}
                                </button>
                              )
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  }
                />
              </div>
            )}
          </div>

          {/* RECENT — spans both rows on desktop */}
          <aside
            className={`pl-rise pl-d2 ${glass} z-10 flex flex-col p-5 lg:row-span-2 lg:min-h-0 lg:p-6`}
          >
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-white">
                Recent activity
              </h2>
              <Link
                href="/activity"
                className={`rounded text-xs font-semibold text-white underline-offset-4 hover:underline ${focusRing}`}
              >
                View all
              </Link>
            </div>

            <div
              className={`max-h-[28rem] flex-1 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 ${scrollbarClass}`}
            >
              {recent.length > 0 ? (
                <ul className="pl-stagger pl-base-2 flex flex-col gap-2.5">
                  {recent.map((item, index) => {
                    const delivered = item.type === "Delivered";
                    const color = delivered
                      ? COLORS.delivered
                      : COLORS.retrieved;
                    return (
                      <li
                        key={`${item.trackingNumber}-${item.type}-${index}`}
                        className={`${glassInner} flex items-center gap-3 p-3 transition motion-safe:hover:-translate-y-0.5 hover:bg-white/20`}
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b0f33]/50"
                          style={{ color }}
                        >
                          {delivered ? <BoxIcon /> : <CheckIcon />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-white">
                              {item.type}
                            </p>
                            <p className="shrink-0 text-xs text-white/80">
                              {item.date.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                              ,{" "}
                              {item.date.toLocaleTimeString(undefined, {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <p className="truncate text-xs text-white/90">
                            {item.parcelName && item.parcelName !== "Parcel"
                              ? item.parcelName
                              : `Tracking #${item.trackingNumber}`}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-semibold text-white">
                    No recent updates
                  </p>
                  <p className="mt-1 max-w-[16rem] text-xs text-white/80">
                    Deliveries and pickups will show up here as they happen.
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* ROW 2 — WEEKLY ACTIVITY */}
          <div className={`pl-rise pl-d3 ${glass} z-20 flex flex-col p-5 lg:min-h-0 lg:p-6`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Last 7 days
                </h2>
                <p className="text-xs text-white/80">
                  {week.totalDelivered} delivered · {week.totalRetrieved}{" "}
                  retrieved
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-white">
                <Legend color={COLORS.delivered} label="Delivered" />
                <Legend color={COLORS.retrieved} label="Retrieved" />
              </div>
            </div>

            <div
              className={`${glassInner} flex min-h-[11rem] flex-1 items-stretch gap-2 px-3 pb-3 pt-4 sm:gap-4 lg:min-h-0`}
              role="img"
              aria-label={`Parcels delivered and retrieved over the last 7 days: ${week.totalDelivered} delivered, ${week.totalRetrieved} retrieved`}
            >
              {week.days.map((d) => (
                <div
                  key={d.date.toISOString()}
                  className="flex min-w-0 flex-1 flex-col"
                >
                  <div className="flex min-h-0 flex-1 items-end justify-center gap-1 border-b border-white/25 sm:gap-1.5">
                    <Bar
                      value={d.delivered}
                      max={week.max}
                      color={COLORS.delivered}
                    />
                    <Bar
                      value={d.retrieved}
                      max={week.max}
                      color={COLORS.retrieved}
                    />
                  </div>
                  <p
                    className={`mt-2 text-center text-xs ${
                      sameDay(d.date, new Date())
                        ? "font-bold text-white"
                        : "font-medium text-white/80"
                    }`}
                  >
                    {d.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------- Components ---------- */

// Counts a number up from its previous value (skipped for reduced motion).
function useCountUp(target: number, duration = 700) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target);
      prev.current = target;
      return;
    }
    const from = prev.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function StatCard({
  label,
  value,
  color,
  icon,
  compact = false,
  action,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  compact?: boolean;
  action?: React.ReactNode;
}) {
  const display = useCountUp(value);
  return (
    <div
      className={`${glassInner} flex flex-col justify-between p-4 transition hover:bg-white/20 motion-safe:hover:-translate-y-0.5 lg:min-h-0 ${
        compact ? "md:p-4" : "md:p-5"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6b0f33]/50"
            style={{ color }}
          >
            {icon}
          </span>
          <h3 className="text-sm font-semibold text-white">{label}</h3>
        </div>
        {action}
      </div>

      <p
        className={`mt-3 font-light tabular-nums leading-none text-white drop-shadow-[0_2px_8px_rgba(100,8,40,0.4)] ${
          compact ? "text-5xl" : "text-6xl xl:text-7xl"
        }`}
        aria-label={`${value} ${label.toLowerCase()}`}
      >
        {formatNumber(display)}
      </p>

      <span
        className="mt-3 block h-1 w-10 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}

function Bar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = value === 0 ? 0 : Math.max(8, (value / max) * 100);
  // Bars grow up from the baseline on first render.
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="flex h-full w-full max-w-[28px] flex-col items-center justify-end">
      {value > 0 && (
        <span className="mb-1 text-[11px] font-semibold leading-none text-white">
          {value}
        </span>
      )}
      <div
        className="w-full rounded-t-md transition-[height] duration-700 ease-out motion-reduce:transition-none"
        style={{
          height: !grown || value === 0 ? 3 : `${pct}%`,
          maxHeight: "calc(100% - 16px)",
          backgroundColor: color,
          opacity: value === 0 ? 0.35 : 1,
        }}
      />
    </div>
  );
}