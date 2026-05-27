"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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

  
const titleStyles: Record<NotificationType, string> = {
  DELIVERED: "text-[#de517e]",
  RETRIEVED: "text-[#de517e]",
  FAILED_PIN: "text-[#c0392b]",
  GENERAL: "text-[#de517e]",
};

export default function NotificationsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastViewed, setLastViewed] = useState(0);

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

        setLastViewed(viewed);

        fetchNotifications();
      }
    }, [isAuthenticated]);


  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem("token")!;
      
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
        Number(localStorage.getItem("notificationsLastViewed")) || 0;

      const mappedNotifications: NotificationItem[] = data
        .map((log: any) => {
        let type: NotificationType = "GENERAL";
        let title = "Activity";
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
          message = "Too many incorrect PIN attempts were detected.";
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
        const dateStr = dateObj.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const timeStr = dateObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        return {
          id: log._id,
          title,
          message,
          date: dateStr,
          time: timeStr,
          type,
          unread:
          new Date(log.timestamp).getTime() > viewed,
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
            Looks like you're not logged in
          </div>
          <div className="text-white/90 text-lg md:text-xl font-semibold animate-pulse">
            Redirecting to login...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto flex h-full w-full flex-col gap-4">
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
                      item.label === "NOTIFICATIONS" ? "font-extrabold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.label}

                      {item.label === "NOTIFICATIONS" &&
                        notifications.filter(
                            (n) => n.type === "FAILED_PIN" && n.unread
                          ).length > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                            {
                              notifications.filter(
                              (n) => n.type === "FAILED_PIN" && n.unread
                            ).length
                            }
                          </span>
                        )}
                    </div>
                  </Link>
              ))}
            </nav>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-hidden rounded-[2rem] bg-white/25 p-4 backdrop-blur-sm sm:p-5 md:p-6">
          <div className="flex h-full min-h-0 flex-col">
            <div className="mb-5 flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h1 className="text-2xl font-extrabold text-white md:text-3xl">
                Notifications
              </h1>
            </div>

            <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${scrollbarClass}`}>
              {loading ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <p className="text-center text-base font-medium text-white md:text-lg">
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-[2rem] bg-white/30 px-6 py-8">
                  <p className="text-center text-base font-medium text-[#df8daa] md:text-lg">
                    No notifications to show.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {notifications.map((item) => (
                    <div
                        key={item.id}
                        className={`rounded-[2rem] px-5 py-5 backdrop-blur-sm transition md:px-8 md:py-7 ${
                          item.type === "FAILED_PIN"
                            ? item.unread
                              ? "bg-red-200 border-2 border-red-500"
                              : "bg-red-100/70 border border-red-300"
                            : item.unread
                              ? "bg-white/60"
                              : "bg-white/35"
                        }`}
                      >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">

                              <h2
                                className={`text-2xl font-extrabold md:text-3xl lg:text-3xl ${titleStyles[item.type]}`}
                              >
                                {item.title}
                              </h2>
                            </div>
                          {item.unread && (
                            <span className="mt-1 inline-flex h-3 w-3 shrink-0 rounded-full bg-[#de517e]" />
                          )}
                        </div>

                        <p className="text-base text-[#de517e] md:text-[1.02rem] lg:text-[1.05rem]">
                          {item.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[#e08fa9] md:text-base lg:text-[1.05rem]">
                          <span>{item.date}</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}