import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

const trackingItems = [
  {
    code: "PH5326...245G",
    date: "Registered: March 10, 2026 | 13:30",
    status: "Delivered",
    statusClass: "bg-[#b8d8c7] text-[#0d7a43]",
  },
  {
    code: "JT2516...1222",
    date: "Registered: March 10, 2026 | 15:20",
    status: "Pending",
    statusClass: "bg-[#edd9cb] text-[#d46800]",
  },
  {
    code: "PH2156...521G",
    date: "Registered: March 10, 2026 | 15:20",
    status: "Retrieved",
    statusClass: "bg-[#cfe8ec] text-[#1383a3]",
  },
];

const filterTabs = ["All", "Pending", "Delivered", "Retrieved"];

export default function RegisterPage() {
  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
        <header className="rounded-[1.5rem] bg-[#FFFFFF]/25 px-4 py-3 backdrop-blur-sm md:px-6 md:py-3 lg:px-8 lg:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
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

            <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs font-medium text-white sm:text-sm md:text-base lg:gap-x-6 lg:text-lg">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`transition hover:opacity-80 ${
                    item.href === "/register" ? "font-bold" : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex min-h-0 flex-col rounded-[2rem] bg-white/25 p-5 backdrop-blur-sm md:p-6">
            <h2 className="text-xl font-extrabold text-white md:text-2xl">
              Registered Tracking Numbers
            </h2>

            <p className="mt-3 max-w-[600px] text-xs leading-relaxed text-[#ffffff] md:text-sm">
              All expected parcels are listed here. Register your tracking number, and it
              will appear in the list with Pending Status.
            </p>

            <div className="mt-4 flex rounded-full bg-white/40 p-1.5">
              {filterTabs.map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition md:text-base ${
                    index === 0
                      ? "bg-[#de9aae] text-white"
                      : "text-[#de9aae] hover:bg-white/30"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
              {trackingItems.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between rounded-[1.5rem] bg-white/45 px-4 py-4"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold text-[#de9aae] md:text-2xl">
                      {item.code}
                    </h3>
                    <p className="mt-1 text-xs text-[#de9aae] md:text-base">
                      {item.date}
                    </p>
                  </div>

                  <div className="ml-4 flex items-center gap-3 md:gap-4">
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-extrabold md:px-5 md:text-lg ${item.statusClass}`}
                    >
                      {item.status}
                    </span>

                    <button
                      type="button"
                      className="text-lg text-[#de9aae] transition hover:scale-110 hover:opacity-80 md:text-xl"
                      aria-label={`Edit ${item.code}`}
                    >
                      ✎
                    </button>

                    <button
                      type="button"
                      className="text-lg text-[#de9aae] transition hover:scale-110 hover:opacity-80 md:text-xl"
                      aria-label={`Delete ${item.code}`}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/25 p-5 backdrop-blur-sm md:p-6">
            <h2 className="text-xl font-extrabold text-white md:text-2xl">
              Register Tracking Number
            </h2>

            <div className="mt-6">
              <label className="mb-3 block text-base font-medium text-[#ffffff] md:text-lg">
                Tracking number
              </label>

              <input
                type="text"
                placeholder="Enter your parcel’s tracking number"
                className="h-12 w-full rounded-full bg-white/45 px-5 text-sm text-[#dd8ea5] outline-none placeholder:text-[#dd9db0] md:h-14 md:text-base"
              />

              <button
                type="button"
                className="mt-6 h-12 w-full rounded-full bg-[#df4473] px-6 text-lg font-extrabold text-white transition hover:scale-[1.01] md:h-14 md:text-xl"
              >
                Register
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}