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
  FAILED_PIN: "text-[#e39ab3]",
  RETRIEVED: "text-[#e39ab3]",
  GENERAL: "text-[#de517e]",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("/api/logs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (res.ok) {
          const mappedNotifications: NotificationItem[] = data.map((log: any) => {
            let type: NotificationType = "GENERAL";
            let title = "Activity";
            let message = log.details || "New activity recorded";

            if (log.action === "PARCEL_DETECTED") {
              type = "DELIVERED";
              title = "Parcel Delivered";
              message = "A parcel has been detected in your PadaBox";
            } else if (log.action === "LID_OPENED") {
              type = "RETRIEVED";
              title = "Parcel Retrieved";
              message = "You opened your PadaBox";
            } else if (
              (log.action === "PIN_ENTERED" && !log.success) ||
              log.action === "PIN_LOCKOUT"
            ) {
              type = "FAILED_PIN";
              title = "Failed PIN Attempt";
              message = "An incorrect PIN was entered on your PadaBox";
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
              unread: false,
            };
          });

          setNotifications(mappedNotifications);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    return showUnreadOnly
      ? notifications.filter((item) => item.unread)
      : notifications;
  }, [showUnreadOnly, notifications]);

  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
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
                  className={`transition hover:opacity-80 ${
                    item.label === "NOTIFICATIONS" ? "font-extrabold" : ""
                  }`}
                >
                  {item.label}
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

              <div className="flex w-full flex-nowrap gap-3 lg:w-auto lg:min-w-[360px]">
                <button
                  onClick={() => setShowUnreadOnly(false)}
                  className={`flex-1 whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-bold transition md:text-base ${
                    !showUnreadOnly
                      ? "bg-white text-[#de517e]"
                      : "bg-[#de517e] text-white hover:opacity-90"
                  }`}
                >
                  All Notifications
                </button>

                <button
                  onClick={() => setShowUnreadOnly(true)}
                  className={`flex-1 whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-bold transition md:text-base ${
                    showUnreadOnly
                      ? "bg-white text-[#de517e]"
                      : "bg-[#de517e] text-white hover:opacity-90"
                  }`}
                >
                  Unread
                </button>
              </div>
            </div>

            <div
              className={`min-h-0 flex-1 overflow-y-auto pr-1 ${scrollbarClass}`}
            >
              {loading ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <p className="text-center text-base font-medium text-white md:text-lg">
                    Loading...
                  </p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-[2rem] bg-white/30 px-6 py-8">
                  <p className="text-center text-base font-medium text-[#df8daa] md:text-lg">
                    No notifications to show.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredNotifications.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[2rem] bg-white/35 px-5 py-5 backdrop-blur-sm transition hover:bg-white/45 md:px-8 md:py-7"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <h2
                            className={`text-2xl font-extrabold md:text-3xl lg:text-3xl ${titleStyles[item.type]}`}
                          >
                            {item.title}
                          </h2>
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