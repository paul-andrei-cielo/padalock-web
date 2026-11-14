"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogOut,
  Pencil,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";

/* ---------- Types ---------- */

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

type Toast = { type: "success" | "error"; text: string } | null;

/* ---------- Constants ---------- */

const navItems = [
  { label: "Parcels", href: "/register" },
  { label: "Activity", href: "/activity" },
  { label: "Notifications", href: "/notifications" },
  { label: "Account", href: "/account" },
];

const glass =
  "relative rounded-[2rem] border border-white/35 bg-[#a82452]/60 backdrop-blur-xl " +
  "shadow-[0_8px_32px_rgba(120,20,55,0.25),inset_0_1px_0_rgba(255,255,255,0.25)]";

const glassInner =
  "rounded-3xl border border-white/20 bg-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8789b]";

const inputClass =
  "w-full h-12 rounded-full border border-white/35 bg-white/15 px-4 text-white placeholder:text-white/60 " +
  "outline-none transition focus:border-white/70 focus:bg-white/25 disabled:opacity-60";

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full";

const pageBg =
  "bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.28),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.35),transparent_50%),linear-gradient(180deg,#df4473_0%,#e8789b_50%,#ee94ae_100%)]";

const pillButton = `flex h-10 items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const primaryButton = `flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#8a1a42] shadow-md transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

const digits = (s: string, max: number) => s.replace(/\D/g, "").slice(0, max);

/* ---------- Modal motion ---------- */

const ENTER_MS = 460;
const EXIT_MS = 280;
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN = "cubic-bezier(0.5, 0, 0.9, 0.4)";

type ModalMotion = {
  /** Current on-screen rect of the button that opened the modal (null if gone). */
  getOrigin: () => DOMRect | null;
  closing: boolean;
  onExited: () => void;
};

const ModalMotionContext = createContext<ModalMotion>({
  getOrigin: () => null,
  closing: false,
  onExited: () => {},
});

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A transform that makes the panel sit on top of the origin button. */
function transformFromOrigin(panel: HTMLElement, backdrop: HTMLElement, origin: DOMRect | null) {
  if (!origin) return "translateY(10px) scale(0.96)"; // fallback: simple pop

  // The panel is centered in the fixed backdrop, so use the backdrop's center.
  // offsetWidth/Height ignore transforms, so this is safe mid-animation.
  const b = backdrop.getBoundingClientRect();
  const dx = origin.left + origin.width / 2 - (b.left + b.width / 2);
  const dy = origin.top + origin.height / 2 - (b.top + b.height / 2);
  const scale = Math.min(Math.max(origin.width / panel.offsetWidth, 0.15), 0.9);
  return `translate(${dx}px, ${dy}px) scale(${scale})`;
}

/* ---------- Small components ---------- */

function CardHeader({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6b0f33]/55 text-white">
          {icon}
        </span>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ModalShell({
  labelledBy,
  onClose,
  locked,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  locked?: boolean;
  children: React.ReactNode;
}) {
  const { getOrigin, closing, onExited } = useContext(ModalMotionContext);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape key + scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, locked]);

  // Initial focus (mount only, so it doesn't steal focus when `locked` changes)
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  // ENTER: grow out of the clicked button
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop || prefersReducedMotion()) return;

    const from = transformFromOrigin(panel, backdrop, getOrigin());
    const move = panel.animate([{ transform: from }, { transform: "none" }], {
      duration: ENTER_MS,
      easing: EASE_OUT,
      fill: "backwards",
    });
    const fade = panel.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: ENTER_MS * 0.45,
      easing: "ease-out",
      fill: "backwards",
    });
    return () => {
      move.cancel();
      fade.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // EXIT: shrink back into the button, then tell the page to unmount us
  useEffect(() => {
    if (!closing) return;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop || prefersReducedMotion()) {
      onExited();
      return;
    }

    const to = transformFromOrigin(panel, backdrop, getOrigin());
    const move = panel.animate([{ transform: "none" }, { transform: to }], {
      duration: EXIT_MS,
      easing: EASE_IN,
      fill: "forwards",
    });
    panel.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: EXIT_MS * 0.7,
      delay: EXIT_MS * 0.3,
      easing: "ease-in",
      fill: "both",
    });
    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: EXIT_MS,
      easing: "ease-out",
      fill: "forwards",
    });

    move.finished.then(onExited).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  return (
    <div
      ref={backdropRef}
      className={`pl-backdrop fixed inset-0 z-[200] flex items-center justify-center bg-[#5c0f2e]/50 p-4 backdrop-blur-sm ${
        closing ? "pointer-events-none" : ""
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !locked && !closing) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-white/35 bg-[#7a1a3d]/90 p-6 shadow-2xl outline-none backdrop-blur-2xl"
      >
        <div className="pl-modal-body">{children}</div>
      </div>
    </div>
  );
}

function SecretField({
  id,
  label,
  value,
  onChange,
  placeholder,
  center,
  inputMode,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  center?: boolean;
  inputMode?: "numeric" | "text";
  autoComplete?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-white">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          inputMode={inputMode}
          autoComplete={autoComplete ?? "off"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClass} pr-12 ${
            center ? "text-center text-xl font-bold tracking-[0.4em]" : ""
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/90 hover:bg-white/15 ${focusRing}`}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-white/30 bg-[#5c0f2e]/70 p-3 text-sm font-medium text-white"
    >
      {children}
    </div>
  );
}

