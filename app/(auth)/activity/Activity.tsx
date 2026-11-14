"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ---------- Types ---------- */

type ActivityType =
  | "PENDING"
  | "DELIVERED"
  | "RETRIEVED"
  | "RETURN_REGISTERED"
  | "RETURN_DEPOSIT"
  | "RETURN_PICKUP";
type TypeFilter = "ALL" | "PENDING" | "DELIVERED" | "RETRIEVED" | "RETURNS";

const isReturnType = (t: ActivityType) => t.startsWith("RETURN");
type RangePreset = "ALL" | "TODAY" | "7D" | "30D" | "CUSTOM";
type ViewMode = "MAIN_ACTIVITY" | "AUDIT_LOGS";
type AuditFilter = "ALL" | "PIN" | "LOCK" | "PARCEL" | "SECURITY";
type AuditCategory = "PIN" | "LOCK" | "PARCEL";

interface Parcel {
  _id: string;
  trackingNumber: string;
  parcelName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  retrievedDate?: string;
  videoUrl?: string;
  // Optional fields added on the Parcels page
  source?: string;
  sourceOther?: string;
  dimensions?: { length: number; width: number; height: number };
}

interface Log {
  _id: string;
  userId: string;
  lockerId: string;
  actor: string;
  action: string;
  success: boolean;
  details: string;
  cameraRecording?: string;
  timestamp: string;
  returnInfo?: {
    parcelCount?: number;
    items?: string[];
    itemDescription?: string;
  } | null;
}

interface Locker {
  _id: string;
  code: string;
  status: string;
  failedPinAttempts: number;
  lockout: boolean;
}

// Return records from /api/returns (same shape as the Parcels > Returns tab).
interface ReturnRecord {
  _id: string;
  parcelCount?: number;
  items?: string[];
  itemDescription?: string;
  otp: string | null;
  otpExpiry: string | null;
  status: string;
  createdAt: string;
  pickedUpDate?: string;
}

interface ActivityItem {
  id: string;
  type: ActivityType;
  ts: number;
  primary: string;
  secondary?: string;
  details: [string, string][];
  clip?: { url: string; title: string };
  href?: string;
}

interface AuditItem {
  id: string;
  ts: number;
  event: string;
  category: AuditCategory;
  security: boolean;
  success: boolean;
  locker?: string;
}

/* ---------- Constants ---------- */

const API_BASE = "/api/parcels";
const LOGS_API = "/api/logs";
const LOCKER_API = "/api/locker";
const RETURNS_API = "/api/returns";

const navItems = [
  { label: "Parcels", href: "/register" },
  { label: "Activity", href: "/activity" },
  { label: "Notifications", href: "/notifications" },
  { label: "Account", href: "/account" },
];

// Each activity type has its own color, icon and label, so deliveries,
// retrievals and returns can be told apart at a glance.
const typeConfig: Record<
  ActivityType,
  {
    label: string;
    hint: string;
    accent: string;
    chip: string;
    icon: IconName;
  }
> = {
  PENDING: {
    label: "Pending",
    hint: "Awaiting delivery",
    accent: "#ffc46b",
    chip: "bg-[#ffc46b] text-[#5c2e00]",
    icon: "clock",
  },
  DELIVERED: {
    label: "Delivered",
    hint: "Dropped in the locker",
    accent: "#ffffff",
    chip: "bg-white text-[#8a1a42]",
    icon: "box",
  },
  RETRIEVED: {
    label: "Retrieved",
    hint: "Picked up from the locker",
    accent: "#7ee0b5",
    chip: "bg-[#7ee0b5] text-[#0b4a31]",
    icon: "unlock",
  },
  // All return events share the sky-blue accent and return icon.
  RETURN_REGISTERED: {
    label: "Return registered",
    hint: "Waiting for OTP and rider pickup",
    accent: "#8ecbff",
    chip: "border border-[#8ecbff] bg-[#8ecbff]/25 text-white",
    icon: "return",
  },
  RETURN_DEPOSIT: {
    label: "Return placed in locker",
    hint: "Item left in the locker for pickup",
    accent: "#8ecbff",
    chip: "bg-[#8ecbff] text-[#0b3a5c]",
    icon: "return",
  },
  RETURN_PICKUP: {
    label: "Return picked up",
    hint: "Rider collected the return",
    accent: "#8ecbff",
    chip: "bg-[#8ecbff] text-[#0b3a5c]",
    icon: "return",
  },
};

const typeFilters: { key: TypeFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "RETRIEVED", label: "Retrieved" },
  { key: "RETURNS", label: "Returns" },
];

