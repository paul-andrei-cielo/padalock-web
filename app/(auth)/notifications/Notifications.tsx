"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ---------- Types ---------- */

type Category = "SECURITY" | "DELIVERY" | "RETRIEVAL" | "RETURN";
type Severity = "critical" | "warning" | "info";
type CategoryFilter = "ALL" | Category;

interface NotificationItem {
  id: string;
  ts: number;
  category: Category;
  severity: Severity;
  title: string;
  // Private by default: no tracking numbers or item names in the message.
  message: string;
  // Only shown when "Show parcel details" is on, and even then kept minimal.
  detail?: string;
}

/* ---------- Constants ---------- */

const navItems = [
  { label: "Parcels", href: "/register" },
  { label: "Activity", href: "/activity" },
  { label: "Notifications", href: "/notifications" },
  { label: "Account", href: "/account" },
];

const LAST_READ_KEY = "notificationsLastViewed";
const DISMISSED_KEY = "notificationsDismissed";
const DETAILS_KEY = "notificationsShowDetails";

// Order of the type filter chips. Each type has its own color and icon.
const categoryOrder: Category[] = ["SECURITY", "DELIVERY", "RETRIEVAL", "RETURN"];

const categoryConfig: Record<
  Category,
  { label: string; singular: string; accent: string; icon: IconName }
> = {
  SECURITY: { label: "Security", singular: "Security alert", accent: "#ffc46b", icon: "alert" },
  DELIVERY: { label: "Delivery", singular: "Delivery", accent: "#ffffff", icon: "box" },
  RETRIEVAL: { label: "Retrieval", singular: "Retrieval", accent: "#7ee0b5", icon: "unlock" },
  RETURN: { label: "Returns", singular: "Return", accent: "#8ecbff", icon: "return" },
};

const glass =
  "relative rounded-[2rem] border border-white/35 bg-[#a82452]/60 backdrop-blur-xl " +
  "shadow-[0_8px_32px_rgba(120,20,55,0.25),inset_0_1px_0_rgba(255,255,255,0.25)]";

const glassInner =
  "rounded-3xl border border-white/20 bg-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8789b]";

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full";

const pageBg =
  "bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.28),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.35),transparent_50%),linear-gradient(180deg,#df4473_0%,#e8789b_50%,#ee94ae_100%)]";

const pillButton = `flex h-10 items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

/* ---------- Icons ---------- */

const iconPaths = {
  box: "M21 8l-9-5-9 5 9 5 9-5z M3 8v8l9 5 9-5V8 M12 13v8",
  unlock: "M5 11h14v10H5z M8 11V7a4 4 0 017.5-1.5",
  return: "M9 14l-5-5 5-5 M4 9h11a5 5 0 010 10h-3",
  alert: "M12 4l9 16H3L12 4z M12 10v4 M12 17v.5",
  check: "M5 12.5l4.5 4.5L19 7",
  close: "M6 6l12 12M18 6L6 18",
  refresh: "M20 11a8 8 0 10-2.3 5.7 M20 4v7h-7",
  trash: "M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3",
  bell: "M6 9a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8 M10 21a2 2 0 004 0",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff:
    "M3 3l18 18 M10.6 6.2A9.5 9.5 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 4 M6.6 6.6A17 17 0 002 12s4 7 10 7a9.6 9.6 0 004.4-1.1 M9.9 9.9a3 3 0 004.2 4.2",
  chevron: "M9 6l6 6-6 6",
} as const;

type IconName = keyof typeof iconPaths;

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

/* ---------- Helpers ---------- */

function formatWhen(ts: number) {
  const d = new Date(ts);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - day.getTime()) / 86400000);
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${time}`;
}

const last4 = (s: string) => s.replace(/\s/g, "").slice(-4);

