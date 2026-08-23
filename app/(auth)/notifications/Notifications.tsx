"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NotificationType = "DELIVERED" | "FAILED_PIN" | "RETRIEVED" | "GENERAL";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  time: string;
  type: NotificationType;
  unread?: boolean;
}

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "RETURNS", href: "/returns" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:bg-white/20 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-white/30";

const typeStyles: Record<
  NotificationType,
  { bg: string; text: string }
> = {
  DELIVERED: {
    bg: "bg-[#b8d8c7]",
    text: "text-[#0d7a43]",
  },
  FAILED_PIN: {
    bg: "bg-[#edd9cb]",
    text: "text-[#d46800]",
  },
  RETRIEVED: {
    bg: "bg-[#cfe8ec]",
    text: "text-[#1383a3]",
  },
  GENERAL: {
    bg: "bg-white/20",
    text: "text-white",
  },
};

export default function NotificationsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    null
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      return () => {
        localStorage.setItem(
          "notificationsLastViewed",
          Date.now().toString()
        );
      };
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated === true) {
      const viewed =
        Number(localStorage.getItem("notificationsLastViewed")) || 0;

      fetchNotifications(viewed);
    }
  }, [isAuthenticated]);

  const fetchNotifications = async (viewedTimestamp?: number) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) return;

      const res = await fetch("/api/logs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await res.json();

      const viewed =
        viewedTimestamp ??
        (Number(localStorage.getItem("notificationsLastViewed")) || 0);

      const mappedNotifications: NotificationItem[] = data
        .map((log: any) => {
          let type: NotificationType = "GENERAL";
          let title = "Activity Update";
          let message = log.details || "New activity recorded";

          switch (log.action) {
            case "DELIVERY_VALID":
              type = "DELIVERED";
              title = "Parcel Delivered";
              message = "A parcel was successfully delivered.";
              break;

            case "RETRIEVE":
              type = "RETRIEVED";
              title = "Parcel Retrieved";
              message = "A parcel was retrieved from the locker.";
              break;

            case "INVALID_CODE":
              type = "FAILED_PIN";
              title = "Invalid PIN Attempt";
              message = "Someone entered an incorrect PIN.";
              break;

            case "PIN_LOCKOUT":
              type = "FAILED_PIN";
              title = "Locker Lockout";
              message =
                "Too many incorrect PIN attempts were detected.";
              break;

            case "LID_OPEN_TOO_LONG":
              type = "FAILED_PIN";
              title = "Locker Left Open";
              message = "The locker remained open for too long.";
              break;

            default:
              return null;
          }

          const dateObj = new Date(log.timestamp);

          return {
            id: log._id,
            title,
            message,
            date: dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            time: dateObj.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            type,
            unread: dateObj.getTime() > viewed,
          };
        })
        .filter(Boolean) as NotificationItem[];

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "Unread") {
      return notifications.filter((notification) => notification.unread);
    }

    return notifications;
  }, [activeFilter, notifications]);

  const unreadAlerts = notifications.filter(
    (notification) =>
      notification.type === "FAILED_PIN" && notification.unread
  ).length;

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
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1]">
        <div className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/30 border-t-white" />
      </main>
    );
  }

  return (
    <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden">
      <style jsx global>{`
        @keyframes pageFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes itemEntrance {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        main {
          animation: pageFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-notification-card {
          animation: itemEntrance 0.35s
            cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        header a,
        header nav a,
        .animate-notification-card {
          transition: all 0.2s
            cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        header a:hover {
          transform: translateY(-1px);
        }

        header a:active {
          transform: translateY(0px) scale(0.98);
        }

        .animate-notification-card:hover {
          transform: translateX(2px);
          filter: brightness(1.02);
        }
      `}</style>

      <div className="mx-auto flex h-full w-full flex-col gap-4 min-h-0">

      <header className="relative z-[9999] shrink-0 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-xl border border-white/30 shadow-lg">
          <div className="flex items-center justify-between">

            {/* LOGO */}
            <Link
              href="/home"
              className="relative z-[10000] flex items-center transition-transform duration-300 hover:scale-105"
            >
              <Image
                src="/padalock-logo.png"
                alt="PadaLock logo"
                width={200}
                height={50}
                className="w-28 md:w-40"
                priority
              />
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden lg:flex items-center gap-8 text-white font-bold">
              {navItems.map((item) => {
                const isActive = item.href === "/notifications";

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative group flex items-center gap-2 py-1 transition-all duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>

                    {item.label === "NOTIFICATIONS" && unreadAlerts > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadAlerts}
                      </span>
                    )}

                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all duration-300 ${
                        isActive
                          ? "w-full"
                          : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="relative z-[10000] lg:hidden p-2 focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              <div className="flex flex-col justify-between w-6 h-5">
                <span
                  className={`block h-0.5 w-full rounded-full bg-white transition-all duration-300 origin-left ${
                    isMenuOpen ? "rotate-45" : ""
                  }`}
                />

                <span
                  className={`block h-0.5 w-full rounded-full bg-white transition-all duration-300 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />

                <span
                  className={`block h-0.5 w-full rounded-full bg-white transition-all duration-300 origin-left ${
                    isMenuOpen ? "-rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>

          {/* MOBILE NAV */}
          <div
            className={`absolute left-0 right-0 top-full mt-3 px-2 lg:hidden transition-all duration-300 ease-out ${
              isMenuOpen
                ? "visible opacity-100 translate-y-0"
                : "invisible opacity-0 -translate-y-3 pointer-events-none"
            }`}
          >
            <nav className="relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-2xl p-2 shadow-2xl border border-white/40">
              {navItems.map((item, idx) => {
                const isActive = item.href === "/notifications";

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      transitionDelay: isMenuOpen
                        ? `${idx * 50}ms`
                        : "0ms",
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl font-bold text-[#df4473] transition-all duration-200 ${
                      isActive
                        ? "bg-pink-50"
                        : "hover:bg-pink-50"
                    } ${
                      isMenuOpen
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-4 opacity-0"
                    }`}
                  >
                    <span>{item.label}</span>

                    {item.label === "NOTIFICATIONS" && unreadAlerts > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadAlerts}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        {/* CONTENT */}
        <section className="flex-1 flex flex-col rounded-[2.5rem] bg-black/5 backdrop-blur-md border border-white/20 p-6 shadow-inner min-h-0 transition-all duration-500">

          {/* TITLE + FILTER */}
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xs font-black text-white/80 uppercase tracking-[0.3em]">
              Notifications
            </h2>

            <div className="flex w-full gap-1 rounded-2xl bg-white/10 p-1 border border-white/10 md:w-auto md:min-w-[360px]">
              {["ALL", "UNREAD"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`flex-1 min-w-[80px] rounded-xl py-2 text-xs font-bold transition-all duration-300 ${
                    activeFilter === tab
                      ? "bg-white/15 text-white shadow-md scale-105"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {tab}

                  {tab === "Unread" &&
                    notifications.filter((n) => n.unread).length > 0 && (
                      <span className="ml-2 opacity-70">
                        (
                        {
                          notifications.filter(
                            (n) => n.unread
                          ).length
                        }
                        )
                      </span>
                    )}
                </button>
              ))}
            </div>
          </div>

          {/* LIST */}
          <div
            className={`flex-1 overflow-y-auto pr-1 ${scrollbarClass}`}
          >
            <div className="flex flex-col gap-3">

              {loading ? (
                <div className="py-10 text-center">
                  <p className="text-xs font-black text-white/40 uppercase tracking-widest animate-pulse">
                    Fetching Logs...
                  </p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-20 text-center rounded-3xl border border-dashed border-white/10 animate-in fade-in zoom-in-95 duration-500">
                  <p className="text-xs font-black text-white/30 uppercase tracking-widest">
                    No activity found
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item, i) => {
                  const style = typeStyles[item.type];
                  const isAlert = item.type === "FAILED_PIN";

                  return (
                    <div
                      key={item.id}
                      style={{
                        animationDelay: `${i * 50}ms`,
                      }}
                      className={`group flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl p-5 border transition-all duration-300 hover:scale-[1.01] animate-notification-card opacity-0 ${
                        isAlert
                          ? `bg-red-500/20 border-red-300/20 ${
                              item.unread
                                ? "bg-red-500/30 border-l-4 border-l-red-500"
                                : ""
                            }`
                          : item.unread
                          ? "bg-white/25 border-white/20 border-l-4 border-l-[#df4473]"
                          : "bg-white/15 border-white/10 hover:bg-white/25"
                      }`}
                    >
                      <div className="flex-1 min-w-0">

                        {/* TITLE */}
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-lg font-bold break-all ${
                              isAlert
                                ? "text-white"
                                : "text-white"
                            }`}
                          >
                            {item.title}
                          </h3>

                          {item.unread && !isAlert && (
                            <span className="h-2 w-2 rounded-full bg-[#df4473] animate-pulse shrink-0" />
                          )}
                        </div>

                        {/* MESSAGE */}
                        <p
                          className={`text-xs uppercase tracking-wider mt-1 ${
                            isAlert
                              ? "text-white/70"
                              : "font-medium text-white/60"
                          }`}
                        >
                          {item.message}
                        </p>

                        {/* DATE / TIME */}
                        <p
                          className={`text-[10px] mt-1 uppercase tracking-widest font-bold ${
                            isAlert
                              ? "text-white/40"
                              : "text-white/40"
                          }`}
                        >
                          {item.date} • {item.time}
                        </p>
                      </div>

                      {/* TYPE */}
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm transition-transform duration-300 group-hover:scale-105 ${style.bg} ${style.text}`}
                        >
                          {item.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}