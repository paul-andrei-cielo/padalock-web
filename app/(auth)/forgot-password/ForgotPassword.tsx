"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Animation state
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    // Keep the logo centered briefly before starting the animation.
    const timer = setTimeout(() => {
      setIntroComplete(true);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const res = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Something went wrong");
        setIsSuccess(false);
        return;
      }

      setMessage("Reset link sent! Check your email.");
      setIsSuccess(true);
      setEmail("");
    } catch (err) {
      console.error(err);
      setMessage("Server error. Please try again.");
      setIsSuccess(false);
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
          ${
            introComplete
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
            transition-all
            duration-[1400ms]
            ease-[cubic-bezier(0.22,1,0.36,1)]
            ${
              introComplete
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
        {/* BRANDING SECTION                                          */}
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

            {/* Destination logo */}
            <Image
              src="/padalock-logo.png"
              alt="PadaLock Logo"
              width={300}
              height={70}
              priority
              className={`
                w-48 md:w-64 lg:w-[390px]
                object-contain
                drop-shadow-xl
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

          {/* Heading */}
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
              Forgot your
              <br />
              <span className="opacity-90">
                password?
              </span>
            </h2>
          </div>
        </section>

        {/* ========================================================= */}
        {/* FORM CARD SECTION                                         */}
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

            <form
              className="space-y-6"
              onSubmit={handleSubmit}
            >

              {/* EMAIL */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="ml-2 block text-sm font-black uppercase tracking-widest text-[#df4473]"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 w-full rounded-2xl border-2 border-white/50 bg-white/50 px-6 text-lg text-gray-800 outline-none placeholder:text-pink-300 focus:border-[#df4473] focus:bg-white transition-all shadow-inner"
                  required
                />
              </div>

              {/* BUTTON + MESSAGE */}
              <div className="flex flex-col gap-6 pt-2">

                <button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-[#df4473] text-lg font-black uppercase tracking-widest text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending Link
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                {/* STATUS MESSAGE */}
                {message && (
                  <div
                    className={`
                      rounded-2xl p-4 text-center text-sm
                      font-bold border
                      animate-in fade-in zoom-in-95
                      ${
                        isSuccess
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-red-500/10 text-red-600 border-red-500/20"
                      }
                    `}
                  >
                    {message}
                  </div>
                )}

                {/* BACK TO LOGIN */}
                <p className="text-center text-sm font-bold text-gray-500 uppercase tracking-tight">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className="text-[#df4473] hover:underline"
                  >
                    Back to login
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