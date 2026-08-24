"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

type ParcelStatus =
  | "PENDING"
  | "DELIVERED"
  | "RETRIEVED"
  | "RETURN_PICKUP";
type ViewMode = "MAIN_ACTIVITY" | "AUDIT_LOGS";
type FilterStatus = "ALL" | ParcelStatus;

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

interface ActivityItem {
  id: string;
  logId?: string;
  trackingNumber: string;
  status: ParcelStatus;
  date: string;
  time: string;
  hasDeliveryClip: boolean;
  deliveryClipUrl?: string;
  hasRetrievalClip: boolean;
  retrievalClipUrl?: string;
  parcelName?: string;
}

interface AuditLogItem {
  id: string;
  date: string;
  time: string;
  event: string;
}

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "RETURNS", href: "/returns" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

const API_BASE = "/api/parcels";
const LOGS_API = "/api/logs";
const LOCKER_API = "/api/locker";

const statusStyles: Record<
  ParcelStatus,
  { label: string; pill: string }
> = {
  PENDING: {
    label: "Pending",
    pill: "bg-[#edd9cb] text-[#d46800]",
  },
  DELIVERED: {
    label: "Delivered",
    pill: "bg-[#b8d8c7] text-[#0d7a43]",
  },
  RETRIEVED: {
    label: "Retrieved",
    pill: "bg-[#cfe8ec] text-[#1383a3]",
  },
  RETURN_PICKUP: {
    label: "Return Picked Up",
    pill: "bg-[#ead7f5] text-[#7b3fa0]",
  },
};

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full";

