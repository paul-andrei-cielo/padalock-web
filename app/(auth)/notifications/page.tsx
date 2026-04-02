"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

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

const notificationsData: NotificationItem[] = [
  {
    id: "1",
    title: "Parcel Delivered",
    message: "Parcel 20260310001 has been delivered to your PadaBox",
    date: "March 10, 2026",
    time: "13:30",
    type: "DELIVERED",
    unread: true,
  },
  {
    id: "2",
    title: "Failed PIN Attempt",
    message: "An incorrect PIN was entered on your PadaBox",
    date: "March 10, 2026",
    time: "13:30",
    type: "FAILED_PIN",
  },
  {
    id: "3",
    title: "Parcel Retrieved",
    message: "Parcel Tracking No. 20260310001 has been retrieved",
    date: "March 10, 2026",
    time: "13:30",
    type: "RETRIEVED",
  },
  {
    id: "4",
    title: "Parcel Delivered",
    message: "Parcel 20260309012 has been delivered to your PadaBox",
    date: "March 09, 2026",
    time: "17:10",
    type: "DELIVERED",
  },
  {
    id: "5",
    title: "Parcel Retrieved",
    message: "Parcel Tracking No. 20260309012 has been retrieved",
    date: "March 09, 2026",
    time: "18:05",
    type: "RETRIEVED",
  },
  {
    id: "6",
    title: "Failed PIN Attempt",
    message: "An incorrect PIN was entered on your PadaBox",
    date: "March 08, 2026",
    time: "09:42",
    type: "FAILED_PIN",
  },
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
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredNotifications = useMemo(() => {
    if (!showUnreadOnly) return notificationsData;
    return notificationsData.filter((item) => item.unread);
  }, [showUnreadOnly]);

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
              {navItems.map((item) => {
                const isActive = item.label === "NOTIFICATIONS";

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`transition hover:opacity-80 ${
                      isActive ? "font-extrabold" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
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

            <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${scrollbarClass}`}>
              <div className="flex flex-col gap-4">
                {filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[2rem] bg-white/35 px-5 py-5 backdrop-blur-sm transition hover:bg-white/45 md:px-8 md:py-7"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <h2
                          className={`text-xl font-extrabold md:text-2xl lg:text-3xl ${titleStyles[item.type]}`}
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

                {filteredNotifications.length === 0 && (
                  <div className="flex min-h-[220px] items-center justify-center rounded-[2rem] bg-white/30 px-6 py-8">
                    <p className="text-center text-base font-medium text-[#df8daa] md:text-lg">
                      No notifications to show.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}