const auditFilters: { key: AuditFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PIN", label: "PIN" },
  { key: "LOCK", label: "Lock" },
  { key: "PARCEL", label: "Parcels" },
  { key: "SECURITY", label: "Security" },
];

const rangePresets: { key: RangePreset; label: string }[] = [
  { key: "ALL", label: "All time" },
  { key: "TODAY", label: "Today" },
  { key: "7D", label: "7 days" },
  { key: "30D", label: "30 days" },
  { key: "CUSTOM", label: "Custom" },
];

const auditCategoryIcon: Record<AuditCategory, IconName> = {
  PIN: "shield",
  LOCK: "lock",
  PARCEL: "box",
};

const glass =
  "relative rounded-[2rem] border border-white/35 bg-[#a82452]/60 backdrop-blur-xl " +
  "shadow-[0_8px_32px_rgba(120,20,55,0.25),inset_0_1px_0_rgba(255,255,255,0.25)]";

const glassInner =
  "rounded-3xl border border-white/20 bg-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8789b]";

const inputClass =
  "h-11 rounded-full border border-white/35 bg-white/15 px-5 text-sm text-white placeholder:text-white/60 " +
  "outline-none transition focus:border-white/70 focus:bg-white/25 [color-scheme:dark]";

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full";

const pageBg =
  "bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.28),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.35),transparent_50%),linear-gradient(180deg,#df4473_0%,#e8789b_50%,#ee94ae_100%)]";

/* ---------- Icons ---------- */

const iconPaths = {
  clock: "M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3 2",
  box: "M21 8l-9-5-9 5 9 5 9-5z M3 8v8l9 5 9-5V8 M12 13v8",
  unlock: "M5 11h14v10H5z M8 11V7a4 4 0 017.5-1.5",
  lock: "M5 11h14v10H5z M8 11V7a4 4 0 018 0v4",
  return: "M9 14l-5-5 5-5 M4 9h11a5 5 0 010 10h-3",
  video: "M3 7h12v10H3z M15 11l6-3v8l-6-3",
  chevron: "M6 9l6 6 6-6",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14z M21 21l-4.3-4.3",
  close: "M6 6l12 12M18 6L6 18",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",
  check: "M5 12.5l4.5 4.5L19 7",
  alert: "M12 4l9 16H3L12 4z M12 10v4 M12 17v.5",
  refresh: "M20 11a8 8 0 10-2.3 5.7 M20 4v7h-7",
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

/* ---------- Date helpers ---------- */

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const parseInputDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

function rangeBounds(
  preset: RangePreset,
  from: string,
  to: string
): [number | null, number | null] {
  const today = startOfDay(new Date());
  switch (preset) {
    case "ALL":
      return [null, null];
    case "TODAY":
      return [today.getTime(), null];
    case "7D": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return [d.getTime(), null];
    }
    case "30D": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return [d.getTime(), null];
    }
    case "CUSTOM": {
      const start = from ? parseInputDate(from).getTime() : null;
      let end: number | null = null;
      if (to) {
        const e = parseInputDate(to);
        e.setHours(23, 59, 59, 999);
        end = e.getTime();
      }
      return [start, end];
    }
  }
}

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatFull = (ts: number) =>
  new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