/* ---------- Confirm with password (deactivate / delete) ---------- */

function ConfirmPasswordModal({
  tone,
  icon,
  title,
  subtitle,
  description,
  confirmLabel,
  busyLabel,
  onClose,
  onConfirm,
}: {
  tone: "amber" | "danger";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<string | null>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return setErr("Enter your password to continue.");
    setBusy(true);
    setErr("");
    const problem = await onConfirm(password);
    // On success the page redirects, so only reset on failure.
    if (problem) {
      setBusy(false);
      setErr(problem);
    }
  };

  return (
    <ModalShell labelledBy="confirm-title" onClose={onClose} locked={busy}>
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                tone === "amber"
                  ? "bg-[#ffc46b] text-[#5c2e00]"
                  : "bg-[#5c0f2e] text-[#ffc46b] border border-white/30"
              }`}
            >
              {icon}
            </span>
            <div>
              <h2 id="confirm-title" className="text-xl font-bold text-white">
                {title}
              </h2>
              <p className="text-sm text-white/90">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white hover:bg-white/25 disabled:opacity-60 ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-white">{description}</p>

        <SecretField
          id="confirm-password"
          label="Enter your password to confirm"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={busy}
        />

        {err && <ErrorNote>{err}</ErrorNote>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={pillButton + " justify-center"}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !password}
            className={`flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
              tone === "amber"
                ? "bg-[#ffc46b] text-[#5c2e00] hover:bg-[#ffd08a]"
                : "border border-white/40 bg-[#5c0f2e] text-white hover:bg-[#4a0b25]"
            }`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------- Change PIN (one step at a time) ---------- */

type PinStep = "current" | "email" | "new";

function PinModal({
  locker,
  isLockedOut,
  onClose,
  onUpdated,
}: {
  locker: any;
  isLockedOut: boolean;
  onClose: () => void;
  onUpdated: (locker: any) => void;
}) {
  // If the locker was locked out, the current PIN isn't required.
  const steps: PinStep[] = isLockedOut ? ["email", "new"] : ["current", "email", "new"];
  const [idx, setIdx] = useState(0);
  const step = steps[idx];

  const [currentPin, setCurrentPin] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const next = () => {
    setErr("");
    setInfo("");
    setIdx((i) => Math.min(i + 1, steps.length - 1));
  };

  const verifyCurrent = () => {
    if (currentPin !== String(locker?.pin)) {
      setErr("That PIN isn't correct.");
      return;
    }
    next();
  };

  const sendCode = async () => {
    try {
      setBusy(true);
      setErr("");
      const res = await fetch("/api/users/send-code", { method: "POST", headers: authHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't send the code.");
      }
      setCodeSent(true);
      setCode("");
      setCooldown(30);
      setInfo("We emailed you a verification code.");
    } catch (e: any) {
      setErr(e.message || "Couldn't send the code.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    try {
      setBusy(true);
      setErr("");
      const res = await fetch("/api/users/verify-code", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "That code isn't valid.");
      }
      next();
    } catch (e: any) {
      setErr(e.message || "That code isn't valid.");
    } finally {
      setBusy(false);
    }
  };

  const savePin = async () => {
    if (newPin.length !== 4 || confirmPin.length !== 4) return setErr("Enter a 4-digit PIN in both fields.");
    if (newPin !== confirmPin) return setErr("The PINs don't match.");
    try {
      setBusy(true);
      setErr("");
      const res = await fetch("/api/locker", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ id: locker?._id, pin: newPin, pinChanged: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't update your PIN.");
      }
      onUpdated(await res.json());
    } catch (e: any) {
      setErr(e.message || "Couldn't update your PIN.");
      setBusy(false);
    }
  };

  const mismatch = newPin.length === 4 && confirmPin.length === 4 && newPin !== confirmPin;

  return (
    <ModalShell labelledBy="pin-title" onClose={onClose} locked={busy}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6b0f33]/55 text-white">
              <KeyRound size={22} />
            </span>
            <div>
              <h2 id="pin-title" className="text-xl font-bold text-white">
                {isLockedOut ? "Reset locker PIN" : "Change locker PIN"}
              </h2>
              <p className="text-sm text-white/90">
                Step {idx + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white hover:bg-white/25 disabled:opacity-60 ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2" aria-hidden>
          {steps.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= idx ? "bg-white" : "bg-white/25"
              }`}
            />
          ))}
        </div>

        {step === "current" && (
          <div className="pl-fade space-y-4">
            <p className="text-sm text-white">First, confirm your current PIN.</p>
            <SecretField
              id="pin-current"
              label="Current PIN"
              value={currentPin}
              onChange={(v) => setCurrentPin(digits(v, 4))}
              placeholder="••••"
              inputMode="numeric"
              center
            />
            <button
              type="button"
              onClick={verifyCurrent}
              disabled={currentPin.length !== 4}
              className={`${primaryButton} w-full`}
            >
              Continue
            </button>
          </div>
        )}

        {step === "email" && (
          <div className="pl-fade space-y-4">
            <p className="text-sm text-white">
              {codeSent
                ? "Enter the 6-digit code we emailed you."
                : "We'll email you a code to confirm it's really you."}
            </p>

            {codeSent ? (
              <>
                <SecretField
                  id="pin-code"
                  label="Verification code"
                  value={code}
                  onChange={(v) => setCode(digits(v, 6))}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  center
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={verifyCode}
                    disabled={code.length !== 6 || busy}
                    className={`${primaryButton} flex-1`}
                  >
                    {busy ? "Checking…" : "Verify code"}
                  </button>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={busy || cooldown > 0}
                    className={`${pillButton} h-11 flex-1 justify-center`}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </>
            ) : (
              <button type="button" onClick={sendCode} disabled={busy} className={`${primaryButton} w-full`}>
                <Send size={16} />
                {busy ? "Sending…" : "Send code"}
              </button>
            )}
          </div>
        )}

        {step === "new" && (
          <div className="pl-fade space-y-4">
            <p className="text-sm text-white">Choose a new 4-digit PIN for your locker.</p>
            <SecretField
              id="pin-new"
              label="New PIN"
              value={newPin}
              onChange={(v) => setNewPin(digits(v, 4))}
              placeholder="••••"
              inputMode="numeric"
              center
            />
            <SecretField
              id="pin-confirm"
              label="Confirm new PIN"
              value={confirmPin}
              onChange={(v) => setConfirmPin(digits(v, 4))}
              placeholder="••••"
              inputMode="numeric"
              center
            />
            {mismatch && <p className="text-sm font-semibold text-[#ffc46b]">The PINs don&apos;t match.</p>}
            <button
              type="button"
              onClick={savePin}
              disabled={busy || newPin.length !== 4 || confirmPin.length !== 4 || mismatch}
              className={`${primaryButton} w-full`}
            >
              {busy ? "Saving…" : "Save new PIN"}
            </button>
          </div>
        )}

        {info && !err && (
          <p role="status" className="text-sm font-semibold text-white">
            {info}
          </p>
        )}
        {err && <ErrorNote>{err}</ErrorNote>}
      </div>
    </ModalShell>
  );
}

