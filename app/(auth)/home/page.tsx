import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

export default function HomePage() {
  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">

        {/* HEADER (UNCHANGED) */}
        <header className="rounded-[1.5rem] bg-[#FFFFFF]/25 px-4 py-3 backdrop-blur-sm md:px-6 md:py-3 lg:px-8 lg:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Image
              src="/padalock-logo.png"
              alt="PadaLock logo"
              width={340}
              height={70}
              className="h-auto w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px]"
              priority
            />

            <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs font-medium text-white sm:text-sm md:text-base lg:gap-x-6 lg:text-lg">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="transition hover:opacity-80"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <section className="grid flex-1 gap-4 lg:grid-cols-[2.2fr_0.9fr]">

          {/* LEFT SIDE */}
          <div className="flex flex-col gap-4">

            {/* STATUS */}
            <div className="rounded-[2rem] bg-white/25 p-5 backdrop-blur-sm">
              <h2 className="mb-4 text-xl font-extrabold text-white md:text-2xl">
                PadaBox Status
              </h2>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["🔒", "Lock:", "Locked"],
                  ["🚪", "Door:", "Closed"],
                  ["📦", "State:", "Occupied"],
                  ["🔔", "Status:", "Partially Delivered"],
                ].map(([icon, label, value]) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-[1.5rem] bg-white/50 px-4 py-3"
                  >
                    <span className="text-2xl text-[#df4473]">{icon}</span>
                    <p className="text-sm text-[#df4473] md:text-base">
                      {label}{" "}
                      <span className="font-extrabold">{value}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* OVERVIEW */}
            <div className="flex-1 rounded-[2rem] bg-white/25 p-5 backdrop-blur-sm">
              <h2 className="mb-4 text-xl font-extrabold text-white md:text-2xl">
                Overview
              </h2>

              <div className="grid h-[calc(100%-3rem)] gap-3 md:grid-cols-3">

                {/* Pending */}
                <div className="flex flex-col rounded-[1.5rem] bg-white/50 p-4">
                  <h3 className="text-center text-base font-extrabold text-[#df4473] md:text-lg lg:text-xl">
                    Pending
                  </h3>

                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-5xl font-light text-[#df4473] md:text-6xl lg:text-7xl">
                      02
                    </p>
                  </div>
                </div>

                {/* Delivered */}
                <div className="flex flex-col rounded-[1.5rem] bg-white/50 p-4">
                  <h3 className="text-center text-base font-extrabold text-[#df4473] md:text-lg lg:text-xl">
                    Delivered
                  </h3>

                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-5xl font-light text-[#df4473] md:text-6xl lg:text-7xl">
                      00
                    </p>
                  </div>
                </div>

                {/* Retrieved */}
                <div className="flex flex-col rounded-[1.5rem] bg-white/50 p-4">
                  <h3 className="text-center text-base font-extrabold text-[#df4473] md:text-lg lg:text-xl">
                    Retrieved
                  </h3>

                  <div className="flex flex-1 flex-col items-center justify-center">
                    <p className="text-5xl font-light text-[#df4473] md:text-6xl lg:text-7xl">
                      01
                    </p>

                    <div className="mt-2 flex w-full max-w-[120px] items-center justify-between rounded-full bg-white/50 px-3 py-1 text-xs text-[#df4473]">
                      <span>Today</span>
                      <span>˅</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT SIDE (RECENT) */}
          <aside className="flex flex-col rounded-[2rem] bg-white/25 p-5 backdrop-blur-sm">
            <h2 className="mb-4 text-xl font-extrabold text-white md:text-2xl">
              Recent
            </h2>

            <div className="flex-1 rounded-[1.5rem] bg-white/35 p-3">
              <div className="flex flex-col gap-3">
                {[
                  ["📦", "Delivered", "(3 Parcel/s)", "Today, 3:10 PM"],
                  ["📦", "Retrieved", "(1 Parcel/s)", "March 23, 2:14 PM"],
                  ["❗", "Failed PIN Attempt", "", "March 22, 6:02 PM"],
                ].map(([icon, title, extra, time]) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-[1.25rem] bg-white/55 px-4 py-3"
                  >
                    <span
                      className={`text-xl ${
                        title === "Failed PIN Attempt"
                          ? "text-red-500"
                          : "text-[#df4473]"
                      }`}
                    >
                      {icon}
                    </span>

                    <div className="text-[#df4473]">
                      <p className="text-sm font-extrabold md:text-base">
                        {title}{" "}
                        {extra && (
                          <span className="italic font-medium">{extra}</span>
                        )}
                      </p>
                      <p className="text-xs md:text-sm">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}