function dayLabel(ts: number) {
  const day = startOfDay(new Date(ts));
  const today = startOfDay(new Date());
  const diff = Math.round((today.getTime() - day.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return day.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupByDay<T extends { ts: number }>(items: T[]) {
  const groups: { key: string; label: string; items: T[] }[] = [];
  items.forEach((item) => {
    const key = startOfDay(new Date(item.ts)).toISOString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: dayLabel(item.ts), items: [item] });
  });
  return groups;
}

const toTs = (s?: string | null) => {
  if (!s) return NaN;
  return new Date(s).getTime();
};

/* ---------- Data helpers ---------- */

const prettify = (s: string) =>
  s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

const shortRef = (id: string) => `#${id.slice(-6).toUpperCase()}`;

const sourceLabel = (p: Parcel) =>
  p.source === "Other" && p.sourceOther ? p.sourceOther : p.source;

function formatLogEvent(log: Log): string | null {
  switch (log.action) {
    case "PIN_VALID":
      return "Owner PIN verified";
    case "INVALID_CODE":
      return "Invalid code attempt";
    case "PIN_LOCKOUT":
      return "PIN lockout activated";
    case "PIN_RESET":
      return "PIN lockout reset";
    case "LOCK_OPEN":
      return "Locker opened";
    case "LOCK_CLOSED":
      return "Locker closed";
    case "DELIVERY_VALID": {
      const m = log.details?.match(/Tracking number (.+?) verified/i);
      return m ? `Tracking #${m[1]} verified` : "Tracking number verified";
    }
    case "DELIVERY_SUCCESS": {
      const m = log.details?.match(/Parcel (.+?) delivered/i);
      return m ? `Delivery #${m[1]} completed` : "Delivery completed";
    }
    case "RETRIEVE": {
      const m = log.details?.match(/Parcels retrieved:\s*(.+)/i);
      return m ? `Retrieved #${m[1]}` : "Retrieval completed";
    }
    case "RETURN_OTP_VALID":
      return "Return OTP verified";
    case "RETURN_OTP_INVALID":
      return "Invalid return OTP";
    case "RETURN_DEPOSITED":
      return "Return deposited";
    case "RETURN_PICKUP_SUCCESS":
      return "Return pickup completed";
    case "LID_OPEN_TOO_LONG":
      return "Locker left open";
    default:
      return null;
  }
}

function auditCategoryOf(action: string): AuditCategory {
  if (["PIN_VALID", "INVALID_CODE", "PIN_LOCKOUT", "PIN_RESET"].includes(action))
    return "PIN";
  if (["LOCK_OPEN", "LOCK_CLOSED", "LID_OPEN_TOO_LONG"].includes(action))
    return "LOCK";
  return "PARCEL";
}

const SECURITY_ACTIONS = [
  "INVALID_CODE",
  "PIN_LOCKOUT",
  "RETURN_OTP_INVALID",
  "LID_OPEN_TOO_LONG",
];

const compact = (rows: [string, string | undefined | null][]) =>
  rows.filter(([, v]) => v) as [string, string][];

/* ---------- Small components ---------- */

function FilterChip({
  active,
  onClick,
  children,
  dot,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
  count?: number;
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
          className={`h-2.5 w-2.5 rounded-full ${
            dot === "#ffffff" ? "border border-[#8a1a42]/40" : ""
          }`}
          style={{ backgroundColor: dot }}
          aria-hidden
        />
      )}
      {children}
      {count !== undefined && (
        <span className={active ? "text-[#8a1a42]/80" : "text-white/80"}>
          {count}
        </span>
      )}
    </button>
  );
}

function DayHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="sticky top-0 z-10 py-1.5">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#7a1a3d]/90 px-3.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
        {label}
        <span className="font-semibold text-white/80">{count}</span>
      </span>
    </div>
  );
}