/* ---------- Page ---------- */

export default function AccountPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [locker, setLocker] = useState<any>(null);
  const [lockerLoading, setLockerLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [modal, setModal] = useState<null | "pin" | "deactivate" | "delete">(null);
  const [closing, setClosing] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLockedOut = !!locker && (locker.pin === null || locker.pin === undefined);

  const showToast = useCallback((next: Toast) => {
    setToast(next);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const authHeaders = (json = false): HeadersInit => {
    const token = localStorage.getItem("token");
    return json
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      : { Authorization: `Bearer ${token}` };
  };

  /* ----- Modal open / close ----- */

  const openModal = (kind: "pin" | "deactivate" | "delete", e: React.MouseEvent<HTMLElement>) => {
    triggerRef.current = e.currentTarget; // remember which button opened it
    setClosing(false);
    setModal(kind);
  };

  const requestClose = useCallback(() => setClosing(true), []);

  const finishClose = useCallback(() => {
    setModal(null);
    setClosing(false);
    triggerRef.current?.focus({ preventScroll: true }); // give focus back to the button
  }, []);

  const getOrigin = useCallback(() => {
    const el = triggerRef.current;
    return el && el.isConnected ? el.getBoundingClientRect() : null;
  }, []);

  const motion = useMemo(
    () => ({ getOrigin, closing, onExited: finishClose }),
    [getOrigin, closing, finishClose]
  );

  /* ----- Data ----- */

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users/profile", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser(data.user);
      if (data.user) {
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);
      }
      setError("");
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLocker = useCallback(async () => {
    try {
      setLockerLoading(true);
      const res = await fetch("/api/locker", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch locker");
      const data = await res.json();
      setLocker(Array.isArray(data) && data.length > 0 ? data[0] : null);
    } catch (err) {
      console.error("Locker fetch error:", err);
      setLocker(null);
    } finally {
      setLockerLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      window.location.href = "/login";
      return;
    }
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated === true) Promise.all([fetchUserProfile(), fetchLocker()]);
  }, [isAuthenticated, fetchUserProfile, fetchLocker]);

  /* ----- Actions ----- */

  const cancelEdit = () => {
    setEditing(false);
    setProfileError("");
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  };

  const saveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileError("First name and last name are required.");
      return;
    }
    try {
      setSaving(true);
      setProfileError("");
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: authHeaders(true),
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update profile");
      }
      const data = await res.json();
      setUser(data.user);
      setEditing(false);
      showToast({ type: "success", text: "Profile updated." });
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const signOutAndLeave = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const deleteAccount = async (password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/users/profile", {
        method: "DELETE",
        headers: authHeaders(true),
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete account");
      }
      signOutAndLeave();
      return null;
    } catch (err: any) {
      return err.message || "Failed to delete account";
    }
  };

  const deactivateAccount = async (password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/users/deactivate", {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to deactivate account");
      }
      signOutAndLeave();
      return null;
    } catch (err: any) {
      return err.message || "Failed to deactivate account";
    }
  };

  /* ----- Early states ----- */

  if (isAuthenticated === null) {
    return (
      <main className={`flex h-screen items-center justify-center ${pageBg}`}>
        <p className="animate-pulse text-xl font-extrabold text-white">Checking authentication…</p>
      </main>
    );
  }

  if (isAuthenticated === false || loading) {
    return (
      <main className={`flex h-screen items-center justify-center ${pageBg}`}>
        <div
          role="status"
          aria-label="Loading account"
          className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/30 border-t-white"
        />
      </main>
    );
  }

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() || "?";

  /* ----- Render ----- */

  return (
    <>
      <main
        className={`pl-fade flex min-h-screen flex-col p-4 md:p-6 lg:h-screen lg:overflow-hidden lg:p-8 ${pageBg}`}
      >
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 lg:min-h-0 lg:gap-5">
          {/* HEADER */}
          <header className={`pl-fade ${glass} z-[100] shrink-0 !rounded-2xl px-4 py-3 md:px-6`}>
            <div className="flex items-center justify-between">
              <Link href="/home" className={`rounded-lg ${focusRing}`}>
                <Image
                  src="/padalock-logo.png"
                  alt="Padalock home"
                  width={200}
                  height={50}
                  className="w-28 md:w-40"
                  priority
                />
              </Link>

              <nav className="hidden gap-8 font-semibold text-white lg:flex">
                {navItems.map((item) => {
                  const active = item.href === "/account";
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`group relative rounded py-1 ${focusRing}`}
                    >
                      {item.label}
                      <span
                        className={`absolute -bottom-0.5 left-0 h-0.5 bg-white transition-all duration-300 ${
                          active ? "w-full" : "w-0 group-hover:w-full group-focus-visible:w-full"
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`relative z-[110] rounded-lg p-2 lg:hidden ${focusRing}`}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                <div className="flex h-4 w-6 flex-col justify-between">
                  <span className={`h-0.5 w-full origin-left rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "rotate-45" : ""}`} />
                  <span className={`h-0.5 w-full rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`} />
                  <span className={`h-0.5 w-full origin-left rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "-rotate-45" : ""}`} />
                </div>
              </button>
            </div>

            <div
              className={`absolute left-0 right-0 top-full mt-3 px-2 transition-all duration-300 ease-out lg:hidden ${
                isMenuOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-4 opacity-0"
              }`}
            >
              <nav className="flex flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/95 p-2 shadow-2xl backdrop-blur-2xl">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl p-4 font-semibold text-[#b02a58] transition-colors hover:bg-pink-50"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {/* CONTENT */}
          <section
            className={`pl-fade ${glass} z-0 flex-1 overflow-y-auto p-5 lg:min-h-0 lg:p-6 ${scrollbarClass}`}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">Account</h1>
                <p className="text-sm text-white/90">Your profile, locker PIN and account options.</p>
              </div>
              <button type="button" onClick={signOutAndLeave} className={pillButton}>
                <LogOut size={16} />
                Log out
              </button>
            </div>

            <div className="pl-stagger pl-base-1 grid gap-5 lg:grid-cols-2">
              {/* PROFILE */}
              <div className={`${glassInner} p-5`}>
                <CardHeader icon={<User size={20} />} title="Profile">
                  {user && !editing && (
                    <button type="button" onClick={() => setEditing(true)} className={pillButton}>
                      <Pencil size={14} />
                      Edit
                    </button>
                  )}
                </CardHeader>

                {error || !user ? (
                  <div role="alert" className="space-y-3 rounded-2xl border border-white/30 bg-[#5c0f2e]/70 p-4 text-center">
                    <p className="text-sm font-semibold text-white">{error || "Couldn't load your profile."}</p>
                    <button type="button" onClick={fetchUserProfile} className={`${primaryButton} mx-auto h-10`}>
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-[#8a1a42] shadow-md"
                        aria-hidden
                      >
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="truncate text-sm text-white/90">{user.email}</p>
                      </div>
                    </div>

                    {editing ? (
                      <div className="pl-rise space-y-4 border-t border-white/20 pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="first-name" className="mb-1.5 block text-sm font-semibold text-white">
                              First name
                            </label>
                            <input
                              id="first-name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              disabled={saving}
                              autoComplete="given-name"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label htmlFor="last-name" className="mb-1.5 block text-sm font-semibold text-white">
                              Last name
                            </label>
                            <input
                              id="last-name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              disabled={saving}
                              autoComplete="family-name"
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-white/90">Your email can&apos;t be changed here.</p>
                        {profileError && <ErrorNote>{profileError}</ErrorNote>}
                        <div className="flex justify-end gap-3">
                          <button type="button" onClick={cancelEdit} disabled={saving} className={pillButton}>
                            Cancel
                          </button>
                          <button type="button" onClick={saveProfile} disabled={saving} className={primaryButton}>
                            <Check size={16} />
                            {saving ? "Saving…" : "Save changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <dl className="pl-fade grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                        <div>
                          <dt className="text-xs font-semibold text-white/80">First name</dt>
                          <dd className="text-sm font-semibold text-white">{user.firstName}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold text-white/80">Last name</dt>
                          <dd className="text-sm font-semibold text-white">{user.lastName}</dd>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <dt className="text-xs font-semibold text-white/80">Email</dt>
                          <dd className="break-all text-sm font-semibold text-white">{user.email}</dd>
                        </div>
                      </dl>
                    )}
                  </div>
                )}
              </div>

              {/* LOCKER SECURITY */}
              <div className={`${glassInner} p-5`}>
                <CardHeader icon={<LockKeyhole size={20} />} title="Locker security" />

                {lockerLoading ? (
                  <p className="py-6 text-center text-sm font-semibold text-white">Loading locker…</p>
                ) : !locker ? (
                  <div className="rounded-2xl border border-dashed border-white/40 p-6 text-center">
                    <p className="text-sm font-bold text-white">No locker assigned</p>
                    <p className="mt-1 text-xs text-white/90">Once a locker is linked to your account you can manage its PIN here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isLockedOut && (
                      <div
                        role="alert"
                        className="pl-alert flex items-start gap-3 rounded-2xl border-2 border-[#ffc46b] bg-[#5c0f2e] p-4"
                      >
                        <span className="mt-0.5 text-[#ffc46b]">
                          <AlertTriangle size={20} />
                        </span>
                        <p className="text-sm font-semibold text-white">
                          Your locker PIN needs to be reset.
                          <span className="block font-normal text-white/90">
                            Verify your email to set a new one.
                          </span>
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-4 rounded-2xl border border-white/20 bg-[#6b0f33]/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white/80">
                          Locker PIN{locker.code ? ` · ${locker.code}` : ""}
                        </p>
                        <p className="text-2xl font-bold tracking-[0.4em] text-white" aria-label="PIN hidden">
                          ••••
                        </p>
                      </div>
                      <button type="button" onClick={(e) => openModal("pin", e)} className={primaryButton}>
                        <KeyRound size={16} />
                        {isLockedOut ? "Reset PIN" : "Change PIN"}
                      </button>
                    </div>

                    <p className="text-xs text-white/90">
                      Changing your PIN needs a code we email to you. For your safety the PIN is never shown on screen.
                    </p>
                  </div>
                )}
              </div>

              {/* DANGER ZONE */}
              <div className={`${glassInner} p-5 lg:col-span-2`}>
                <CardHeader
                  icon={<span className="text-[#ffc46b]"><AlertTriangle size={20} /></span>}
                  title="Account options"
                />

                <div className="divide-y divide-white/20 rounded-2xl border border-white/20 bg-[#6b0f33]/30">
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-white">
                        <LockKeyhole size={16} className="text-[#ffc46b]" />
                        Deactivate account
                      </p>
                      <p className="mt-0.5 text-xs text-white/90">
                        Disable your account for 30 days. Log in again to restore it.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => openModal("deactivate", e)}
                      className={`h-11 shrink-0 rounded-full bg-[#ffc46b] px-6 text-sm font-bold text-[#5c2e00] transition hover:bg-[#ffd08a] ${focusRing}`}
                    >
                      Deactivate
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-white">
                        <Trash2 size={16} className="text-[#ffc46b]" />
                        Delete account
                      </p>
                      <p className="mt-0.5 text-xs text-white/90">
                        Permanently delete your account and its data. This can&apos;t be undone.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => openModal("delete", e)}
                      className={`h-11 shrink-0 rounded-full border border-white/40 bg-[#5c0f2e] px-6 text-sm font-bold text-white transition hover:bg-[#4a0b25] ${focusRing}`}
                    >
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* MODALS */}
      <ModalMotionContext.Provider value={motion}>
        {modal === "pin" && locker && (
          <PinModal
            locker={locker}
            isLockedOut={isLockedOut}
            onClose={requestClose}
            onUpdated={(updated) => {
              setLocker(updated);
              requestClose(); // animates back into the button instead of vanishing
              showToast({ type: "success", text: "Locker PIN updated." });
            }}
          />
        )}

        {modal === "deactivate" && (
          <ConfirmPasswordModal
            tone="amber"
            icon={<LockKeyhole size={22} />}
            title="Deactivate account"
            subtitle="This is temporary"
            description="Your account will be disabled for 30 days. You can restore it by logging in."
            confirmLabel="Deactivate"
            busyLabel="Deactivating…"
            onClose={requestClose}
            onConfirm={deactivateAccount}
          />
        )}

        {modal === "delete" && (
          <ConfirmPasswordModal
            tone="danger"
            icon={<Trash2 size={22} />}
            title="Delete account"
            subtitle="This can't be undone"
            description="Your Padalock account and its data will be permanently deleted. Are you sure you want to continue?"
            confirmLabel="Yes, delete my account"
            busyLabel="Deleting…"
            onClose={requestClose}
            onConfirm={deleteAccount}
          />
        )}
      </ModalMotionContext.Provider>

      {/* TOAST */}
      {toast && (
        <div
          role="status"
          className={`pl-toast fixed inset-x-0 bottom-6 z-[300] mx-auto flex w-fit items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-2xl backdrop-blur-xl ${
            toast.type === "success"
              ? "border-white/40 bg-[#7a1a3d]/95 text-white"
              : "border-[#ffc46b] bg-[#5c0f2e] text-white"
          }`}
        >
          {toast.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} className="text-[#ffc46b]" />}
          {toast.text}
        </div>
      )}
    </>
  );
}