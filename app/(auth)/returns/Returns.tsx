"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Return {
  _id: string;
  parcelCount?: number;
  items?: string[];
  itemDescription?: string;
  otp: string | null;
  otpExpiry: string | null;
  status: string;
  createdAt: string;
  pickedUpDate?: string;
}

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "RETURNS", href: "/returns" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

const filterTabs = ["ALL", "PENDING", "OTP_ACTIVE", "PICKED_UP"];

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-[#edd9cb]", text: "text-[#d46800]" },

  READY_FOR_PICKUP: {
    bg: "bg-[#cfe8ec]",
    text: "text-[#1383a3]",
  },

  OTP_ACTIVE: {
    bg: "bg-[#f5d9e8]",
    text: "text-[#df4473]",
  },

  PICKED_UP: {
    bg: "bg-[#b8d8c7]",
    text: "text-[#0d7a43]",
  },

  EXPIRED: {
    bg: "bg-[#e3c4c4]",
    text: "text-[#a33a3a]",
  },

  CANCELLED: {
    bg: "bg-gray-300",
    text: "text-gray-700",
  },
};

const API_BASE = "/api/returns";

export default function ReturnsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    null
  );

  const [returns, setReturns] = useState<Return[]>([]);
  const [parcelCount, setParcelCount] = useState(1);
  const [items, setItems] = useState<string[]>([""]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [otpLoadingId, setOtpLoadingId] = useState<string | null>(null);
  const [expandedOtpId, setExpandedOtpId] = useState<string | null>(null);

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
    if (isAuthenticated === true) {
      fetchReturns();
    }
  }, [isAuthenticated]);

  const fetchReturns = async () => {
    try {
      setDataLoading(true);

      const token = localStorage.getItem("token")!;

      const res = await fetch(API_BASE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch returns");
      }

      const data = await res.json();

      const sortedReturns = Array.isArray(data)
        ? [...data].sort(
            (a: Return, b: Return) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        : [];

      setReturns(sortedReturns);
      setError("");
    } catch (err: any) {
      console.error("Error fetching returns:", err);
      setError(err.message || "Failed to load returns");
      setReturns([]);
    } finally {
      setDataLoading(false);
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      items.length !== parcelCount ||
      items.some((item) => !item.trim())
    ) {
      setError("Please enter a description for every parcel");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token")!;

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parcelCount,
          items: items.map((item) => item.trim()),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create return");
      }

      setParcelCount(1);
      setItems([""]);

      await fetchReturns();
    } catch (err: any) {
      console.error("Error creating return:", err);
      setError(err.message || "Failed to create return");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOtp = async (returnId: string) => {
    try {
      setOtpLoadingId(returnId);

      const token = localStorage.getItem("token")!;

      const res = await fetch(`${API_BASE}/${returnId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "generate_otp",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate OTP");
      }

      await fetchReturns();
      setExpandedOtpId(returnId);
    } catch (err: any) {
      console.error("Error generating OTP:", err);
      setError(err.message || "Failed to generate OTP");
    } finally {
      setOtpLoadingId(null);
    }
  };

  const handleDelete = async (returnId: string, description: string) => {
    if (!confirm(`Delete return for "${description}"?`)) return;

    try {
      const token = localStorage.getItem("token")!;

      const res = await fetch(`${API_BASE}/${returnId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete return");
      }

      await fetchReturns();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete return");
      await fetchReturns();
    }
  };

  const filteredReturns = returns.filter((ret) => {
    if (activeFilter === "ALL") return true;

    return ret.status === activeFilter;
  });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pending";

      case "READY_FOR_PICKUP":
        return "Ready for Pickup";

      case "OTP_ACTIVE":
        return "OTP Active";

      case "PICKED_UP":
        return "Picked Up";

      case "EXPIRED":
        return "Expired";

      case "CANCELLED":
        return "Cancelled";

      default:
        return status;
    }
  };

  const getTabDisplay = (tab: string) => {
    switch (tab) {
      case "OTP_ACTIVE":
        return "ACTIVE";

      case "PICKED_UP":
        return "PICKED UP";

      default:
        return tab;
    }
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatTime = (dateString?: string | null): string => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) return "";

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const isOtpExpired = (otpExpiry?: string | null): boolean => {
    if (!otpExpiry) return false;

    return new Date(otpExpiry).getTime() < Date.now();
  };

  if (isAuthenticated === null) {
    return (
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] flex items-center justify-center">
        <div className="text-white text-xl font-extrabold animate-pulse">
          Checking authentication...
        </div>
      </main>
    );
  }

  if (isAuthenticated === false) {
    return (
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-white text-2xl md:text-3xl font-extrabold mb-4 leading-tight animate-bounce">
            Looks like you're not logged in
          </div>

          <div className="text-white/90 text-lg md:text-xl font-semibold animate-pulse">
            Redirecting to login...
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1]">
        <div className="h-16 w-16 animate-spin rounded-full border-[5px] border-white/30 border-t-white" />
      </main>
    );
  }

  return (
    <main className="min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] p-4 md:p-6 lg:p-8 flex flex-col">
      <div className="mx-auto flex h-full w-full flex-col gap-4 flex-1">

        {/* HEADER */}
        <header className="relative z-[100] shrink-0 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-xl border border-white/30 shadow-lg transition-all duration-300">
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
              {navItems.map((item) => {
                const isActive = item.href === "/returns";

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="relative group transition-all duration-300"
                  >
                    {item.label}

                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all duration-300 ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden relative z-[110] p-2 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <div className="flex flex-col justify-between w-6 h-4 transform transition-all duration-300">
                <span
                  className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 origin-left ${
                    isMenuOpen ? "rotate-45" : ""
                  }`}
                />

                <span
                  className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 ${
                    isMenuOpen ? "opacity-0" : ""
                  }`}
                />

                <span
                  className={`h-0.5 w-full bg-white rounded-full transition-all duration-300 origin-left ${
                    isMenuOpen ? "-rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>

          {/* MOBILE NAV DROPDOWN */}
          <div
            className={`absolute left-0 right-0 top-full mt-3 px-2 transition-all duration-300 ease-out lg:hidden ${
              isMenuOpen
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
          >
            <nav className="flex flex-col overflow-hidden rounded-2xl bg-white/95 backdrop-blur-2xl p-2 shadow-2xl border border-white/40">
              {navItems.map((item, idx) => {
                const isActive = item.href === "/returns";

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    style={{ transitionDelay: `${idx * 50}ms` }}
                    className={`p-4 text-[#df4473] font-bold rounded-xl transition-all duration-200 transform ${
                      isActive ? "bg-pink-50" : "hover:bg-pink-50"
                    } ${
                      isMenuOpen
                        ? "translate-x-0"
                        : "-translate-x-4"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        {/* CONTENT SECTION */}
        <section className="relative z-0 flex flex-col lg:grid lg:grid-cols-[1.6fr_1fr] flex-1 gap-4 min-h-0">

          {/* CREATE RETURN FORM */}
          <div className="order-1 lg:order-2 flex flex-col shrink-0 rounded-[2.5rem] bg-black/5 backdrop-blur-md border border-white/20 p-8 shadow-inner h-fit transition-all duration-500 hover:bg-black/10">
            <h2 className="text-xs font-black text-white/80 uppercase tracking-[0.3em] mb-6">
              Create Return
            </h2>

            <form className="space-y-4" onSubmit={handleCreate}>
              <div>
                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-4 mb-2 block">
                  Number of Parcels
                </label>

                <select
                  value={parcelCount}
                  onChange={(e) => {
                    const count = Number(e.target.value);

                    setParcelCount(count);

                    setItems((current) =>
                      Array.from(
                        { length: count },
                        (_, index) => current[index] || ""
                      )
                    );
                  }}
                  disabled={loading}
                  className="w-full h-14 rounded-3xl bg-white/20 border border-white/30 px-6 text-white outline-none focus:bg-white/30 transition-all duration-300"
                >
                  {[1, 2, 3, 4, 5].map((count) => (
                    <option
                      key={count}
                      value={count}
                      className="text-black"
                    >
                      {count}
                    </option>
                  ))}
                </select>
              </div>

              <div className="max-h-64 overflow-y-auto pr-1 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                {items.map((item, index) => (
                  <div key={index}>
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-4 mb-2 block">
                      Parcel {index + 1} Description
                    </label>

                    <input
                      type="text"
                      placeholder={
                        index === 0
                          ? "e.g. Birthday Gift"
                          : "e.g. Shampoo"
                      }
                      className="w-full h-14 rounded-3xl bg-white/20 border border-white/30 px-6 text-white placeholder:text-white/30 outline-none focus:bg-white/30 focus:scale-[1.01] transition-all duration-300"
                      value={item}
                      onChange={(e) => {
                        const updatedItems = [...items];
                        updatedItems[index] = e.target.value;
                        setItems(updatedItems);
                      }}
                      disabled={loading}
                      required
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-white/50 ml-4 leading-relaxed">
                Place the item in your locker first, then create a return
                record. You'll generate an OTP for the rider once you're
                ready for pickup.
              </p>

              <button
                type="submit"
                disabled={
                  loading ||
                  items.some((item) => !item.trim())
                }
                className="w-full h-14 mt-2 rounded-3xl bg-[#df4473] text-white font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Create Return"}
              </button>

              {error && (
                <div className="rounded-2xl bg-red-400/40 border border-red-300/20 p-4 text-sm text-white">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* LIST CONTAINER */}
          <div className="order-2 lg:order-1 flex flex-col rounded-[2.5rem] bg-black/5 backdrop-blur-md border border-white/20 p-6 shadow-inner flex-1 min-h-0 transition-all duration-500 overflow-hidden">
            <div className="shrink-0">
              <h2 className="text-xs font-black text-white/80 uppercase tracking-[0.3em] mb-4">
                Your Returns
              </h2>

              <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white/10 p-1 border border-white/10">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveFilter(tab)}
                    className={`rounded-xl py-2 text-[10px] xs:text-xs font-bold transition-all duration-300 text-center ${
                      activeFilter === tab
                        ? "bg-white/15 text-white shadow-md scale-105"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    {getTabDisplay(tab)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="flex flex-col gap-3">
                {dataLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-white/40">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white mb-4" />

                    <p className="text-sm font-bold uppercase tracking-widest">
                      Loading returns...
                    </p>
                  </div>
                ) : filteredReturns.length > 0 ? (
                  filteredReturns.map((ret) => {
                    const displayItems =
                      ret.items && ret.items.length > 0
                        ? ret.items
                        : [ret.itemDescription || "Parcel"];

                    const displayParcelCount =
                      ret.parcelCount || displayItems.length;

                    const expired =
                      ret.status === "OTP_ACTIVE" &&
                      isOtpExpired(ret.otpExpiry);

                    const effectiveStatus = expired
                      ? "EXPIRED"
                      : ret.status;

                    const statusStyle =
                      statusColors[
                        effectiveStatus as keyof typeof statusColors
                      ] || {
                        bg: "bg-gray-300",
                        text: "text-gray-800",
                      };

                    const canGenerateOtp =
                      ret.status === "READY_FOR_PICKUP" ||
                      ret.status === "OTP_ACTIVE" ||
                      ret.status === "EXPIRED";

                    const canDelete = true;

                    const isOtpVisible =
                      expandedOtpId === ret._id;

                    return (
                      <div
                        key={ret._id}
                        className="group flex flex-col gap-4 rounded-3xl bg-white/15 p-5 border border-white/10 hover:bg-white/25 transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div>
                              <div className="space-y-1">
                                {displayItems.map((item, index) => (
                                  <h3
                                    key={index}
                                    className="text-lg font-bold text-white break-words"
                                  >
                                    {displayItems.length > 1
                                      ? `${index + 1}. `
                                      : ""}
                                    {item}
                                  </h3>
                                ))}

                                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                                  {displayParcelCount}{" "}
                                  {displayParcelCount === 1
                                    ? "parcel"
                                    : "parcels"}
                                </p>
                              </div>
                            </div>

                            <p className="mt-1 text-[11px] text-white/40">
                              Created: {formatDate(ret.createdAt)}

                              {ret.status === "PICKED_UP" && (
                                <>
                                  {" • "}Picked up:{" "}
                                  {formatDate(ret.pickedUpDate)}
                                </>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span
                              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${statusStyle.bg} ${statusStyle.text}`}
                            >
                              {getStatusDisplay(effectiveStatus)}
                            </span>

                            <div className="flex items-center gap-3">
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      ret._id,
                                      displayItems.join(", ")
                                    )
                                  }
                                  className="text-lg text-white/60 hover:text-red-300 hover:scale-125 transition-all"
                                  aria-label={`Delete return for ${displayItems.join(", ")}`}
                                >
                                  🗑
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* OTP ACTION / PANEL */}
                        {canGenerateOtp && (
                          <div className="border-t border-white/10 pt-4">
                            {ret.status === "OTP_ACTIVE" && !expired ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedOtpId(
                                      isOtpVisible
                                        ? null
                                        : ret._id
                                    )
                                  }
                                  className="text-xs font-bold text-white/70 uppercase tracking-widest hover:text-white transition-all"
                                >
                                  {isOtpVisible
                                    ? "Hide OTP ▲"
                                    : "View OTP ▼"}
                                </button>

                                {isOtpVisible && (
                                  <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-5 border border-white/10">
                                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                                      Relay this code to the rider
                                    </p>

                                    <p className="text-4xl font-black tracking-[0.3em] text-white">
                                      {ret.otp}
                                    </p>

                                    <p className="text-[11px] text-white/40">
                                      Expires {formatDate(ret.otpExpiry)} at{" "}
                                      {formatTime(ret.otpExpiry)}
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleGenerateOtp(ret._id)
                                      }
                                      disabled={
                                        otpLoadingId === ret._id
                                      }
                                      className="mt-2 text-[11px] font-bold text-white/70 uppercase tracking-widest hover:text-white transition-all disabled:opacity-50"
                                    >
                                      {otpLoadingId === ret._id
                                        ? "Regenerating..."
                                        : "Regenerate OTP"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleGenerateOtp(ret._id)
                                }
                                disabled={
                                  otpLoadingId === ret._id
                                }
                                className="w-full h-11 rounded-2xl bg-[#df4473] text-white font-black text-xs uppercase tracking-[0.2em] shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {otpLoadingId === ret._id
                                  ? "Generating..."
                                  : expired
                                  ? "Regenerate OTP"
                                  : "Generate OTP"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <p className="text-sm font-bold uppercase tracking-widest">
                      No returns found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}