"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

type ParcelStatus = "PENDING" | "DELIVERED" | "RETRIEVED";
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
  trackingNumber: string;
  status: ParcelStatus;
  date: string;
  time: string;
  hasClip: boolean;
  clipUrl?: string;
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
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

const API_BASE = "/api/parcels";
const LOGS_API = "/api/logs";
const LOCKER_API = "/api/locker";

const statusStyles: Record<ParcelStatus, { label: string; pill: string }> = {
  PENDING: { label: "Pending", pill: "bg-[#f3dfd0] text-[#d46a1a]" },
  DELIVERED: { label: "Delivered", pill: "bg-[#b9d7c5] text-[#0b6d3b]" },
  RETRIEVED: { label: "Retrieved", pill: "bg-[#c5dde3] text-[#0d7d97]" },
};

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-[#f2d9e2] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d985a1] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#cf6c91]";

export default function ActivityPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
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
      if (err instanceof Error) {
        setError(err.message || "Failed to load parcels");
      } else {
        setError("Failed to load parcels");
      }
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
      
      const res = await fetch(LOGS_API, { headers: { Authorization: `Bearer ${token}` } });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch logs");
      }

      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: unknown) {
      console.error("Error fetching logs:", err);
      if (err instanceof Error) {
        setError(err.message || "Failed to load logs");
      }
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchLocker = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(LOCKER_API, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setLocker(data);
      }
    } catch (err) {
      console.error("Error fetching locker:", err);
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchParcels(), fetchLogs()]);
  };

  useEffect(() => {
    if (isAuthenticated === true) {
      fetchData();
    }
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
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const activities: ActivityItem[] = useMemo(() => {
    return parcels.map((parcel) => {
      let activityDate = parcel.createdAt;
      const status: ParcelStatus = parcel.status as ParcelStatus;
      if (status === "DELIVERED" && parcel.deliveryDate) activityDate = parcel.deliveryDate;
      else if (status === "RETRIEVED" && parcel.retrievedDate) activityDate = parcel.retrievedDate;

      const relatedLog = logs.find((log) => log.details?.includes(parcel.trackingNumber) && log.cameraRecording);
      return {
        id: parcel._id,
        trackingNumber: parcel.trackingNumber,
        status,
        date: formatDate(activityDate),
        time: formatTime(activityDate),
        hasClip: !!relatedLog,
        clipUrl: relatedLog?.cameraRecording,
        parcelName: parcel.parcelName !== "Parcel" ? parcel.parcelName : undefined,
      };
    });
  }, [parcels, logs]);

  const filteredActivities = useMemo(() => {
    if (activeFilter === "ALL") return activities;
    return activities.filter((a) => a.status === activeFilter);
  }, [activeFilter, activities]);

  const formatLogEvent = (log: Log) => {
    switch (log.action) {
      case "PIN_VALID":
        return "Valid PIN Entered";
      case "INVALID_CODE":
        return "Invalid PIN Attempt";
      case "PIN_LOCKOUT":
        return "Lockout Activated";
      case "PIN_RESET":
        return "Lockout Reset";
      case "LOCK_OPEN":
        return "Locker Opened";
      case "LOCK_CLOSED":
        return "Locker Closed";
      case "DELIVERY_VALID":
        return "Parcel Delivered";
      case "RETRIEVE":
        return "Parcel Retrieved";
      case "LID_OPEN_TOO_LONG":
        return "Locker Left Open";
      default:
        return null;
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
          <div className="text-white/90 text-lg md:text-xl font-semibold">
            Redirecting to login...
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] flex items-center justify-center">
        <div className="text-white text-xl font-extrabold animate-pulse">Loading activity...</div>
      </main>
    );
  }

  const filteredAuditLogs = formattedAuditLogs.filter((log) => {
    if (auditFilter === "ALL") return true; 
    if (auditFilter === "PIN") return log.event.toLowerCase().includes("pin");
    if (auditFilter === "LOCK") return log.event.toLowerCase().includes("lock");
    if (auditFilter === "PARCEL") return log.event.toLowerCase().includes("parcel");
    if (auditFilter === "SECURITY") {
      return (
        log.event.toLowerCase().includes("failed") ||
        log.event.toLowerCase().includes("lockout")
      );
    }
    return true;
  });

  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      
      {/* Global Transition Architecture — Injected outside of HTML nodes to prevent DOM modification */}
      <style jsx global>{`
        @keyframes pageFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes itemEntrance {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        main {
          animation: pageFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-list-item {
          animation: itemEntrance 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .modal-backdrop-animate {
          animation: modalOverlay 0.25s ease-out forwards;
        }
        .modal-panel-animate {
          animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        header a, header nav a, button {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        header a:hover, button:hover {
          transform: translateY(-1px);
          filter: brightness(1.03);
        }
        header a:active, button:active {
          transform: translateY(0px) scale(0.98);
        }
      `}</style>

      <div className="mx-auto flex h-full w-full flex-col gap-4">
        
        {/* HEADER */}
        <header className="shrink-0 rounded-[1.5rem] bg-[#FFFFFF]/25 px-4 py-3 backdrop-blur-sm md:px-6 md:py-3 lg:px-8 lg:py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/home" className="flex items-center">
              <Image
                src="/padalock-logo.png"
                alt="PadaLock logo"
                width={340}
                height={70}
                className="h-auto w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px]"
                priority
              />
            </Link>
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-white sm:text-sm md:text-base lg:justify-end lg:gap-x-6 lg:text-lg">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${
                    item.label === "ACTIVITY" ? "font-extrabold" : "opacity-80"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* CONTENT CONTAINER */}
        <section className="min-h-0 flex-1 overflow-hidden rounded-[2rem] bg-white/25 p-4 backdrop-blur-sm sm:p-5 md:p-6">
          {error ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-full bg-red-100/80 p-6 text-center text-red-800 shadow-md">
                <p className="text-lg font-semibold mb-2">{error}</p>
                <button
                  onClick={fetchData}
                  className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-2.5 text-sm font-extrabold text-white"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-white md:text-3xl">Activity</h1>
                  {viewMode === "AUDIT_LOGS" && locker?.lockout && (
                    <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold text-white uppercase animate-pulse">
                      ⚠️ Locker Brute-Force Lockout Active
                    </span>
                  )}
                </div>

                <div className="flex w-full gap-3 md:w-auto md:min-w-[420px] bg-black/5 p-1 rounded-full">
                  <button
                    onClick={() => handleViewModeChange("MAIN_ACTIVITY")}
                    className={`flex-1 rounded-full px-6 py-2.5 text-sm font-bold ${
                      viewMode === "MAIN_ACTIVITY" ? "bg-white text-[#de517e]" : "bg-transparent text-white"
                    }`}
                  >
                    Main Activity
                  </button>
                  <button
                    onClick={() => handleViewModeChange("AUDIT_LOGS")}
                    className={`flex-1 rounded-full px-6 py-2.5 text-sm font-bold ${
                      viewMode === "AUDIT_LOGS" ? "bg-white text-[#de517e]" : "bg-transparent text-white"
                    }`}
                  >
                    Audit Logs
                  </button>
                </div>
              </div>

              {viewMode === "MAIN_ACTIVITY" ? (
                <div key="main-view" className="flex-1 min-h-0 flex flex-col">
                  <div className="mb-5 rounded-[1.75rem] bg-white/35 p-2 shrink-0">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {[
                        { label: "All", value: "ALL" },
                        { label: "Pending", value: "PENDING" },
                        { label: "Delivered", value: "DELIVERED" },
                        { label: "Retrieved", value: "RETRIEVED" },
                      ].map((filter) => {
                        const isActive = activeFilter === filter.value;
                        return (
                          <button
                            key={filter.value}
                            onClick={() => setActiveFilter(filter.value as FilterStatus)}
                            className={`rounded-full px-4 py-3 text-sm font-extrabold ${
                              isActive ? "bg-[#dd96ad] text-white" : "text-[#df8daa]"
                            }`}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`flex-1 min-h-0 overflow-y-auto pr-1 ${scrollbarClass}`}>
                    <div className="flex flex-col gap-4">
                      {filteredActivities.map((item, index) => (
                        <div
                          key={item.id}
                          style={{ animationDelay: `${index * 30}ms` }}
                          className="animate-list-item opacity-0 flex flex-col gap-4 rounded-[1.75rem] bg-white/45 px-5 py-5 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-xl font-extrabold text-[#df8daa] md:text-2xl">
                              {item.trackingNumber}
                            </h2>
                            {item.parcelName && (
                              <p className="truncate text-base font-semibold text-[#df8daa] opacity-90">
                                {item.parcelName}
                              </p>
                            )}
                            <p className="text-sm text-[#df8daa]/80 md:text-base">
                              {item.date} | {item.time}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                            {item.hasClip && item.clipUrl && (
                              <button
                                onClick={() => setSelectedClip(item.clipUrl!)}
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#df8daa] text-white"
                                title="View Security Recording"
                              >
                                📹
                              </button>
                            )}
                            <span
                              className={`inline-flex min-w-[140px] items-center justify-center rounded-full px-5 py-3 text-base font-extrabold md:min-w-[160px] ${
                                statusStyles[item.status].pill
                              }`}
                            >
                              {statusStyles[item.status].label}
                            </span>
                          </div>
                        </div>
                      ))}

                      {filteredActivities.length === 0 && (
                        <div className="flex min-h-[220px] items-center justify-center rounded-[1.75rem] bg-white/35 px-6 py-8">
                          <p className="text-center text-base font-medium text-[#df8daa] md:text-lg">
                            No registered parcels found.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div key="audit-view" className="flex-1 min-h-0 flex flex-col rounded-[2rem] bg-white/20 p-3">
                  <div className="mb-3 rounded-[1.5rem] bg-white/35 p-2">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                      {["ALL", "PIN", "LOCK", "PARCEL", "SECURITY"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setAuditFilter(filter)}
                          className={`rounded-full px-4 py-2 text-sm font-extrabold ${
                            auditFilter === filter ? "bg-[#dd96ad] text-white" : "text-[#df8daa]"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-3 grid grid-cols-[1.1fr_0.75fr_2fr] gap-3 rounded-[1.5rem] bg-white/35 px-5 py-4 text-sm font-extrabold uppercase tracking-wide text-[#de517e] md:px-6 md:text-base">
                    <p>Date</p>
                    <p>Time</p>
                    <p>Event</p>
                  </div>

                  <div className={`flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 ${scrollbarClass}`}>
                    {logsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#de517e]/30 border-t-[#de517e]"></div>
                        <span className="mt-3 text-sm font-medium text-white/80">Syncing telemetry logs...</span>
                      </div>
                    ) : filteredAuditLogs.length === 0 ? (
                      <div className="flex min-h-[200px] items-center justify-center rounded-[1.5rem] bg-white/30">
                        <p className="text-center text-base font-medium text-white/80">
                          No audit logs available yet.
                        </p>
                      </div>
                    ) : (
                      filteredAuditLogs.map((log, index) => (
                        <div
                          key={log.id}
                          style={{ animationDelay: `${index * 20}ms` }}
                          className="animate-list-item opacity-0 grid grid-cols-[1.1fr_0.75fr_2fr] gap-3 rounded-[1.5rem] bg-white/40 px-5 py-4 text-[#d96f92]"
                        >
                          <p className="text-sm font-medium md:text-base">{log.date}</p>
                          <p className="text-sm font-medium md:text-base">{log.time}</p>
                          <p className="text-sm font-semibold md:text-base truncate">{log.event}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECURITY VIDEO CLIP MODAL */}
        {selectedClip && (
          <div 
            className="modal-backdrop-animate fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs" 
            onClick={() => setSelectedClip(null)}
          >
            <div 
              className="modal-panel-animate bg-white rounded-2xl p-4 sm:p-6 max-w-4xl w-full mx-4 max-h-[90vh] relative shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedClip(null)}
                className="absolute -top-3 -right-3 sm:top-4 sm:right-4 z-10 bg-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-2xl font-bold text-gray-800 shadow-xl border border-gray-100"
                aria-label="Close video"
              >
                &times;
              </button>
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
                <video src={selectedClip} controls autoPlay className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}