// Turns a locker log into a notification. Messages are deliberately generic;
// full tracking numbers and item names are never shown here (they stay on the
// Parcels and Activity pages).
function mapLog(log: any): NotificationItem | null {
  const ts = new Date(log.timestamp).getTime();
  if (isNaN(ts)) return null;
  const base = { id: log._id as string, ts };

  switch (log.action) {
    case "DELIVERY_SUCCESS": {
      const m = log.details?.match(/Parcel (.+?) delivered/i);
      return {
        ...base,
        category: "DELIVERY",
        severity: "info",
        title: "Parcel delivered",
        message: "A parcel was delivered to your locker.",
        detail: m ? `Parcel ending ${last4(m[1])}` : undefined,
      };
    }
    case "RETRIEVE": {
      const m = log.details?.match(/Parcels retrieved:\s*(.+)/i);
      const list = m ? m[1].split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      return {
        ...base,
        category: "RETRIEVAL",
        severity: "info",
        title: "Parcel retrieved",
        message: "A parcel was taken out of your locker.",
        detail:
          list.length === 1
            ? `Parcel ending ${last4(list[0])}`
            : list.length > 1
            ? `${list.length} parcels`
            : undefined,
      };
    }
    case "RETURN_PICKUP_SUCCESS": {
      const count = log.returnInfo?.parcelCount || log.returnInfo?.items?.length || 0;
      return {
        ...base,
        category: "RETURN",
        severity: "info",
        title: "Return picked up",
        message: "A return was picked up from your locker.",
        // Item names are never shown, only how many parcels.
        detail: count ? `${count} ${count === 1 ? "parcel" : "parcels"}` : undefined,
      };
    }
    case "INVALID_CODE":
      return {
        ...base,
        category: "SECURITY",
        severity: "warning",
        title: "Incorrect PIN entered",
        message: "Someone entered a wrong PIN on your locker.",
      };
    case "PIN_LOCKOUT":
      return {
        ...base,
        category: "SECURITY",
        severity: "critical",
        title: "Locker locked after wrong PINs",
        message: "Too many wrong PIN attempts were made. The locker is temporarily locked.",
      };
    case "LID_OPEN_TOO_LONG":
      return {
        ...base,
        category: "SECURITY",
        severity: "warning",
        title: "Locker left open",
        message: "The locker door has been open for too long. Check that it's closed.",
      };
    default:
      return null;
  }
}

function readStoredSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/* ---------- Components ---------- */

