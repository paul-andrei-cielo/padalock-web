import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "CLIPS", href: "/clips" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

export default function RegisterPage() {
  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col">
        <header className="mb-4 rounded-[1.5rem] bg-[#FFFFFF]/25 px-4 py-3 backdrop-blur-sm md:mb-5 md:px-6 md:py-3 lg:mb-6 lg:px-8 lg:py-4">
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

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-5xl rounded-[2rem] bg-[#FFFFFF]/25 p-6 backdrop-blur-sm sm:p-8 md:p-10 lg:p-12">
            <h2 className="mb-6 text-center text-xl font-bold text-white sm:text-2xl md:text-3xl lg:text-4xl">
              Register Tracking Number
            </h2>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Enter your tracking number"
                className="h-10 w-full rounded-full bg-[#FFFFFF]/50 px-5 text-sm text-[#dd8ea5] outline-none placeholder:text-[#dd9db0] sm:h-12 sm:text-base md:h-14 md:text-lg"
              />

              <button
                className="h-10 w-full rounded-full bg-[#e33e70] px-6 text-sm font-bold text-white transition hover:scale-[1.02] sm:h-12 sm:w-auto sm:min-w-[140px] sm:text-base md:h-14 md:min-w-[160px] md:text-lg"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
