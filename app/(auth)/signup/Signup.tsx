"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Eye, EyeOff } from "lucide-react";

/* ---------- Shared Padalock styles (same as the rest of the app) ---------- */

const glass =
  "relative rounded-[2rem] border border-white/35 bg-[#a82452]/60 backdrop-blur-xl " +
  "shadow-[0_8px_32px_rgba(120,20,55,0.25),inset_0_1px_0_rgba(255,255,255,0.25)]";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8789b]";

const inputBase =
  "w-full h-12 rounded-full border bg-white/15 px-5 text-white placeholder:text-white/60 " +
  "outline-none transition focus:bg-white/25 disabled:opacity-60";

const inputNeutral = "border-white/35 focus:border-white/70";

const primaryButton = `flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-base font-bold text-[#8a1a42] shadow-lg transition hover:bg-pink-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

const pageBg =
  "bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.28),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.35),transparent_50%),linear-gradient(180deg,#df4473_0%,#e8789b_50%,#ee94ae_100%)]";

type MatchState = "match" | "mismatch" | "idle";

const matchBorder: Record<MatchState, string> = {
  match: "border-[#7ee0b5] focus:border-[#7ee0b5]",
  mismatch: "border-[#ffc46b] focus:border-[#ffc46b]",
  idle: inputNeutral,
};

/* ---------- Small components ---------- */

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-white">
        {label}
      </label>
      {children}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  state = "idle",
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  autoComplete: string;
  disabled?: boolean;
  state?: MatchState;
  describedBy?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={state === "mismatch" || undefined}
        className={`${inputBase} ${matchBorder[state]} pr-14`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/90 hover:bg-white/15 ${focusRing}`}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

/* ---------- Page ---------- */

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

  const router = useRouter();

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const passwordsDoNotMatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  const matchState: MatchState = passwordsDoNotMatch
    ? "mismatch"
    : passwordsMatch
    ? "match"
    : "idle";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));

    setError("");
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
              Create
              <br />
              an account
            </h1>
          </div>
        </section>

        {/* FORM CARD */}
        <section className="pl-rise pl-d3 w-full max-w-md md:max-w-lg">
          <div className={`${glass} p-6 md:p-10`}>
            <h2 className="mb-6 text-2xl font-bold text-white">Get started</h2>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {error && (
                <div
                  role="alert"
                  className="pl-pop flex items-start gap-3 rounded-2xl border-2 border-[#ffc46b] bg-[#5c0f2e] p-4"
                >
                  <span className="mt-0.5 shrink-0 text-[#ffc46b]">
                    <AlertTriangle size={18} />
                  </span>
                  <p className="text-sm font-semibold text-white">{error}</p>
                </div>
              )}

              {/* FIRST + LAST NAME */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4">
                <Field id="firstName" label="First name">
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Your first name"
                    disabled={isLoading}
                    className={`${inputBase} ${inputNeutral}`}
                  />
                </Field>

                <Field id="lastName" label="Last name">
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Your last name"
                    disabled={isLoading}
                    className={`${inputBase} ${inputNeutral}`}
                  />
                </Field>
              </div>

              {/* EMAIL */}
              <Field id="email" label="Email">
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="user@example.com"
                  disabled={isLoading}
                  className={`${inputBase} ${inputNeutral}`}
                />
              </Field>

              {/* PASSWORD */}
              <Field id="password" label="Password">
                <PasswordInput
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  disabled={isLoading}
                  state={matchState}
                />
              </Field>

              {/* CONFIRM PASSWORD */}
              <Field id="confirmPassword" label="Confirm password">
                <PasswordInput
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  state={matchState}
                  describedBy="confirm-status"
                />

                <div id="confirm-status" className="min-h-[1.25rem] px-2 pt-1.5" aria-live="polite">
                  {passwordsDoNotMatch && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#ffc46b]">
                      <AlertTriangle size={14} />
                      Passwords don&apos;t match
                    </p>
                  )}
                  {passwordsMatch && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#7ee0b5]">
                      <Check size={14} />
                      Passwords match
                    </p>
                  )}
                </div>
              </Field>

              {/* SUBMIT */}
              <div className="space-y-5 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || passwordsDoNotMatch}
                  className={primaryButton}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="h-5 w-5 animate-spin rounded-full border-2 border-[#8a1a42]/30 border-t-[#8a1a42]"
                        aria-hidden
                      />
                      Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>

                <p className="text-center text-sm text-white/90">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className={`rounded font-bold text-white underline underline-offset-4 ${focusRing}`}
                  >
                    Log in
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