"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, Check } from "lucide-react";

/* ---------- Shared Padalock styles (same as the rest of the app) ---------- */

const glass =
  "relative rounded-[2rem] border border-white/35 bg-[#a82452]/60 backdrop-blur-xl " +
  "shadow-[0_8px_32px_rgba(120,20,55,0.25),inset_0_1px_0_rgba(255,255,255,0.25)]";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8789b]";

const inputClass =
  "w-full h-12 rounded-full border border-white/35 bg-white/15 px-5 text-white placeholder:text-white/60 " +
  "outline-none transition focus:border-white/70 focus:bg-white/25 disabled:opacity-60";

const primaryButton = `flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-bold text-[#8a1a42] shadow-lg transition hover:bg-pink-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

const pageBg =
  "bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.28),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.35),transparent_50%),linear-gradient(180deg,#df4473_0%,#e8789b_50%,#ee94ae_100%)]";

/* ---------- Page ---------- */

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

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
    <main
      className={`pl-fade flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 md:px-10 lg:px-16 ${pageBg}`}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-10 lg:flex-row lg:gap-16">
        {/* BRANDING */}
        <section className="flex flex-1 flex-col items-center text-center text-white lg:items-start lg:text-left">
          <Image
            src="/padalock-logo.png"
            alt="Padalock"
            width={390}
            height={90}
            priority
            className="pl-rise w-48 object-contain drop-shadow-md md:w-64 lg:w-[390px]"
          />

          <div className="pl-rise pl-d2 mt-8 max-w-md lg:mt-14">
            <h1 className="text-4xl font-black leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
              Forgot your
              <br />
              password?
            </h1>
          </div>
        </section>

        {/* FORM CARD */}
        <section className="pl-rise pl-d3 w-full max-w-md md:max-w-lg">
          <div className={`${glass} p-6 md:p-10`}>
            <h2 className="mb-6 text-2xl font-bold text-white">Reset password</h2>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold text-white"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className={inputClass}
                />
              </div>

              {/* STATUS MESSAGE */}
              {message &&
                (isSuccess ? (
                  <div
                    role="status"
                    className="pl-pop flex items-start gap-3 rounded-2xl border-2 border-[#7ee0b5] bg-[#5c0f2e] p-4"
                  >
                    <span className="mt-0.5 shrink-0 text-[#7ee0b5]">
                      <Check size={18} />
                    </span>
                    <p className="text-sm font-semibold text-white">{message}</p>
                  </div>
                ) : (
                  <div
                    role="alert"
                    className="pl-pop flex items-start gap-3 rounded-2xl border-2 border-[#ffc46b] bg-[#5c0f2e] p-4"
                  >
                    <span className="mt-0.5 shrink-0 text-[#ffc46b]">
                      <AlertTriangle size={18} />
                    </span>
                    <p className="text-sm font-semibold text-white">{message}</p>
                  </div>
                ))}

              {/* SUBMIT */}
              <div className="space-y-5 pt-1">
                <button type="submit" disabled={loading} className={primaryButton}>
                  {loading ? (
                    <>
                      <span
                        className="h-5 w-5 animate-spin rounded-full border-2 border-[#8a1a42]/30 border-t-[#8a1a42]"
                        aria-hidden
                      />
                      Sending link…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>

                <p className="text-center text-sm text-white/90">
                  Remember your password?{" "}
                  <Link
                    href="/login"
                    className={`rounded font-bold text-white underline underline-offset-4 ${focusRing}`}
                  >
                    Back to log in
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