function FilterChip({
  active,
  onClick,
  children,
  count,
  dot,
  pulse,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
  dot?: string;
  pulse?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${focusRing} ${
        active
          ? "border-white bg-white text-[#8a1a42] shadow-md"
          : "border-white/35 bg-white/15 text-white hover:bg-white/25"
      }`}
    >
      {dot && (
        <span
          className={`h-2.5 w-2.5 rounded-full ${pulse ? "animate-pulse" : ""} ${
            dot === "#ffffff" ? "border border-[#8a1a42]/40" : ""
          }`}
          style={{ backgroundColor: dot }}
          aria-hidden
        />
      )}
      {children}
      <span className={active ? "text-[#8a1a42]/80" : "text-white/80"}>{count}</span>
    </button>
  );
}

function NotificationCard({
  item,
  unread,
  showDetails,
  onDismiss,
}: {
  item: NotificationItem;
  unread: boolean;
  showDetails: boolean;
  onDismiss: (id: string) => void;
}) {
  const cfg = categoryConfig[item.category];
  const security = item.category === "SECURITY";
  const critical = item.severity === "critical";

  return (
    <li
      className={`animate-notification-card relative overflow-hidden rounded-3xl transition-colors ${
        security
          ? `border-2 bg-[#5c0f2e] ${
              unread ? "border-[#ffc46b] shadow-[0_0_0_4px_rgba(255,196,107,0.18)]" : "border-[#ffc46b]/50"
            }`
          : `border ${
              unread
                ? "border-white/40 bg-white/25 hover:bg-white/30"
                : "border-white/20 bg-white/[0.14] hover:bg-white/20"
            }`
      }`}
    >
      <span
        className={`absolute inset-y-0 left-0 ${security ? "w-2" : "w-1.5"}`}
        style={{ backgroundColor: cfg.accent, opacity: security || unread ? 1 : 0.6 }}
        aria-hidden
      />

      <div className="flex items-start gap-3 p-4 pl-6">
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl ${
            security
              ? "h-12 w-12 bg-[#ffc46b] text-[#5c2e00]"
              : "h-11 w-11 bg-[#6b0f33]/55"
          }`}
          style={security ? undefined : { color: cfg.accent }}
        >
          <Icon name={cfg.icon} size={security ? 24 : 20} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {security && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  critical ? "bg-white text-[#8a1a42]" : "bg-[#ffc46b] text-[#5c2e00]"
                }`}
              >
                {critical ? "Critical" : "Warning"}
              </span>
            )}
            <h3
              className={`min-w-0 break-words text-base text-white ${
                security ? "font-extrabold" : "font-bold"
              }`}
            >
              {item.title}
            </h3>
            {unread && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span
                  className={`h-2 w-2 rounded-full ${
                    security ? "animate-pulse bg-[#ffc46b]" : "bg-white"
                  }`}
                  aria-hidden
                />
                <span className="sr-only">Unread</span>
                <span aria-hidden className="text-white/90">New</span>
              </span>
            )}
          </div>

          <p className={`mt-1 text-sm ${security ? "text-white" : "text-white/95"}`}>
            {item.message}
          </p>

          {showDetails && item.detail && (
            <p className="mt-1.5 inline-block rounded-full bg-[#6b0f33]/50 px-2.5 py-0.5 text-xs font-semibold text-white">
              {item.detail}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/90">
            <span>{formatWhen(item.ts)}</span>
            {security && (
              <Link
                href="/activity"
                className={`inline-flex items-center gap-1 rounded font-bold text-[#ffc46b] underline-offset-4 hover:underline ${focusRing}`}
              >
                Review in Activity
                <Icon name="chevron" size={12} />
              </Link>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          aria-label={`Clear notification: ${item.title}`}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/20 hover:text-white ${focusRing}`}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </li>
  );
}

/* ---------- Page ---------- */

export default function NotificationsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Stored on this device only (the server logs stay untouched).
  const [lastRead, setLastRead] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);

  const [filter, setFilter] = useState<CategoryFilter>("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [undo, setUndo] = useState<string[] | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ----- Auth + stored preferences ----- */

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      window.location.href = "/login";
      return;
    }
    setLastRead(Number(localStorage.getItem(LAST_READ_KEY)) || 0);
    setDismissed(readStoredSet(DISMISSED_KEY));
    setShowDetails(localStorage.getItem(DETAILS_KEY) === "1");
    setIsAuthenticated(true);
  }, []);

  // Leaving the page marks everything as read. The timeout skips React
  // StrictMode's fake unmount in development.
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current && localStorage.getItem("token")) {
          localStorage.setItem(LAST_READ_KEY, Date.now().toString());
        }
      }, 0);
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setRefreshing(true);
      const res = await fetch("/api/logs", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Couldn't load notifications.");
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : [])
        .map(mapLog)
        .filter(Boolean) as NotificationItem[];
      // Newest first. This order is what the "All" tab shows.
      setItems(mapped.sort((a, b) => b.ts - a.ts));
      setError("");
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Couldn't load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === true) fetchNotifications();
  }, [isAuthenticated, fetchNotifications]);

  /* ----- Manage: read / clear / restore ----- */

  const persistDismissed = (next: Set<string>) => {
    setDismissed(next);
    // Keep storage small: remember only the most recent 500 cleared ids.
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next).slice(-500)));
  };

  const dismiss = (ids: string[]) => {
    if (ids.length === 0) return;
    const next = new Set(dismissed);
    ids.forEach((id) => next.add(id));
    persistDismissed(next);
    setUndo(ids);
    setConfirmClear(false);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 7000);
  };

  const undoDismiss = () => {
    if (!undo) return;
    const next = new Set(dismissed);
    undo.forEach((id) => next.delete(id));
    persistDismissed(next);
    setUndo(null);
  };

  const restoreAll = () => {
    persistDismissed(new Set());
    setUndo(null);
  };

  const markAllRead = () => {
    const now = Date.now();
    localStorage.setItem(LAST_READ_KEY, now.toString());
    setLastRead(now);
  };

  const toggleDetails = () => {
    const next = !showDetails;
    setShowDetails(next);
    localStorage.setItem(DETAILS_KEY, next ? "1" : "0");
  };

  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  /* ----- Derived ----- */

  const isUnread = useCallback((n: NotificationItem) => n.ts > lastRead, [lastRead]);

  const visible = useMemo(() => items.filter((n) => !dismissed.has(n.id)), [items, dismissed]);
  const base = useMemo(
    () => (unreadOnly ? visible.filter(isUnread) : visible),
    [visible, unreadOnly, isUnread]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: base.length };
    base.forEach((n) => (c[n.category] = (c[n.category] || 0) + 1));
    return c;
  }, [base]);

  // One flat list, newest first, whether it's "All" or a single type.
  const shown = useMemo(
    () => (filter === "ALL" ? base : base.filter((n) => n.category === filter)),
    [base, filter]
  );

  const unreadTotal = visible.filter(isUnread).length;
  const unreadSecurity = visible.filter((n) => n.category === "SECURITY" && isUnread(n)).length;
  const clearedCount = items.filter((n) => dismissed.has(n.id)).length;

  const clearLabel = filter === "ALL" ? "Clear all" : `Clear ${categoryConfig[filter].label.toLowerCase()}`;
  const shownUnreadSecurity = shown.filter((n) => n.category === "SECURITY" && isUnread(n)).length;

  /* ----- Early states ----- */

  if (isAuthenticated === null) {
    return (
      <main className={`flex h-screen items-center justify-center ${pageBg}`}>
        <p className="animate-pulse text-xl font-extrabold text-white">Checking authentication…</p>
      </main>
    );
  }

  if (isAuthenticated === false) {
    return (
      <main className={`flex h-screen items-center justify-center p-4 ${pageBg}`}>
        <div className="text-center">
          <p className="mb-3 text-2xl font-extrabold text-white md:text-3xl">
            You&apos;re not logged in
          </p>
          <p className="text-lg font-semibold text-white">Redirecting to login…</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={`flex min-h-screen items-center justify-center ${pageBg}`}>
        <div
          role="status"
          aria-label="Loading notifications"
          className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/30 border-t-white"
        />
      </main>
    );
  }

  /* ----- Render ----- */

  const securityBadge =
    unreadSecurity > 0 ? (
      <span
        className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ffc46b] px-1 text-[11px] font-bold text-[#5c2e00]"
        aria-label={`${unreadSecurity} unread security alerts`}
      >
        {unreadSecurity}
      </span>
    ) : null;

  return (
    <main
      className={`flex min-h-screen flex-col p-4 md:p-6 lg:h-screen lg:overflow-hidden lg:p-8 ${pageBg}`}
    >
      <style jsx global>{`
        @keyframes itemEntrance {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-notification-card { animation: itemEntrance 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .animate-notification-card { animation: none; }
        }
      `}</style>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 lg:min-h-0 lg:gap-5">
        {/* HEADER */}
        <header className={`${glass} z-[100] shrink-0 !rounded-2xl px-4 py-3 md:px-6`}>
          <div className="flex items-center justify-between">
            <Link href="/home" className={`rounded-lg ${focusRing}`}>
              <Image
                src="/padalock-logo.png"
                alt="Padalock home"
                width={200}
                height={50}
                className="w-28 md:w-40"
                priority
              />
            </Link>

            <nav className="hidden items-center gap-8 font-semibold text-white lg:flex">
              {navItems.map((item) => {
                const active = item.href === "/notifications";
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-2 rounded py-1 ${focusRing}`}
                  >
                    {item.label}
                    {active && securityBadge}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-0.5 bg-white transition-all duration-300 ${
                        active ? "w-full" : "w-0 group-hover:w-full group-focus-visible:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`relative z-[110] rounded-lg p-2 lg:hidden ${focusRing}`}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <div className="flex h-4 w-6 flex-col justify-between">
                <span className={`h-0.5 w-full origin-left rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "rotate-45" : ""}`} />
                <span className={`h-0.5 w-full rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`} />
                <span className={`h-0.5 w-full origin-left rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "-rotate-45" : ""}`} />
              </div>
            </button>
          </div>

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
                  className="flex items-center justify-between rounded-xl p-4 font-semibold text-[#b02a58] transition-colors hover:bg-pink-50"
                >
                  {item.label}
                  {item.href === "/notifications" && securityBadge}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* CONTENT */}
        <section className={`${glass} z-0 flex flex-1 flex-col gap-4 p-5 lg:min-h-0 lg:p-6`}>
          {/* Title + manage actions */}
          <div className="flex shrink-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-sm text-white/90">
                Alerts about your locker and parcels.{" "}
                <Link
                  href="/activity"
                  className={`rounded font-semibold underline underline-offset-4 ${focusRing}`}
                >
                  See full history in Activity
                </Link>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadTotal === 0}
                className={pillButton}
              >
                <Icon name="check" size={16} />
                Mark all read
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={shown.length === 0 || confirmClear}
                className={pillButton}
              >
                <Icon name="trash" size={16} />
                {clearLabel}
              </button>
              <button
                type="button"
                onClick={fetchNotifications}
                disabled={refreshing}
                aria-label="Refresh notifications"
                className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-60 ${focusRing}`}
              >
                <span className={refreshing ? "animate-spin" : ""}>
                  <Icon name="refresh" size={16} />
                </span>
              </button>
            </div>
          </div>

          {/* Clear confirmation */}
          {confirmClear && (
            <div
              role="alertdialog"
              aria-label="Confirm clearing notifications"
              className={`${glassInner} flex shrink-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
            >
              <p className="text-sm font-semibold text-white">
                Clear {shown.length} {shown.length === 1 ? "notification" : "notifications"} from this
                device?
                {shownUnreadSecurity > 0 && (
                  <span className="mt-0.5 block text-[#ffc46b]">
                    This includes {shownUnreadSecurity} unread security{" "}
                    {shownUnreadSecurity === 1 ? "alert" : "alerts"}.
                  </span>
                )}
                <span className="mt-0.5 block text-xs font-normal text-white/90">
                  Your Activity history isn&apos;t affected.
                </span>
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className={pillButton}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => dismiss(shown.map((n) => n.id))}
                  className={`h-10 rounded-full bg-white px-5 text-sm font-bold text-[#8a1a42] shadow-md hover:bg-pink-50 ${focusRing}`}
                >
                  {clearLabel}
                </button>
              </div>
            </div>
          )}

          {/* FILTERS (types) + options */}
          <div className={`${glassInner} shrink-0 space-y-3 p-3 sm:p-4`}>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
              <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")} count={counts.ALL || 0}>
                All
              </FilterChip>
              {categoryOrder.map((cat) => (
                <FilterChip
                  key={cat}
                  active={filter === cat}
                  onClick={() => setFilter(cat)}
                  count={counts[cat] || 0}
                  dot={categoryConfig[cat].accent}
                  pulse={cat === "SECURITY" && unreadSecurity > 0}
                >
                  {categoryConfig[cat].label}
                </FilterChip>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/20 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
              <button
                type="button"
                role="switch"
                aria-checked={unreadOnly}
                onClick={() => setUnreadOnly((v) => !v)}
                className={`flex items-center gap-2.5 rounded-full text-sm font-semibold text-white ${focusRing}`}
              >
                <span
                  className={`relative h-6 w-11 rounded-full border transition ${
                    unreadOnly ? "border-white bg-white" : "border-white/50 bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
                      unreadOnly ? "left-[22px] bg-[#8a1a42]" : "left-0.5 bg-white"
                    }`}
                    style={{ height: 18, width: 18 }}
                  />
                </span>
                Unread only
                <span className="text-white/80">{unreadTotal}</span>
              </button>

              <button
                type="button"
                role="switch"
                aria-checked={showDetails}
                onClick={toggleDetails}
                className={`flex items-center gap-2.5 rounded-full text-sm font-semibold text-white ${focusRing}`}
              >
                <span
                  className={`relative h-6 w-11 rounded-full border transition ${
                    showDetails ? "border-white bg-white" : "border-white/50 bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 rounded-full transition-all ${
                      showDetails ? "left-[22px] bg-[#8a1a42]" : "left-0.5 bg-white"
                    }`}
                    style={{ height: 18, width: 18 }}
                  />
                </span>
                <Icon name={showDetails ? "eye" : "eyeOff"} size={16} />
                Show parcel details
              </button>

              <p className="text-xs text-white/90 sm:ml-auto">
                {showDetails
                  ? "Only the last 4 characters of a parcel number are shown."
                  : "Parcel details are hidden for privacy."}
              </p>
            </div>
          </div>

          {/* LIST */}
          <div
            className={`max-h-[36rem] flex-1 space-y-5 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 ${scrollbarClass}`}
          >
            {error ? (
              <div role="alert" className={`${glassInner} flex flex-col items-center gap-3 p-8 text-center`}>
                <p className="text-sm font-semibold text-white">{error}</p>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className={`rounded-full bg-white px-5 py-2 text-sm font-bold text-[#8a1a42] ${focusRing}`}
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {/* Attention banner for unread security alerts */}
                {unreadSecurity > 0 && filter !== "SECURITY" && (
                  <div
                    role="alert"
                    className="flex flex-col gap-3 rounded-3xl border-2 border-[#ffc46b] bg-[#5c0f2e] p-4 shadow-[0_0_0_4px_rgba(255,196,107,0.18)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffc46b] text-[#5c2e00]">
                        <Icon name="alert" size={24} />
                      </span>
                      <p className="text-base font-extrabold text-white">
                        {unreadSecurity} new security {unreadSecurity === 1 ? "alert needs" : "alerts need"} your
                        attention
                        <span className="block text-sm font-normal text-white/90">
                          Check that these were you, and review your locker activity.
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFilter("SECURITY");
                        setUnreadOnly(false);
                      }}
                      className={`h-10 shrink-0 rounded-full bg-[#ffc46b] px-5 text-sm font-bold text-[#5c2e00] hover:bg-[#ffd08a] ${focusRing}`}
                    >
                      Review alerts
                    </button>
                  </div>
                )}

                {shown.length > 0 ? (
                  <ul className="space-y-2.5">
                    {shown.map((n) => (
                      <NotificationCard
                        key={n.id}
                        item={n}
                        unread={isUnread(n)}
                        showDetails={showDetails}
                        onDismiss={(id) => dismiss([id])}
                      />
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                    <span className="mb-3 text-white/90">
                      <Icon name="bell" size={32} />
                    </span>
                    <p className="text-sm font-bold text-white">
                      {visible.length === 0
                        ? clearedCount > 0
                          ? "All cleared"
                          : "You're all caught up"
                        : "Nothing here"}
                    </p>
                    <p className="mt-1 max-w-xs text-xs text-white/90">
                      {visible.length === 0
                        ? "New locker alerts will show up here."
                        : unreadOnly
                        ? "No unread notifications in this view."
                        : "No notifications of this type."}
                    </p>
                    {(unreadOnly || filter !== "ALL") && visible.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setUnreadOnly(false);
                          setFilter("ALL");
                        }}
                        className={`mt-4 rounded-full bg-white px-5 py-2 text-sm font-bold text-[#8a1a42] ${focusRing}`}
                      >
                        Show everything
                      </button>
                    )}
                  </div>
                )}

                {clearedCount > 0 && (
                  <p className="pb-1 text-center text-xs text-white/90">
                    {clearedCount} cleared on this device.{" "}
                    <button
                      type="button"
                      onClick={restoreAll}
                      className={`rounded font-semibold underline underline-offset-4 hover:text-white ${focusRing}`}
                    >
                      Restore cleared
                    </button>
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Undo toast */}
      {undo && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/40 bg-[#7a1a3d]/95 py-2 pl-5 pr-2 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl"
        >
          {undo.length === 1 ? "Notification cleared" : `${undo.length} notifications cleared`}
          <button
            type="button"
            onClick={undoDismiss}
            className={`rounded-full bg-white px-4 py-1.5 text-sm font-bold text-[#8a1a42] hover:bg-pink-50 ${focusRing}`}
          >
            Undo
          </button>
        </div>
      )}
    </main>
  );
}