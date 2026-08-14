"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Animation state
  const [introComplete, setIntroComplete] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Give the logo a moment to sit in the center
    // before starting the animation.
    const timer = setTimeout(() => {
      setIntroComplete(true);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // ── VALIDATION BLOCK ──
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setError("Email is required.");
      setLoading(false);
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    // ── END VALIDATION BLOCK ──

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/home");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-t from-[#f6f2f4] via-[#efc7d3] to-[#df4f7d] lg:bg-gradient-to-b lg:from-[#f6f2f4] lg:via-[#efc7d3] lg:to-[#df4f7d] px-6 py-10 md:px-12 lg:px-16 flex items-center justify-center transition-colors duration-500">

      {/* ========================================================= */}
      {/* CENTER LOGO INTRO                                         */}
      {/* ========================================================= */}

      <div
        className={`
          pointer-events-none fixed inset-0 z-50
          flex items-center justify-center
          transition-all duration-[1400ms]
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${introComplete
            ? "opacity-0"
            : "opacity-100"
          }
        `}
      >
        <Image
          src="/padalock-logo.png"
          alt="PadaLock Logo"
          width={390}
          height={90}
          priority
          className={`
            w-64 md:w-80 lg:w-[390px]
            object-contain
            drop-shadow-[0_10px_30px_rgba(0,0,0,0.12)]
            transition-all duration-[1400ms]
            ease-[cubic-bezier(0.22,1,0.36,1)]
            ${introComplete
              ? "scale-[0.49] opacity-0"
              : "scale-100 opacity-100"
            }
          `}
        />
      </div>

      {/* ========================================================= */}
      {/* MAIN CONTENT                                               */}
      {/* ========================================================= */}

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-12 lg:flex-row lg:gap-10">

        {/* ========================================================= */}
        {/* LEFT SECTION: BRANDING & HEADLINE                        */}
        {/* ========================================================= */}

        <section
          className={`
            flex flex-col items-center text-center
            lg:items-start lg:text-left
            flex-1 text-white
            transition-all
            duration-1000
            ease-out
            ${
              introComplete
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }
          `}
        >
          <div className="mb-8 md:mb-12 lg:mb-16">

            {/* Actual logo position */}
            <Image
              src="/padalock-logo.png"
              alt="PadaLock Logo"
              width={300}
              height={70}
              priority
              className={`
                w-48 md:w-64 lg:w-[390px]
                object-contain
                drop-shadow-md
                transition-all
                duration-[1200ms]
                ease-[cubic-bezier(0.22,1,0.36,1)]
                ${
                  introComplete
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95"
                }
              `}
            />
          </div>

          <div
            className={`
              max-w-md
              transition-all
              duration-1000
              delay-300
              ease-out
              ${
                introComplete
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }
            `}
          >
            <h2 className="text-4xl font-black leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
              Login to
              <br />
              <span className="opacity-90">
                your account
              </span>
            </h2>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RIGHT SECTION: LOGIN FORM                                */}
        {/* ========================================================= */}

        <section
          className={`
            w-full max-w-md md:max-w-lg lg:max-w-xl
            transition-all
            duration-1000
            delay-500
            ease-out
            ${
              introComplete
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-10"
            }
          `}
        >
          <div className="w-full rounded-[2.5rem] bg-white/40 p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-white/40">

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ERROR */}
              {error && (
                <div className="rounded-2xl bg-red-500/10 p-4 text-center text-sm font-bold text-red-600 border border-red-500/20 animate-shake">
                  {error}
                </div>
              )}

              {/* EMAIL */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="ml-2 block text-sm font-black uppercase tracking-widest text-[#df4473]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="h-14 w-full rounded-2xl border-2 border-white/50 bg-white/50 px-6 text-lg text-gray-800 outline-none placeholder:text-pink-300 focus:border-[#df4473] focus:bg-white transition-all shadow-inner"
                />
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="ml-2 block text-sm font-black uppercase tracking-widest text-[#df4473]"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="h-14 w-full rounded-2xl border-2 border-white/50 bg-white/50 px-6 text-lg text-gray-800 outline-none placeholder:text-pink-300 focus:border-[#df4473] focus:bg-white transition-all shadow-inner"
                />

                <div className="flex justify-end pr-2">
                  <Link
                    href="/forgot-password"
                    className="text-[10px] font-black text-[#df4473]/70 hover:text-[#df4473] transition-colors uppercase tracking-widest"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* BUTTON + SIGNUP */}
              <div className="flex flex-col gap-6 pt-4">

                <button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-[#df4473] text-lg font-black uppercase tracking-widest text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Authenticating
                    </>
                  ) : (
                    "Login"
                  )}
                </button>

                <p className="text-center text-sm font-bold text-gray-500 uppercase tracking-tight">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-[#df4473] hover:underline"
                  >
                    Sign up
                  </Link>
                </p>

              </div>
            </form>
          </div>
        </section>

      </div>
    </main>
  );
}