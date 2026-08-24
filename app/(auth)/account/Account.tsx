"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  User,
  Pencil,
  LockKeyhole,
  Eye,
  EyeOff,
  LogOut,
  Send,
  Trash2,
  X,
} from "lucide-react";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "RETURNS", href: "/returns" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-1.5 " +
  "[&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:bg-white/20 " +
  "[&::-webkit-scrollbar-thumb]:rounded-full";

export default function AccountPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [deactivateError, setDeactivateError] = useState("");
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  const [locker, setLocker] = useState<any>(null);
  const [lockerLoading, setLockerLoading] = useState(true);
  const [showChangePinCard, setShowChangePinCard] = useState(false);

  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showOldPin, setShowOldPin] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [currentPin, setCurrentPin] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [updatingPin, setUpdatingPin] = useState(false);
  const [step, setStep] = useState(1);

  const isLockedOut =
    locker && (locker.pin === null || locker.pin === undefined);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token")!;
      const response = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      setUser(data.user);

      if (data.user) {
        setEditFirstName(data.user.firstName);
        setEditLastName(data.user.lastName);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocker = async () => {
    try {
      setLockerLoading(true);
      const token = localStorage.getItem("token")!;
      const response = await fetch("/api/locker", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch locker");

      const data = await response.json();
      setLocker(data.length > 0 ? data[0] : null);
    } catch (err: any) {
      console.error("Locker fetch error:", err);
      setLocker(null);
    } finally {
      setLockerLoading(false);
    }
  };

  const formatPinDisplay = (pin: string | number | null | undefined) => {
    if (!pin) return "••••";
    return pin.toString().padStart(4, "0");
  };

  const handleVerifyCurrentPin = () => {
    if (currentPin !== locker?.pin) {
      alert("Current PIN is incorrect");
      return;
    }
    setStep(2);
  };

  const handleSendVerificationCode = async () => {
    try {
      setUpdatingPin(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/users/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send code");
      }

      setCodeSent(true);
      alert("Verification code sent to your email!");
    } catch (err: any) {
      alert(err.message || "Failed to send verification code");
    } finally {
      setUpdatingPin(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setUpdatingPin(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/users/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid code");
      }

      setStep(3);
    } catch (err: any) {
      alert(err.message || "Invalid verification code");
    } finally {
      setUpdatingPin(false);
    }
  };

  const handleResendCode = () => {
    setVerificationCode("");
    handleSendVerificationCode();
  };

  const handleUpdatePin = async () => {
    if (
      newPin.length !== 4 ||
      confirmPin.length !== 4 ||
      newPin !== confirmPin
    ) {
      alert("Please enter matching 4-digit PINs");
      return;
    }

    try {
      setUpdatingPin(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/locker", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: locker?._id,
          pin: newPin,
          pinChanged: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update PIN");
      }

      const data = await response.json();
      setLocker(data);
      resetPinFlow();
      alert("PIN updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update PIN");
    } finally {
      setUpdatingPin(false);
    }
  };

  const resetPinFlow = () => {
    setShowChangePinCard(false);
    setStep(1);
    setCurrentPin("");
    setVerificationCode("");
    setNewPin("");
    setConfirmPin("");
    setCodeSent(false);
    setShowOldPin(false);
    setShowCode(false);
    setShowNewPin(false);
    setShowConfirmPin(false);
  };

  const handleEditProfile = () => setEditingProfile(true);

  const handleCancelEdit = () => {
    setEditingProfile(false);
    if (user) {
      setEditFirstName(user.firstName);
      setEditLastName(user.lastName);
    }
  };

  const handleSaveProfile = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      alert("First name and last name are required");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update profile");
      }

      const data = await response.json();
      setUser(data.user);
      setEditingProfile(false);
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert("Password required");
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete account");
      }

      alert("Account deleted successfully. You will be logged out.");
      setShowDeleteConfirm(false);
      setDeletePassword("");
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!deactivatePassword) {
      alert("Password required");
      return;
    }

    try {
      setDeactivating(true);
      setDeactivateError("");

      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deactivatePassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }

      alert("Account deactivated for 30 days");
      setShowDeactivateConfirm(false);
      setDeactivatePassword("");
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err: any) {
      setDeactivateError(err.message || "Failed");
    } finally {
      setDeactivating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  useEffect(() => {
    if (!lockerLoading && locker) {
      setStep(isLockedOut ? 2 : 1);
    }
  }, [lockerLoading, locker, isLockedOut]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");

    if (!token) {
      setIsAuthenticated(false);
      window.location.href = "/login";
      return;
    }

    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated === true) {
      Promise.all([fetchUserProfile(), fetchLocker()]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!showChangePinCard) {
      setStep(isLockedOut ? 2 : 1);
      setCurrentPin("");
      setVerificationCode("");
      setNewPin("");
      setConfirmPin("");
      setCodeSent(false);
    }
  }, [showChangePinCard, isLockedOut]);

  if (isAuthenticated === null) {
    return (
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] flex items-center justify-center">
        <div className="text-white text-xl font-black uppercase tracking-widest animate-pulse">
          Checking authentication...
        </div>
      </main>
    );
  }

  if (isAuthenticated === false || loading) {
    return (
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] flex items-center justify-center"> 
        <div className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/30 border-t-white" />
      </main>
    );
  }

  return (
    <>
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden">
        <style jsx global>{`
          @keyframes pageReveal {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes contentSlideUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          main {
            animation: pageReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          header, section, .account-card {
            animation: contentSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          header a, button {
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          header a:hover, button:hover {
            filter: brightness(1.03);
          }
          button:active {
            transform: scale(0.98);
          }
        `}</style>

        <div className="mx-auto flex h-full w-full flex-col gap-4">

          {/* HEADER */}
          <header className="relative z-[100] shrink-0 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-xl border border-white/30 shadow-lg">
            <div className="flex items-center justify-between">
              <Link
                href="/home"
                className="transition-transform duration-300 hover:scale-105"
              >
                <Image
                  src="/padalock-logo.png"
                  alt="PadaLock logo"
                  width={200}
                  height={50}
                  className="w-28 md:w-40"
                  priority
                />
              </Link>

              <nav className="hidden lg:flex gap-8 text-white font-bold">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative group transition-all duration-300 ${
                      item.href === "/account"
                        ? "text-white"
                        : "text-white/80"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all duration-300 ${
                        item.href === "/account"
                          ? "w-full"
                          : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                ))}
              </nav>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden relative z-[110] p-2 focus:outline-none"
                aria-label="Toggle Menu"
              >
                <div className="flex flex-col justify-between w-6 h-4">
                  <span
                    className={`h-0.5 w-full bg-white rounded-full transition-all origin-left ${
                      isMenuOpen ? "rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`h-0.5 w-full bg-white rounded-full transition-all ${
                      isMenuOpen ? "opacity-0" : ""
                    }`}
                  />
                  <span
                    className={`h-0.5 w-full bg-white rounded-full transition-all origin-left ${
                      isMenuOpen ? "-rotate-45" : ""
                    }`}
                  />
                </div>
              </button>
            </div>

            <div
              className={`absolute left-0 right-0 top-full mt-3 px-2 transition-all duration-300 lg:hidden ${
                isMenuOpen
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-4 pointer-events-none"
              }`}
            >
              <nav className="flex flex-col overflow-hidden rounded-2xl bg-white/95 backdrop-blur-2xl p-2 shadow-2xl border border-white/40">
                {navItems.map((item, idx) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    style={{ transitionDelay: `${idx * 50}ms` }}
                    className={`p-4 text-[#df4473] font-bold hover:bg-pink-50 rounded-xl transition-all duration-200 ${
                      isMenuOpen ? "translate-x-0" : "-translate-x-4"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {/* MAIN */}
          <section
            className={`flex-1 rounded-[2.5rem] bg-black/5 backdrop-blur-md border border-white/20 p-6 md:p-10 shadow-inner overflow-y-auto ${scrollbarClass}`}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black text-white/80 uppercase tracking-[0.3em]">
                Account Settings
              </h2>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 border border-white/10"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>

            <div className="flex flex-col gap-6 w-full">

              {/* PROFILE */}
              <div className="account-card group rounded-3xl bg-white/15 p-6 border border-white/10 shadow-lg hover:bg-white/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl text-white group-hover:scale-110">
                      <User size={20} />
                    </div>
                    <h3 className="font-bold text-white uppercase tracking-wider">
                      Profile Info
                    </h3>
                  </div>

                  {!editingProfile ? (
                    <button
                      onClick={handleEditProfile}
                      className="text-xs font-black text-white/60 hover:text-white uppercase tracking-widest"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="text-xs font-black text-white/60 hover:text-white uppercase tracking-widest disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-white text-[#df4473] text-xs font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}
                </div>

                {error ? (
                  <div className="rounded-2xl bg-red-500/10 border border-red-400/20 p-5 text-center text-red-100">
                    <p className="font-semibold mb-3">{error}</p>
                    <button
                      onClick={fetchUserProfile}
                      className="px-5 py-2 rounded-xl bg-red-500 text-white font-bold"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-2 block">
                        First Name
                      </label>
                      <input
                        disabled={!editingProfile}
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="w-full h-12 rounded-2xl bg-white/10 border border-white/20 px-4 text-white outline-none focus:bg-white/20 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-2 block">
                        Last Name
                      </label>
                      <input
                        disabled={!editingProfile}
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="w-full h-12 rounded-2xl bg-white/10 border border-white/20 px-4 text-white outline-none focus:bg-white/20 disabled:opacity-50"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-2 block">
                        Email Address
                      </label>
                      <div className="w-full min-h-12 flex items-center rounded-2xl bg-white/5 border border-white/5 px-4 py-3 text-white/60 text-sm break-all">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* LOCKER PIN */}
              <div className="account-card rounded-3xl bg-white/15 p-6 border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl text-white">
                      <LockKeyhole size={20} />
                    </div>
                    <h3 className="font-bold text-white uppercase tracking-wider">
                      Security
                    </h3>
                  </div>

                  {showChangePinCard && (
                    <button
                      onClick={resetPinFlow}
                      className="text-white/50 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                {!showChangePinCard ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-black/20 border border-white/5">
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                        Locker PIN
                      </p>
                      <p className="text-xl font-bold text-white tracking-[0.3em]">
                        {locker?.pin
                          ? showCurrentPin
                            ? formatPinDisplay(locker.pin)
                            : "••••"
                          : "••••"}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowChangePinCard(true)}
                      disabled={lockerLoading}
                      className="px-8 py-3.5 rounded-xl bg-[#df4473] text-white text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 disabled:opacity-50"
                    >
                      Update PIN
                    </button>
                  </div>
                ) : locker ? (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex gap-2 mb-8">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            step >= s
                              ? "bg-[#df4473]"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="max-w-2xl mx-auto space-y-6">

                      {!isLockedOut && (
                        <div className={`${step !== 1 ? "opacity-50" : ""}`}>
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                            Enter Current PIN
                          </label>

                          <div className="relative mt-2">
                            <input
                              type={showOldPin ? "text" : "password"}
                              maxLength={4}
                              value={currentPin}
                              onChange={(e) => setCurrentPin(e.target.value)}
                              placeholder="••••"
                              disabled={step !== 1}
                              className="w-full h-14 rounded-2xl bg-white/10 border border-white/20 px-5 pr-14 text-white text-center text-2xl tracking-[0.5em] outline-none focus:bg-white/20 disabled:opacity-50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPin((v) => !v)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                            >
                              {showOldPin ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>

                          {step === 1 && (
                            <button
                              onClick={handleVerifyCurrentPin}
                              disabled={currentPin.length !== 4 || updatingPin}
                              className="w-full mt-3 h-12 rounded-2xl bg-[#df4473] text-white font-black uppercase tracking-widest disabled:opacity-50"
                            >
                              Verify PIN
                            </button>
                          )}
                        </div>
                      )}

                      <div className={`${step !== 2 ? "opacity-50" : ""}`}>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                          {codeSent
                            ? "Verification Code"
                            : "Email Verification"}
                        </label>

                        <div className="relative mt-2">
                          <input
                            type={showCode ? "text" : "password"}
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder={
                              codeSent ? "Enter 6-digit code" : "Send code first"
                            }
                            disabled={step !== 2}
                            className="w-full h-14 rounded-2xl bg-white/10 border border-white/20 px-5 pr-14 text-white text-center text-xl tracking-widest outline-none focus:bg-white/20 disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCode((v) => !v)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                          >
                            {showCode ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {!codeSent ? (
                            <button
                              onClick={handleSendVerificationCode}
                              disabled={updatingPin || step !== 2}
                              className="h-12 rounded-2xl bg-[#df4473] text-white font-black uppercase tracking-widest disabled:opacity-50"
                            >
                              <Send size={16} className="inline mr-2" />
                              Send Code
                            </button>
                          ) : (
                            <button
                              onClick={handleVerifyCode}
                              disabled={
                                verificationCode.length !== 6 ||
                                updatingPin ||
                                step !== 2
                              }
                              className="h-12 rounded-2xl bg-[#df4473] text-white font-black uppercase tracking-widest disabled:opacity-50"
                            >
                              Verify Code
                            </button>
                          )}

                          {codeSent && (
                            <button
                              onClick={handleResendCode}
                              disabled={updatingPin}
                              className="h-12 rounded-2xl border border-white/30 bg-white/10 text-white font-black uppercase tracking-widest disabled:opacity-50"
                            >
                              Resend
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={`${step !== 3 ? "opacity-50" : ""}`}>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                          New 4-Digit PIN
                        </label>

                        <div className="relative mt-2">
                          <input
                            type={showNewPin ? "text" : "password"}
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            placeholder="••••"
                            disabled={step !== 3}
                            className="w-full h-14 rounded-2xl bg-white/10 border border-white/20 px-5 pr-14 text-white text-center text-2xl tracking-[0.5em] outline-none focus:bg-white/20 disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPin((v) => !v)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                          >
                            {showNewPin ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>

                        {step === 3 && (
                          <button
                            onClick={() => setStep(4)}
                            disabled={newPin.length !== 4}
                            className="w-full mt-3 h-12 rounded-2xl bg-[#df4473] text-white font-black uppercase tracking-widest disabled:opacity-50"
                          >
                            Next
                          </button>
                        )}
                      </div>

                      <div className={`${step !== 4 ? "opacity-50" : ""}`}>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                          Confirm New PIN
                        </label>

                        <div className="relative mt-2">
                          <input
                            type={showConfirmPin ? "text" : "password"}
                            maxLength={4}
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            placeholder="••••"
                            disabled={step !== 4}
                            className="w-full h-14 rounded-2xl bg-white/10 border border-white/20 px-5 pr-14 text-white text-center text-2xl tracking-[0.5em] outline-none focus:bg-white/20 disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPin((v) => !v)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                          >
                            {showConfirmPin ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>

                        {step === 4 && (
                          <>
                            <button
                              onClick={handleUpdatePin}
                              disabled={
                                newPin.length !== 4 ||
                                confirmPin.length !== 4 ||
                                newPin !== confirmPin ||
                                updatingPin
                              }
                              className="w-full mt-3 h-12 rounded-2xl bg-[#df4473] text-white font-black uppercase tracking-widest disabled:opacity-50"
                            >
                              {updatingPin ? "Updating PIN..." : "Save New PIN"}
                            </button>

                            {newPin.length === 4 &&
                              confirmPin.length === 4 &&
                              newPin !== confirmPin && (
                                <p className="text-red-300 text-xs font-bold text-center mt-2">
                                  PINs do not match
                                </p>
                              )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-black/20 text-center text-white/60">
                    No locker assigned.
                  </div>
                )}
              </div>

              {/* DEACTIVATION */}
              <div className="account-card rounded-3xl bg-[#f5d68a]/20 p-6 border border-yellow-200/20 hover:bg-[#f5d68a]/25">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/15 rounded-xl text-yellow-100">
                    <LockKeyhole size={20} />
                  </div>
                  <h3 className="font-bold text-white uppercase tracking-wider">
                    Account Deactivation
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-black/15 border border-white/5">
                  <div>
                    <p className="font-bold text-white">
                      Deactivate Account
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      Your account will be disabled for 30 days.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowDeactivateConfirm(true)}
                    className="px-6 py-3 rounded-xl bg-[#b7791f] text-white text-xs font-black uppercase tracking-widest"
                  >
                    Deactivate
                  </button>
                </div>
              </div>

              {/* DELETION */}
              <div className="account-card rounded-3xl bg-red-500/5 p-6 border border-red-400/20 hover:bg-red-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/50 rounded-xl text-red-300">
                    <Trash2 size={20} />
                  </div>
                  <h3 className="font-bold text-white uppercase tracking-wider">
                    Account Deletion
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-black/15 border border-white/5">
                  <div>
                    <p className="font-bold text-white">
                      Delete Account
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                    Permanently delete your account and associated data.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-11 py-3 rounded-xl bg-red-500/75 text-white text-xs font-black uppercase tracking-widest"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* DELETE MODAL */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl"
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          />

          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-[2.5rem] bg-[#f4eff1] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#df4473] uppercase">
                      Final Confirmation
                    </h3>
                    <p className="text-sm text-red-500/70">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="text-red-500"
                >
                  <X />
                </button>
              </div>

              <div className="space-y-5">
                <p className="text-gray-700">
                  Are you absolutely sure you want to delete your PadaLock
                  account? This action cannot be undone.
                </p>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={deleting}
                    className="w-full h-14 rounded-2xl bg-white border-2 border-gray-200 px-5 text-gray-800 outline-none focus:border-red-500"
                  />
                  {deleteError && (
                    <p className="mt-2 text-sm text-red-500 font-semibold">
                      {deleteError}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword("");
                    }}
                    disabled={deleting}
                    className="flex-1 h-14 rounded-2xl border-2 border-red-500 text-red-500 font-black uppercase text-xs tracking-widest"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || !deletePassword}
                    className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-black uppercase text-xs tracking-widest disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Yes, Delete My Account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DEACTIVATE MODAL */}
      {showDeactivateConfirm && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl"
            onClick={() => !deactivating && setShowDeactivateConfirm(false)}
          />

          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-[2.5rem] bg-[#f4eff1] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-[#b7791f]">
                    <LockKeyhole size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#b7791f] uppercase">
                      Deactivate Account
                    </h3>
                    <p className="text-sm text-[#b7791f]/70">
                      This action is temporary
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDeactivateConfirm(false)}
                  disabled={deactivating}
                  className="text-[#b7791f]"
                >
                  <X />
                </button>
              </div>

              <div className="space-y-5">
                <p className="text-gray-700">
                  Your account will be disabled for 30 days. You can restore
                  it by logging in.
                </p>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deactivatePassword}
                    onChange={(e) => setDeactivatePassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={deactivating}
                    className="w-full h-14 rounded-2xl bg-white border-2 border-gray-200 px-5 text-gray-800 outline-none focus:border-[#b7791f]"
                  />
                  {deactivateError && (
                    <p className="mt-2 text-sm text-red-500 font-semibold">
                      {deactivateError}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowDeactivateConfirm(false);
                      setDeactivatePassword("");
                    }}
                    disabled={deactivating}
                    className="flex-1 h-14 rounded-2xl border-2 border-[#b7791f] text-[#b7791f] font-black uppercase text-xs tracking-widest"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleDeactivateAccount}
                    disabled={deactivating || !deactivatePassword}
                    className="flex-1 h-14 rounded-2xl bg-[#b7791f] text-white font-black uppercase text-xs tracking-widest disabled:opacity-50"
                  >
                    {deactivating ? "Processing..." : "Deactivate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}