export default function ActivityPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("MAIN_ACTIVITY");
  const [auditFilter, setAuditFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [locker, setLocker] = useState<Locker | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedClip, setSelectedClip] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        window.location.href = "/login";
        return;
      }
      setIsAuthenticated(true);
    }
  }, []);

  const fetchParcels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch parcels");
      }

      const data = await res.json();
      setParcels(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: unknown) {
      console.error("Error fetching parcels:", err);
      setError(err instanceof Error ? err.message || "Failed to load parcels" : "Failed to load parcels");
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(LOGS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch logs");
      }

      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: unknown) {
      console.error("Error fetching logs:", err);
      if (err instanceof Error) setError(err.message || "Failed to load logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleDeleteActivity = async (
  logId: string
) => {
  const confirmed = window.confirm(
    "Delete this return activity and its video clip?"
  );

  if (!confirmed) return;

  try {
    const token =
      localStorage.getItem("token");

    if (!token) return;

    const res = await fetch(LOGS_API, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: logId,
      }),
    });

    if (!res.ok) {
      const data =
        await res.json().catch(() => ({}));

      throw new Error(
        data.error ||
        "Failed to delete activity"
      );
    }

    await fetchLogs();

  } catch (err) {
    console.error(
      "Delete activity error:",
      err
    );

    alert("Failed to delete activity");
  }
};

  const fetchLocker = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(LOCKER_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setLocker(await res.json());
    } catch (err) {
      console.error("Error fetching locker:", err);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchParcels(), fetchLogs()]);
  };

  useEffect(() => {
    if (isAuthenticated === true) fetchData();
  }, [isAuthenticated]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === "AUDIT_LOGS") {
      fetchLogs();
      fetchLocker();
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

 const activities: ActivityItem[] = useMemo(() => {
  const parcelActivities: ActivityItem[] = parcels.map((parcel) => {
      let activityDate = parcel.createdAt;
      const status: ParcelStatus =
        parcel.status === "DELIVERED"
          ? "DELIVERED"
          : parcel.status === "RETRIEVED"
          ? "RETRIEVED"
          : "PENDING";

      if (status === "DELIVERED" && parcel.deliveryDate) activityDate = parcel.deliveryDate;
      else if (status === "RETRIEVED" && parcel.retrievedDate) activityDate = parcel.retrievedDate;

      const deliveryLog = logs.find(
        (log) =>
          (log.action === "DELIVERY_SUCCESS" ||
            log.action === "DELIVERY_VALID") &&
          log.details?.includes(parcel.trackingNumber) &&
          log.cameraRecording
      );

      const deliveryClipUrl =
        parcel.videoUrl ||
        deliveryLog?.cameraRecording;

      const retrievalLog =
        parcel.status === "RETRIEVED"
          ? logs.find(
              (log) =>
                log.action === "RETRIEVE" &&
                log.details?.includes(
                  parcel.trackingNumber
                ) &&
                log.cameraRecording
            )
          : undefined;

      return {
        id: parcel._id,
        trackingNumber: parcel.trackingNumber,
        status,
        date: formatDate(activityDate),
        time: formatTime(activityDate),
        hasDeliveryClip: !!deliveryClipUrl,
        deliveryClipUrl,

        hasRetrievalClip: !!retrievalLog,
        retrievalClipUrl: retrievalLog?.cameraRecording,
        parcelName: parcel.parcelName !== "Parcel" ? parcel.parcelName : undefined,
      };
      });

  const returnPickupActivities: ActivityItem[] = logs
  .filter(
    (log) =>
      log.action === "RETURN_PICKUP_SUCCESS"
  )
  .map((log) => {
    const returnItems =
      log.returnInfo?.items &&
      log.returnInfo.items.length > 0
        ? log.returnInfo.items
        : log.returnInfo?.itemDescription
        ? [log.returnInfo.itemDescription]
        : [];

    const parcelCount =
      log.returnInfo?.parcelCount ||
      returnItems.length ||
      1;

    return {
      id: `return-${log._id}`,
      logId: log._id,

      trackingNumber:
        returnItems.length > 0
          ? returnItems.join(", ")
          : "Return Pickup",

      status: "RETURN_PICKUP" as ParcelStatus,

      date: formatDate(log.timestamp),
      time: formatTime(log.timestamp),

      hasDeliveryClip: false,
      deliveryClipUrl: undefined,

      hasRetrievalClip: !!log.cameraRecording,
      retrievalClipUrl: log.cameraRecording,

      parcelName:
        `${parcelCount} ${
          parcelCount === 1
            ? "Returned Parcel"
            : "Returned Parcels"
        }`,
    };
  });

  return [...parcelActivities, ...returnPickupActivities];
}, [parcels, logs]);

  const filteredActivities = useMemo(() => {
    if (activeFilter === "ALL") return activities;
    return activities.filter((a) => a.status === activeFilter);
  }, [activeFilter, activities]);

  const formatLogEvent = (log: Log) => {
    switch (log.action) {
      case "PIN_VALID": return "Valid PIN Entered";
      case "INVALID_CODE": return "Invalid PIN Attempt";
      case "PIN_LOCKOUT": return "Lockout Activated";
      case "PIN_RESET": return "Lockout Reset";
      case "LOCK_OPEN": return "Locker Opened";
      case "LOCK_CLOSED": return "Locker Closed";
      case "DELIVERY_VALID":
      case "DELIVERY_SUCCESS":
        return "Parcel Delivered";
      case "RETRIEVE": return "Parcel Retrieved";
      case "LID_OPEN_TOO_LONG": return "Locker Left Open";
      default: return null;
    }
  };

  const formattedAuditLogs: AuditLogItem[] = useMemo(() => {
    return logs
      .map((log) => {
        const event = formatLogEvent(log);
        if (!event) return null;
        return {
          id: log._id,
          date: formatDate(log.timestamp),
          time: formatTime(log.timestamp),
          event,
        };
      })
      .filter(Boolean) as AuditLogItem[];
  }, [logs]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedClip(null);
    };
    if (selectedClip) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [selectedClip]);

  if (isAuthenticated === null) {
    return (
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] flex items-center justify-center">
        <div className="text-white text-xl font-extrabold animate-pulse">Checking authentication...</div>
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
          <div className="text-white/90 text-lg md:text-xl font-semibold">Redirecting to login...</div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1]">
        <div className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/30 border-t-white" />
      </main>
    );
  }

  const filteredAuditLogs = formattedAuditLogs.filter((log) => {
    if (auditFilter === "ALL") return true;
    if (auditFilter === "PIN") return log.event.toLowerCase().includes("pin");
    if (auditFilter === "LOCK") return log.event.toLowerCase().includes("lock");
    if (auditFilter === "PARCEL") return log.event.toLowerCase().includes("parcel");
    if (auditFilter === "SECURITY") {
      return log.event.toLowerCase().includes("failed") || log.event.toLowerCase().includes("lockout");
    }
    return true;
  });

  return (
    <main className="min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] p-4 md:p-6 lg:p-8 flex flex-col">
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="mx-auto flex h-full w-full flex-col gap-4 flex-1 animate-fade-in">
        {/* HEADER */}
        <header className="relative z-[100] shrink-0 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-xl border border-white/30 shadow-lg transition-all duration-300 hover:bg-white/15">
          <div className="flex items-center justify-between">
            <Link href="/home" className="transition-transform duration-300 hover:scale-105 active:scale-95">
              <Image
                src="/padalock-logo.png"
                alt="Logo"
                width={200}
                height={50}
                className="w-28 md:w-40"
                priority
              />
            </Link>

            <nav className="hidden lg:flex gap-8 text-white font-bold">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative group transition-all duration-300 ${
                    item.href === "/activity" ? "text-white" : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all duration-300 ${
                      item.href === "/activity" ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              ))}
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden relative z-[110] p-2 focus:outline-none"
              aria-label="Toggle Menu"
            >
              <div className="flex flex-col justify-between w-6 h-4 transform transition-all duration-300">
                <span className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 origin-left ${isMenuOpen ? "rotate-45" : ""}`} />
                <span className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`} />
                <span className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 origin-left ${isMenuOpen ? "-rotate-45" : ""}`} />
              </div>
            </button>
          </div>

          <div
            className={`absolute left-0 right-0 top-full mt-3 px-2 transition-all duration-300 ease-out lg:hidden ${
              isMenuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
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

        {/* CONTENT */}
        <section className="relative z-0 flex flex-col flex-1 min-h-0 rounded-[2.5rem] bg-black/5 backdrop-blur-md border border-white/20 p-6 shadow-inner transition-all duration-500 overflow-hidden">
          {error ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-3xl bg-white/15 border border-white/20 p-8 text-center shadow-inner">
                <p className="text-lg font-bold text-white mb-4">{error}</p>
                <button
                  onClick={fetchData}
                  className="rounded-3xl bg-[#df4473] px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
                <div>
                  <h1 className="text-xs font-black uppercase tracking-[0.3em] text-white/80 md:text-sm">Activity</h1>
                  {viewMode === "AUDIT_LOGS" && locker?.lockout && (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-500/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white animate-pulse">
                      ⚠️ Locker Brute-Force Lockout Active
                    </span>
                  )}
                </div>

                <div className="flex w-full gap-1 rounded-2xl bg-white/10 p-1 border border-white/10 md:w-auto md:min-w-[360px]">
                  <button
                    onClick={() => handleViewModeChange("MAIN_ACTIVITY")}
                    className={`flex-1 rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                      viewMode === "MAIN_ACTIVITY" ? "bg-white/15 text-white shadow-md scale-105": "text-white hover:bg-white/10"
                    }`}
                  >
                    Main Activity
                  </button>
                  <button
                    onClick={() => handleViewModeChange("AUDIT_LOGS")}
                    className={`flex-1 rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                      viewMode === "AUDIT_LOGS" ? "bg-white/15 text-white shadow-md scale-105" : "text-white hover:bg-white/10"
                    }`}
                  >
                    Audit Logs
                  </button>
                </div>
              </div>

              {viewMode === "MAIN_ACTIVITY" ? (
                <div key="main-view" className="flex-1 min-h-0 flex flex-col">
                  <div className="mb-5 shrink-0">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-1 rounded-2xl bg-white/10 p-1 border border-white/10">
                      {[
                        { label: "ALL", value: "ALL" },
                        { label: "PENDING", value: "PENDING" },
                        { label: "DELIVERED", value: "DELIVERED" },
                        { label: "RETRIEVED", value: "RETRIEVED" },
                        { label: "RETURNS", value: "RETURN_PICKUP" },
                      ].map((filter) => {
                        const isActive = activeFilter === filter.value;
                        return (
                          <button
                            key={filter.value}
                            onClick={() => setActiveFilter(filter.value as FilterStatus)}
                            className={`rounded-xl py-2 text-[10px] font-bold transition-all duration-300 text-center ${
                              isActive
                                ? "bg-white/15 text-white shadow-md scale-105"
                                : "text-white hover:bg-white/10"
                            }`}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`flex-1 min-h-0 overflow-y-auto pr-1 ${scrollbarClass}`}>
                    <div className="flex flex-col gap-3">
                      {filteredActivities.map((item, index) => (
                        <div
                          key={item.id}
                          style={{ animationDelay: `${index * 50}ms` }}
                          className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl bg-white/15 p-5 border border-white/10 hover:bg-white/25 hover:scale-[1.01] transition-all duration-300 animate-slide-up"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)] ${
                                  item.status === "RETRIEVED"
                                    ? "bg-cyan-400"
                                    : item.status === "DELIVERED"
                                    ? "bg-green-400"
                                    : "bg-orange-400"
                                }`}
                              />
                              <h3 className="text-lg font-bold text-white break-all">{item.trackingNumber}</h3>
                            </div>

                            <p className="text-xs text-white/60 font-medium uppercase tracking-wider">
                              {item.parcelName || "General Parcel"} • {item.date} at {item.time}
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span
                              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${statusStyles[item.status].pill}`}
                            >
                              {statusStyles[item.status].label}
                            </span>

                            <div className="flex items-center gap-2">
                              {item.hasDeliveryClip && item.deliveryClipUrl && (
                                <button
                                  onClick={() => setSelectedClip(item.deliveryClipUrl!)}
                                  className="bg-white/10 hover:bg-white text-white hover:text-[#df4473] px-3 py-2 rounded-xl transition-all duration-300 active:scale-90"
                                  title="View Delivery Recording"
                                >
                                  📦📹
                                </button>
                              )}

                              {item.hasRetrievalClip && item.retrievalClipUrl && (
                                <button
                                  onClick={() => setSelectedClip(item.retrievalClipUrl!)}
                                  className="bg-white/10 hover:bg-white text-white hover:text-[#df4473] px-3 py-2 rounded-xl transition-all duration-300 active:scale-90"
                                  title={
                                    item.status === "RETURN_PICKUP"
                                      ? "View Return Pickup Recording"
                                      : "View Retrieval Recording"
                                  }
                                >
                                  {item.status === "RETURN_PICKUP" ? "↩️📹" : "🔓📹"}
                                </button>
                              )}
                              {item.status === "RETURN_PICKUP" && item.logId && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteActivity(item.logId!)}
                                  className="bg-white/10 hover:bg-red-500/80 text-white px-3 py-2 rounded-xl transition-all duration-300 active:scale-90"
                                  title="Delete Return Activity"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {filteredActivities.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-white/20">
                          <p className="text-sm font-bold uppercase tracking-widest">No parcels found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div key="audit-view" className="flex-1 min-h-0 flex flex-col">
                  <div className="mb-4 shrink-0">
                  <div className="grid grid-cols-5 gap-1 rounded-2xl bg-white/10 p-1 border border-white/10">
                      {["ALL", "PIN", "LOCK", "PARCEL", "SECURITY"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setAuditFilter(filter)}
                          className={`rounded-xl py-2 text-[10px] font-bold transition-all duration-300 ${
                            auditFilter === filter
                              ? "bg-white/15 text-white shadow-md scale-105"
                              : "text-white hover:bg-white/10"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-[1.1fr_0.75fr_2fr] gap-3 rounded-2xl bg-white/10 border border-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    <p>Date</p>
                    <p>Time</p>
                    <p>Event</p>
                  </div>

                  <div className={`flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 ${scrollbarClass}`}>
                    {logsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 text-white/70">
                        <div className="animate-spin h-8 w-8 border-2 border-white/30 border-t-white rounded-full" />
                        <span className="mt-3 text-sm font-medium">Syncing telemetry logs...</span>
                      </div>
                    ) : filteredAuditLogs.length === 0 ? (
                      <div className="flex min-h-[200px] items-center justify-center rounded-3xl bg-white/15 border border-white/10">
                        <p className="text-center text-sm font-bold uppercase tracking-widest text-white/30">
                          No audit logs available yet
                        </p>
                      </div>
                    ) : (
                      filteredAuditLogs.map((log, index) => (
                        <div
                          key={log.id}
                          style={{ animationDelay: `${index * 50}ms` }}
                          className="group grid grid-cols-[1.1fr_0.75fr_2fr] gap-3 rounded-3xl bg-white/15 p-5 border border-white/10 text-white hover:bg-white/25 transition-all duration-300 animate-slide-up"
                        >
                          <p className="text-sm font-medium text-white/80">{log.date}</p>
                          <p className="text-sm font-medium text-white/80">{log.time}</p>
                          <p className="text-sm font-semibold truncate">{log.event}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {selectedClip && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-fade-in"
            onClick={() => setSelectedClip(null)}
          >
            <div
              className="relative w-full max-w-3xl aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/30 shadow-2xl animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 shadow-xl"
                onClick={() => setSelectedClip(null)}
                aria-label="Close video"
              >
                ×
              </button>
              <video src={selectedClip} autoPlay controls className="w-full h-full object-contain" />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}