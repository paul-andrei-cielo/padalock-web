import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "CLIPS", href: "/clips" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

export default function HomePage() {
  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col">
        <header className="mb-3 rounded-[1.5rem] bg-[#FFFFFF]/25 px-4 py-3 backdrop-blur-sm md:mb-4 md:px-6 md:py-3 lg:mb-5 lg:px-8 lg:py-4">
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

        <section className="mb-3 flex justify-center md:mb-4 lg:mb-5">
            <div className="rounded-[1.2rem] bg-[#FFFFFF]/25 px-5 py-2 text-center text-sm font-medium text-white backdrop-blur-sm sm:px-6 sm:text-base md:px-8 md:text-lg lg:px-10 lg:text-xl">
                Locker Status
            </div>
        </section>

        <section className="grid flex-1 gap-4 md:gap-5 lg:grid-cols-[2.2fr_0.9fr] lg:gap-6">
          <div className="rounded-[2rem] bg-[#FFFFFF]/25 p-5 backdrop-blur-sm md:p-6 lg:p-8">
            <h2 className="text-2xl font-extrabold text-white md:text-3xl lg:text-4xl">
              Overview
            </h2>
          </div>

          <div className="rounded-[2rem] bg-[#FFFFFF]/25 p-5 backdrop-blur-sm md:p-6 lg:p-8">
            <h2 className="text-2xl font-extrabold text-white md:text-3xl lg:text-4xl">
              Recent
            </h2>
          </div>
        </section>
      </div>
    </main>
  );
}