function ClipModal({
  clip,
  onClose,
}: {
  clip: { url: string; title: string };
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[200] flex items-center justify-center bg-[#3d0a20]/70 p-4 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={clip.title}
        className="animate-slide-up w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/35 bg-[#7a1a3d]/90 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between gap-4 p-4 pl-6">
          <p className="min-w-0 truncate text-base font-bold text-white">
            {clip.title}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white hover:bg-white/25 ${focusRing}`}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="aspect-video bg-black">
          <video
            src={clip.url}
            autoPlay
            controls
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function ActivityPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("MAIN_ACTIVITY");

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [locker, setLocker] = useState<Locker | null>(null);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("ALL");
  const [preset, setPreset] = useState<RangePreset>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const todayInput = toInputDate(new Date());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      window.location.href = "/login";
      return;
    }
    setIsAuthenticated(true);
  }, []);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    setRefreshing(true);
    try {
      const [parcelsRes, logsRes, lockerRes, returnsRes] = await Promise.all([
        fetch(API_BASE, { headers }),
        fetch(LOGS_API, { headers }),
        fetch(LOCKER_API, { headers }).catch(() => null),
        fetch(RETURNS_API, { headers }).catch(() => null),
      ]);

      if (!parcelsRes.ok) {
        const e = await parcelsRes.json().catch(() => ({}));
        throw new Error(e.error || "Failed to fetch parcels");
      }
      if (!logsRes.ok) {
        const e = await logsRes.json().catch(() => ({}));
        throw new Error(e.error || "Failed to fetch logs");
      }

      const parcelData = await parcelsRes.json();
      const logData = await logsRes.json();
      setParcels(Array.isArray(parcelData) ? parcelData : []);
      setLogs(Array.isArray(logData) ? logData : []);
      if (lockerRes && lockerRes.ok) setLocker(await lockerRes.json());
      // Returns are optional here: if the endpoint is missing, the log-based
      // return events still show up.
      if (returnsRes && returnsRes.ok) {
        const returnData = await returnsRes.json().catch(() => []);
        setReturns(Array.isArray(returnData) ? returnData : []);
      }
      setError("");
    } catch (err: unknown) {
      console.error("Error loading activity:", err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to load activity"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === true) fetchData();
  }, [isAuthenticated, fetchData]);

  /* ----- Build activity records (one record per event) ----- */

  const activities: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    const lockerCode = locker?.code;

    parcels.forEach((p) => {
      const name = p.parcelName && p.parcelName !== "Parcel" ? p.parcelName : "";
      const src = sourceLabel(p);
      const dims = p.dimensions
        ? `${p.dimensions.length} × ${p.dimensions.width} × ${p.dimensions.height} cm`
        : undefined;
      const secondary = [name, src].filter(Boolean).join(" · ") || undefined;

      const matchLogs = (actions: string[]) => {
        const c = logs.filter(
          (l) => actions.includes(l.action) && l.details?.includes(p.trackingNumber)
        );
        return c.find((l) => l.cameraRecording) || c[0];
      };

      const base = (): [string, string | undefined][] => [
        ["Transaction", "Delivery"],
        ["Tracking number", p.trackingNumber],
        ["Parcel", name || "Unnamed parcel"],
        ["Source", src],
        ["Dimensions", dims],
        ["Locker", lockerCode],
      ];

      const status = p.status?.toUpperCase();

      // Delivery event (also shown for parcels that were later retrieved)
      const deliveryLog = matchLogs(["DELIVERY_SUCCESS", "DELIVERY_VALID"]);
      if (status === "DELIVERED" || status === "RETRIEVED") {
        const ts = [toTs(p.deliveryDate), toTs(deliveryLog?.timestamp)].find(
          (t) => !isNaN(t)
        );
        const deliveryTs =
          ts ?? (status === "DELIVERED" ? toTs(p.createdAt) : NaN);
        if (!isNaN(deliveryTs)) {
          const url = p.videoUrl || deliveryLog?.cameraRecording;
          items.push({
            id: `${p._id}-delivered`,
            type: "DELIVERED",
            ts: deliveryTs,
            primary: p.trackingNumber,
            secondary,
            details: compact([
              ...base(),
              ["Delivered", formatFull(deliveryTs)],
              ["Handled by", deliveryLog?.actor ? prettify(deliveryLog.actor) : ""],
              ["Reference", shortRef(p._id)],
              ["Recording", url ? "Available" : "Not available"],
            ]),
            clip: url
              ? { url, title: `Delivery · ${p.trackingNumber}` }
              : undefined,
          });
        }
      }

      // Retrieval event
      if (status === "RETRIEVED") {
        const retrievalLog = matchLogs(["RETRIEVE"]);
        const ts = [toTs(p.retrievedDate), toTs(retrievalLog?.timestamp), toTs(p.updatedAt)].find(
          (t) => !isNaN(t)
        )!;
        const url = retrievalLog?.cameraRecording;
        items.push({
          id: `${p._id}-retrieved`,
          type: "RETRIEVED",
          ts,
          primary: p.trackingNumber,
          secondary,
          details: compact([
            ...base(),
            ["Retrieved", formatFull(ts)],
            ["Handled by", retrievalLog?.actor ? prettify(retrievalLog.actor) : ""],
            ["Reference", shortRef(p._id)],
            ["Recording", url ? "Available" : "Not available"],
          ]),
          clip: url
            ? { url, title: `Retrieval · ${p.trackingNumber}` }
            : undefined,
        });
      }

      // Pending (registered, not delivered yet)
      if (status !== "DELIVERED" && status !== "RETRIEVED") {
        const ts = toTs(p.createdAt);
        if (!isNaN(ts)) {
          items.push({
            id: `${p._id}-pending`,
            type: "PENDING",
            ts,
            primary: p.trackingNumber,
            secondary,
            details: compact([
              ...base(),
              ["Registered", formatFull(ts)],
              ["Reference", shortRef(p._id)],
            ]),
          });
        }
      }
    });

    // ---- Return transactions ----

    const returnLogItems = (l: Log) => {
      const list = l.returnInfo?.items?.length
        ? l.returnInfo.items
        : l.returnInfo?.itemDescription
        ? [l.returnInfo.itemDescription]
        : [];
      const count = l.returnInfo?.parcelCount || list.length || 1;
      return { list, count };
    };

    // 1) Return registered (from the returns records)
    const returnStatusText: Record<string, string> = {
      PENDING: "Pending",
      READY_FOR_PICKUP: "Ready for pickup",
      OTP_ACTIVE: "OTP active",
      PICKED_UP: "Picked up",
      EXPIRED: "OTP expired",
      CANCELLED: "Cancelled",
    };
    returns.forEach((r) => {
      const ts = toTs(r.createdAt);
      if (isNaN(ts)) return;
      const list = r.items?.length ? r.items : [r.itemDescription || "Parcel"];
      const count = r.parcelCount || list.length;
      const expired =
        r.status === "OTP_ACTIVE" && !!r.otpExpiry && new Date(r.otpExpiry).getTime() < Date.now();
      const statusText = expired ? "OTP expired" : returnStatusText[r.status] || r.status;
      items.push({
        id: `return-reg-${r._id}`,
        type: "RETURN_REGISTERED",
        ts,
        primary: list.length === 1 ? list[0] : `${count} parcels to return`,
        secondary: list.length > 1 ? list.join(", ") : "1 parcel",
        details: compact([
          ["Transaction", "Return"],
          ["Items", list.join(", ")],
          ["Parcels", String(count)],
          ["Registered", formatFull(ts)],
          ["Current status", statusText],
          [
            "OTP",
            r.status === "OTP_ACTIVE" && !expired && r.otpExpiry
              ? `Active until ${formatFull(toTs(r.otpExpiry))}`
              : "",
          ],
          ["Picked up", r.pickedUpDate ? formatFull(toTs(r.pickedUpDate)) : ""],
          ["Reference", shortRef(r._id)],
        ]),
        href: `/register?tab=returns&id=${r._id}`,
      });
    });

    // 2) Return dropped off, 3) return picked up (from locker logs)
    logs.forEach((l) => {
      const isDeposit = l.action === "RETURN_DEPOSITED";
      const isPickup = l.action === "RETURN_PICKUP_SUCCESS";
      if (!isDeposit && !isPickup) return;
      const ts = toTs(l.timestamp);
      if (isNaN(ts)) return;

      const { list, count } = returnLogItems(l);
      const url = l.cameraRecording;
      const label = isDeposit ? "Placed in locker" : "Picked up";

      items.push({
        id: `${isDeposit ? "return-dep" : "return"}-${l._id}`,
        type: isDeposit ? "RETURN_DEPOSIT" : "RETURN_PICKUP",
        ts,
        primary: list.length === 1 ? list[0] : `${count} returned ${count === 1 ? "parcel" : "parcels"}`,
        secondary: list.length > 1 ? list.join(", ") : `${count} ${count === 1 ? "parcel" : "parcels"}`,
        details: compact([
          ["Transaction", "Return"],
          ["Parcels returned", String(count)],
          ["Items", list.join(", ")],
          [label, formatFull(ts)],
          ["Locker", lockerCode],
          ["Handled by", l.actor ? prettify(l.actor) : ""],
          ["Outcome", l.success === false ? "Failed" : "Completed"],
          ["Reference", shortRef(l._id)],
          ["Recording", url ? "Available" : "Not available"],
        ]),
        clip: url
          ? { url, title: `Return ${label.toLowerCase()}${list.length === 1 ? ` · ${list[0]}` : ""}` }
          : undefined,
      });
    });

    return items.sort((a, b) => b.ts - a.ts);
  }, [parcels, logs, locker, returns]);

  const auditItems: AuditItem[] = useMemo(
    () =>
      logs
        .map((l) => {
          const event = formatLogEvent(l);
          const ts = toTs(l.timestamp);
          if (!event || isNaN(ts)) return null;
          const success = l.success !== false;
          return {
            id: l._id,
            ts,
            event,
            category: auditCategoryOf(l.action),
            security: SECURITY_ACTIONS.includes(l.action) || !success,
            success,
            locker: locker?.code,
          } as AuditItem;
        })
        .filter(Boolean)
        .sort((a, b) => b!.ts - a!.ts) as AuditItem[],
    [logs, locker]
  );

  /* ----- Filtering: date range + search first, then type ----- */

  const [rangeStart, rangeEnd] = rangeBounds(preset, from, to);
  const query = search.trim().toLowerCase();

  const inRange = useCallback(
    (ts: number) =>
      (rangeStart === null || ts >= rangeStart) &&
      (rangeEnd === null || ts <= rangeEnd),
    [rangeStart, rangeEnd]
  );

  const rangedActivities = useMemo(
    () =>
      activities.filter(
        (a) =>
          inRange(a.ts) &&
          (!query ||
            `${a.primary} ${a.secondary || ""} ${typeConfig[a.type].label}`
              .toLowerCase()
              .includes(query))
      ),
    [activities, inRange, query]
  );

  const activityCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: rangedActivities.length };
    rangedActivities.forEach((a) => {
      const key = isReturnType(a.type) ? "RETURNS" : a.type;
      c[key] = (c[key] || 0) + 1;
    });
    return c;
  }, [rangedActivities]);

  const filteredActivities = useMemo(
    () =>
      typeFilter === "ALL"
        ? rangedActivities
        : typeFilter === "RETURNS"
        ? rangedActivities.filter((a) => isReturnType(a.type))
        : rangedActivities.filter((a) => a.type === typeFilter),
    [rangedActivities, typeFilter]
  );

  const rangedAudit = useMemo(
    () =>
      auditItems.filter(
        (a) => inRange(a.ts) && (!query || a.event.toLowerCase().includes(query))
      ),
    [auditItems, inRange, query]
  );

  const auditCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: rangedAudit.length };
    rangedAudit.forEach((a) => {
      c[a.category] = (c[a.category] || 0) + 1;
      if (a.security) c.SECURITY = (c.SECURITY || 0) + 1;
    });
    return c;
  }, [rangedAudit]);

  const filteredAudit = useMemo(() => {
    if (auditFilter === "ALL") return rangedAudit;
    if (auditFilter === "SECURITY") return rangedAudit.filter((a) => a.security);
    return rangedAudit.filter((a) => a.category === auditFilter);
  }, [rangedAudit, auditFilter]);

  const activityGroups = useMemo(
    () => groupByDay(filteredActivities),
    [filteredActivities]
  );
  const auditGroups = useMemo(() => groupByDay(filteredAudit), [filteredAudit]);

  const hasActiveFilters =
    preset !== "ALL" ||
    query !== "" ||
    (viewMode === "MAIN_ACTIVITY" ? typeFilter !== "ALL" : auditFilter !== "ALL");

  const clearFilters = () => {
    setPreset("ALL");
    setFrom("");
    setTo("");
    setSearch("");
    setTypeFilter("ALL");
    setAuditFilter("ALL");
  };

  const closeClip = useCallback(() => setSelectedClip(null), []);

  const total =
    viewMode === "MAIN_ACTIVITY" ? activities.length : auditItems.length;
  const shown =
    viewMode === "MAIN_ACTIVITY" ? filteredActivities.length : filteredAudit.length;

  /* ----- Early states ----- */

  if (isAuthenticated === null) {
    return (
      <main className={`flex h-screen items-center justify-center ${pageBg}`}>
        <p className="animate-pulse text-xl font-extrabold text-white">
          Checking authentication…
        </p>
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
          aria-label="Loading activity"
          className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/30 border-t-white"
        />
      </main>
    );
  }

  /* ----- Render ----- */

  return (
    <main
      className={`flex min-h-screen flex-col p-4 md:p-6 lg:h-screen lg:overflow-hidden lg:p-8 ${pageBg}`}
    >
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out both; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in, .animate-slide-up { animation: none; }
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

            <nav className="hidden gap-8 font-semibold text-white lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={item.href === "/activity" ? "page" : undefined}
                  className={`group relative rounded py-1 ${focusRing}`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-0.5 bg-white transition-all duration-300 ${
                      item.href === "/activity"
                        ? "w-full"
                        : "w-0 group-hover:w-full group-focus-visible:w-full"
                    }`}
                  />
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
                  className="rounded-xl p-4 font-semibold text-[#b02a58] transition-colors hover:bg-pink-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* CONTENT */}
        <section
          className={`${glass} animate-fade-in z-0 flex flex-1 flex-col p-5 lg:min-h-0 lg:p-6`}
        >
          {error ? (
            <div role="alert" className="flex flex-1 items-center justify-center py-16">
              <div className={`${glassInner} p-8 text-center`}>
                <p className="mb-4 text-base font-semibold text-white">{error}</p>
                <button
                  onClick={fetchData}
                  className={`rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#8a1a42] shadow-md hover:bg-pink-50 ${focusRing}`}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4 lg:min-h-0">
              {/* Title + view switch */}
              <div className="flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">Activity</h1>
                  <p className="text-sm text-white/90">
                    Deliveries, pickups, returns and locker events in one place.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    role="tablist"
                    aria-label="Activity view"
                    className="flex flex-1 gap-1 rounded-full border border-white/20 bg-white/10 p-1 md:flex-none"
                  >
                    {(
                      [
                        ["MAIN_ACTIVITY", "Parcel activity"],
                        ["AUDIT_LOGS", "Audit logs"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        role="tab"
                        aria-selected={viewMode === key}
                        onClick={() => {
                          setViewMode(key);
                          setExpandedId(null);
                        }}
                        className={`flex-1 whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${focusRing} ${
                          viewMode === key
                            ? "bg-white text-[#8a1a42] shadow-md"
                            : "text-white hover:bg-white/15"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={fetchData}
                    disabled={refreshing}
                    aria-label="Refresh activity"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-60 ${focusRing}`}
                  >
                    <span className={refreshing ? "animate-spin" : ""}>
                      <Icon name="refresh" size={18} />
                    </span>
                  </button>
                </div>
              </div>

              {viewMode === "AUDIT_LOGS" && locker?.lockout && (
                <div
                  role="alert"
                  className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/40 bg-[#5c0f2e] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Icon name="alert" size={18} />
                  Locker lockout is active after repeated wrong PIN attempts.
                </div>
              )}

              {/* FILTERS — above the records */}
              <div className={`${glassInner} shrink-0 space-y-3 p-3 sm:p-4`}>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label={viewMode === "MAIN_ACTIVITY" ? "Filter by activity type" : "Filter by log category"}
                  >
                    {viewMode === "MAIN_ACTIVITY"
                      ? typeFilters.map((f) => (
                          <FilterChip
                            key={f.key}
                            active={typeFilter === f.key}
                            onClick={() => setTypeFilter(f.key)}
                            dot={
                              f.key === "ALL"
                                ? undefined
                                : f.key === "RETURNS"
                                ? typeConfig.RETURN_PICKUP.accent
                                : typeConfig[f.key as ActivityType].accent
                            }
                            count={activityCounts[f.key] || 0}
                          >
                            {f.label}
                          </FilterChip>
                        ))
                      : auditFilters.map((f) => (
                          <FilterChip
                            key={f.key}
                            active={auditFilter === f.key}
                            onClick={() => setAuditFilter(f.key)}
                            count={auditCounts[f.key] || 0}
                          >
                            {f.label}
                          </FilterChip>
                        ))}
                  </div>

                  <div className="relative w-full xl:max-w-xs">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/80">
                      <Icon name="search" size={16} />
                    </span>
                    <input
                      type="search"
                      aria-label="Search activity"
                      placeholder={
                        viewMode === "MAIN_ACTIVITY"
                          ? "Search tracking number or parcel"
                          : "Search events"
                      }
                      className={`${inputClass} w-full pl-10`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/20 pt-3 lg:flex-row lg:items-center">
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Icon name="calendar" size={16} />
                    Date range
                  </p>

                  <div className="flex flex-wrap gap-2" role="group" aria-label="Date range presets">
                    {rangePresets.map((r) => (
                      <FilterChip
                        key={r.key}
                        active={preset === r.key}
                        onClick={() => setPreset(r.key)}
                      >
                        {r.label}
                      </FilterChip>
                    ))}
                  </div>

                  {preset === "CUSTOM" && (
                    <div className="animate-fade-in flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-white">
                        From
                        <input
                          type="date"
                          className={inputClass}
                          value={from}
                          max={to || todayInput}
                          onChange={(e) => setFrom(e.target.value)}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-white">
                        To
                        <input
                          type="date"
                          className={inputClass}
                          value={to}
                          min={from || undefined}
                          max={todayInput}
                          onChange={(e) => setTo(e.target.value)}
                        />
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-3 lg:ml-auto">
                    <p className="text-sm font-medium text-white/90" aria-live="polite">
                      Showing {shown} of {total}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className={`rounded-full px-2 py-1 text-sm font-semibold text-white underline underline-offset-4 hover:text-pink-50 ${focusRing}`}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* RECORDS */}
              <div
                className={`max-h-[34rem] flex-1 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 ${scrollbarClass}`}
              >
                {viewMode === "MAIN_ACTIVITY" ? (
                  activityGroups.length > 0 ? (
                    <div className="space-y-2">
                      {activityGroups.map((group) => (
                        <div key={group.key}>
                          <DayHeader label={group.label} count={group.items.length} />
                          <ul className="mt-1 space-y-2.5">
                            {group.items.map((item, i) => {
                              const cfg = typeConfig[item.type];
                              const open = expandedId === item.id;
                              return (
                                <li
                                  key={item.id}
                                  style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                                  className="animate-slide-up"
                                >
                                  <div
                                    className={`${glassInner} relative overflow-hidden transition-colors hover:bg-white/25`}
                                  >
                                    <span
                                      className="absolute inset-y-0 left-0 w-1.5"
                                      style={{ backgroundColor: cfg.accent }}
                                      aria-hidden
                                    />
                                    <div className="flex items-center gap-3 p-3 pl-5">
                                      <span
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6b0f33]/55"
                                        style={{ color: cfg.accent }}
                                      >
                                        <Icon name={cfg.icon} />
                                      </span>

                                      <div className="min-w-0 flex-1">
                                        <div className="mb-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                          <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.chip}`}
                                          >
                                            {cfg.label}
                                          </span>
                                          <span className="text-xs font-medium text-white/90">
                                            {formatTime(item.ts)}
                                          </span>
                                        </div>
                                        <p className="truncate text-base font-bold text-white">
                                          {item.primary}
                                        </p>
                                        <p className="truncate text-sm text-white/90">
                                          {item.secondary || cfg.hint}
                                        </p>
                                      </div>

                                      <div className="flex shrink-0 items-center gap-2">
                                        {item.clip && (
                                          <button
                                            type="button"
                                            onClick={() => setSelectedClip(item.clip!)}
                                            aria-label={`Watch recording: ${item.clip.title}`}
                                            className={`flex h-10 items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[#8a1a42] ${focusRing}`}
                                          >
                                            <Icon name="video" size={16} />
                                            <span className="hidden sm:inline">Clip</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => setExpandedId(open ? null : item.id)}
                                          aria-expanded={open}
                                          aria-label={open ? "Hide details" : "Show details"}
                                          className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white transition hover:bg-white/25 ${focusRing}`}
                                        >
                                          <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
                                            <Icon name="chevron" size={18} />
                                          </span>
                                        </button>
                                      </div>
                                    </div>

                                    {open && (
                                      <dl className="animate-fade-in grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/20 bg-[#6b0f33]/25 p-4 pl-5 sm:grid-cols-3">
                                        {item.details.map(([label, value]) => (
                                          <div key={label} className="min-w-0">
                                            <dt className="text-xs font-semibold text-white/80">
                                              {label}
                                            </dt>
                                            <dd className="break-words text-sm font-semibold text-white">
                                              {value}
                                            </dd>
                                          </div>
                                        ))}
                                        {item.href && (
                                          <div className="col-span-2 sm:col-span-3">
                                            <Link
                                              href={item.href}
                                              className={`inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white hover:text-[#8a1a42] ${focusRing}`}
                                            >
                                              Open in Parcels
                                              <Icon name="chevron" size={14} />
                                            </Link>
                                          </div>
                                        )}
                                      </dl>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title={activities.length === 0 ? "No activity yet" : "No records match these filters"}
                      body={
                        activities.length === 0
                          ? "Deliveries, pickups and returns will appear here."
                          : "Try a wider date range or a different type."
                      }
                      onClear={activities.length > 0 && hasActiveFilters ? clearFilters : undefined}
                    />
                  )
                ) : auditGroups.length > 0 ? (
                  <div className="space-y-2">
                    {auditGroups.map((group) => (
                      <div key={group.key}>
                        <DayHeader label={group.label} count={group.items.length} />
                        <ul className="mt-1 space-y-2">
                          {group.items.map((log, i) => (
                            <li
                              key={log.id}
                              style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                              className={`${glassInner} animate-slide-up flex items-center gap-3 p-3 transition-colors hover:bg-white/25`}
                            >
                              <span
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b0f33]/55 ${
                                  log.security ? "text-[#ffc46b]" : "text-white"
                                }`}
                              >
                                <Icon name={log.security ? "alert" : auditCategoryIcon[log.category]} size={18} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white">
                                  {log.event}
                                </p>
                                <p className="truncate text-xs text-white/90">
                                  {formatTime(log.ts)}
                                  {" · "}
                                  {log.category === "PIN" ? "PIN" : log.category === "LOCK" ? "Lock" : "Parcel"}
                                  {log.locker ? ` · Locker ${log.locker}` : ""}
                                </p>
                              </div>
                              {log.success ? (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#7ee0b5] px-2.5 py-0.5 text-xs font-bold text-[#0b4a31]">
                                  <Icon name="check" size={12} />
                                  Success
                                </span>
                              ) : (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/40 bg-[#5c0f2e] px-2.5 py-0.5 text-xs font-bold text-white">
                                  <Icon name="alert" size={12} />
                                  Failed
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={auditItems.length === 0 ? "No audit logs yet" : "No logs match these filters"}
                    body={
                      auditItems.length === 0
                        ? "Locker events will appear here as they happen."
                        : "Try a wider date range or a different category."
                    }
                    onClear={auditItems.length > 0 && hasActiveFilters ? clearFilters : undefined}
                  />
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedClip && <ClipModal clip={selectedClip} onClose={closeClip} />}
    </main>
  );
}

function EmptyState({
  title,
  body,
  onClear,
}: {
  title: string;
  body: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-white/90">{body}</p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className={`mt-4 rounded-full bg-white px-5 py-2 text-sm font-bold text-[#8a1a42] shadow-md hover:bg-pink-50 ${focusRing}`}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}