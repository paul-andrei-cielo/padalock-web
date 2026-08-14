"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Animation state
  const [introComplete, setIntroComplete] = useState(false);

  const router = useRouter();

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const passwordsDoNotMatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  useEffect(() => {
    // Keep the logo centered briefly before revealing the page.
    const timer = setTimeout(() => {
      setIntroComplete(true);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!formData.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!nameRegex.test(formData.firstName.trim())) {
      setError(
        "First name must contain letters only (no numbers or special characters)."
      );
      return;
    }

    if (!formData.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    if (!nameRegex.test(formData.lastName.trim())) {
      setError(
        "Last name must contain letters only (no numbers or special characters)."
      );
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!emailRegex.test(formData.email.trim())) {
      setError(
        "Please enter a valid email address (e.g. user@gmail.com or user@yahoo.com)."
      );
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      router.push("/login");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));

    setError("");
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
        {/* LEFT SIDE: BRANDING                                      */}
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
              Create an
              <br />
              <span className="opacity-90">
                account
              </span>
            </h2>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RIGHT SIDE: FORM CARD                                    */}
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
          <div className="w-full rounded-[2.5rem] bg-white/40 p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-white/40">

            <form
              className="space-y-5"
              onSubmit={handleSubmit}
            >

              {/* ERROR */}
              {error && (
                <div className="rounded-2xl bg-red-500/10 p-4 text-center text-sm font-bold text-red-600 border border-red-500/20 animate-shake">
                  {error}
                </div>
              )}

              {/* FIRST + LAST NAME */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div className="space-y-1.5">
                  <label
                    htmlFor="firstName"
                    className="ml-2 block text-[10px] font-black uppercase tracking-widest text-[#df4473]"
                  >
                    First Name
                  </label>

                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="h-12 w-full rounded-2xl border-2 border-white/50 bg-white/50 px-5 text-gray-800 outline-none focus:border-[#df4473] focus:bg-white transition-all shadow-inner"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lastName"
                    className="ml-2 block text-[10px] font-black uppercase tracking-widest text-[#df4473]"
                  >
                    Last Name
                  </label>

                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="h-12 w-full rounded-2xl border-2 border-white/50 bg-white/50 px-5 text-gray-800 outline-none focus:border-[#df4473] focus:bg-white transition-all shadow-inner"
                    disabled={isLoading}
                  />
                </div>

              </div>

              {/* EMAIL */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="ml-2 block text-[10px] font-black uppercase tracking-widest text-[#df4473]"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="user@example.com"
                  className="h-12 w-full rounded-2xl border-2 border-white/50 bg-white/50 px-5 text-gray-800 outline-none focus:border-[#df4473] focus:bg-white transition-all shadow-inner"
                  disabled={isLoading}
                />
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="ml-2 block text-[10px] font-black uppercase tracking-widest text-[#df4473]"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min. 6 characters"
                  className={`
                    h-12 w-full rounded-2xl border-2
                    bg-white/50 px-5 text-gray-800
                    outline-none transition-all shadow-inner
                    ${
                      passwordsDoNotMatch
                        ? "border-red-400 focus:border-red-500"
                        : passwordsMatch
                        ? "border-green-400 focus:border-green-500"
                        : "border-white/50 focus:border-[#df4473]"
                    }
                  `}
                  disabled={isLoading}
                />
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="ml-2 block text-[10px] font-black uppercase tracking-widest text-[#df4473]"
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Repeat password"
                  className={`
                    h-12 w-full rounded-2xl border-2
                    bg-white/50 px-5 text-gray-800
                    outline-none transition-all shadow-inner
                    ${
                      passwordsDoNotMatch
                        ? "border-red-400 focus:border-red-500"
                        : passwordsMatch
                        ? "border-green-400 focus:border-green-500"
                        : "border-white/50 focus:border-[#df4473]"
                    }
                  `}
                  disabled={isLoading}
                />

                <div className="min-h-[16px] px-2">
                  {passwordsDoNotMatch && (
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">
                      Passwords do not match
                    </p>
                  )}

                  {passwordsMatch && (
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">
                      Passwords match
                    </p>
                  )}
                </div>
              </div>

              {/* BUTTON */}
              <div className="pt-2">

                <button
                  type="submit"
                  disabled={
                    isLoading || passwordsDoNotMatch
                  }
                  className="h-14 w-full rounded-2xl bg-[#df4473] text-lg font-black uppercase tracking-widest text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating Account
                    </>
                  ) : (
                    "Get Started"
                  )}
                </button>

                <p className="mt-6 text-center text-sm font-bold text-gray-500 uppercase tracking-tight">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-[#df4473] hover:underline"
                  >
                    Login
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