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
  const [viewMode, setViewMode] = useState<ViewMode>("MAIN_ACTIVITY");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [locker, setLocker] = useState<Locker | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedClip, setSelectedClip] = useState<string | null>(null);

  // FETCH DATA
  useEffect(() => {
    fetchParcels();
    fetchLogs();
  }, []);

  const fetchParcels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch parcels");
      }

      const data = await res.json();
      setParcels(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: any) {
      console.error("Error fetching parcels:", err);
      setError(err.message || "Failed to load parcels");
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const res = await fetch(LOGS_API, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch logs");
      }

      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: any) {
      console.error("Error fetching logs:", err);
      setError(err.message || "Failed to load logs");
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

  // ACTIVITY & AUDIT LOGS
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
    if (!log.success) return "Failed PIN attempt";
    switch (log.action) {
      case "PIN_ENTERED": return log.actor === "user" ? "Valid PIN entered" : "Courier access granted";
      case "LID_OPENED": return log.actor === "user" ? "Lid opened (PIN)" : "Lid opened (Courier)";
      case "LID_CLOSED": return "Lid closed";
      case "LOCK_ENGAGED": return "Lock engaged";
      case "PARCEL_DETECTED": return "Parcel detected";
      case "PIN_LOCKOUT": return "PIN lockout activated";
      case "PIN_RESET": return "PIN lockout reset";
      default: return `${log.action} by ${log.actor}`;
    }
  };

  const formattedAuditLogs: AuditLogItem[] = useMemo(() => {
    return logs.map((log) => ({
      id: log._id,
      date: formatDate(log.timestamp),
      time: formatTime(log.timestamp),
      event: formatLogEvent(log),
    })).slice(0, 20);
  }, [logs]);

  // ESC KEY FOR VIDEO MODAL
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedClip(null);
    };
    if (selectedClip) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [selectedClip]);

  // LOADING SCREEN
  if (loading) {
    return (
      <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
        <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
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
                    className={`transition hover:opacity-80 ${
                      item.label === "ACTIVITY" ? "font-extrabold" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

            </div>
          </header>
          <section className="flex-1 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin h-12 w-12 border-b-2 border-white rounded-full mx-auto mb-4"></div>
              <p className="text-xl font-bold">Loading activity...</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // MAIN PAGE RETURN
  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto flex h-full w-full flex-col gap-4">
        {/* HEADER */}
        <header className="shrink-0 rounded-[1.5rem] bg-[#FFFFFF]/25 px-4 py-3 backdrop-blur-sm md:px-6 md:py-3 lg:px-8 lg:py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Image src="/padalock-logo.png" alt="PadaLock logo" width={340} height={70} className="h-auto w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px]" priority />
            <nav className="flex flex-wrap items-center gap-4 text-white">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className={item.label === "ACTIVITY" ? "font-extrabold" : ""}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* CONTENT */}
        <section className="min-h-0 flex-1 overflow-hidden rounded-[2rem] bg-white/25 p-4 backdrop-blur-sm sm:p-5 md:p-6">
          {/* Activity / Audit toggle and content go here */}
          {/* ... You can continue adding the cleaned-up activity / audit logs display */}
        </section>

        {/* Video Modal */}
        {selectedClip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setSelectedClip(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setSelectedClip(null)}
                className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold text-gray-800 shadow-lg transition hover:scale-110"
                aria-label="Close video"
              >
                ✕
              </button>
              <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                <video src={selectedClip} controls autoPlay className="w-full h-full object-contain" onError={() => setSelectedClip(null)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}