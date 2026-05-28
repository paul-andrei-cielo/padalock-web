"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Parcel {
  _id: string;
  trackingNumber: string;
  parcelName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  retrievedDate?: string;
}

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

const filterTabs = ["All", "Pending", "Delivered", "Retrieved"];

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-[#edd9cb]", text: "text-[#d46800]" },
  DELIVERED: { bg: "bg-[#b8d8c7]", text: "text-[#0d7a43]" },
  RETRIEVED: { bg: "bg-[#cfe8ec]", text: "text-[#1383a3]" },
};

const API_BASE = "/api/parcels";

export default function RegisterPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [parcelName, setParcelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [error, setError] = useState("");
  const [selectedClip, setSelectedClip] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editParcelName, setEditParcelName] = useState("");

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
      fetchParcels();
    }
  }, [isAuthenticated]);

  const fetchParcels = async () => {
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
        throw new Error(errorData.error || "Failed to fetch parcels");
      }

      const data = await res.json();
      setParcels(Array.isArray(data) ? data : []);
      setError("");
    } catch (err: any) {
      console.error("Error fetching parcels:", err);
      setError(err.message || "Failed to load parcels");
      setParcels([]);
    } finally {
      setDataLoading(false);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
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
          trackingNumber: trackingNumber.trim(),
          parcelName: parcelName.trim() || "Parcel",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to register parcel");
      }

      setTrackingNumber("");
      setParcelName("");
      await fetchParcels();
    } catch (err: any) {
      console.error("Error registering parcel:", err);
      setError(err.message || "Failed to register parcel");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (parcel: Parcel) => {
    setEditingId(parcel._id);
    setEditTrackingNumber(parcel.trackingNumber);
    setEditParcelName(parcel.parcelName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTrackingNumber("");
    setEditParcelName("");
  };

  const handleUpdate = async (parcelId: string) => {
    if (!editTrackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    try {
      const token = localStorage.getItem("token")!;
      
      const res = await fetch(`${API_BASE}/${parcelId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trackingNumber: editTrackingNumber.trim(),
          parcelName: editParcelName.trim() || "Parcel",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update parcel");
      }

      setParcels((prev) =>
        prev.map((p) =>
          p._id === parcelId
            ? {
                ...p,
                trackingNumber: editTrackingNumber.trim(),
                parcelName: editParcelName.trim() || "Parcel",
              }
            : p
        )
      );

      cancelEdit();
    } catch (err: any) {
      console.error("Error updating parcel:", err);
      setError(err.message || "Failed to update parcel");
    }
  };

  const handleDelete = async (parcelId: string, trackingNumber: string) => {
    if (!confirm(`Delete ${trackingNumber}?`)) return;

    try {
      const token = localStorage.getItem("token")!;
      
      const res = await fetch(`${API_BASE}/${parcelId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete parcel");
      }

      await fetchParcels();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete parcel");
      await fetchParcels();
    }
  };

  const filteredParcels = parcels.filter((parcel) => {
    if (activeFilter === "All") return true;
    return parcel.status === activeFilter.toUpperCase();
  });

  const getStatusDisplay = (status: string) => {
    const normalizedStatus = status.toUpperCase();
    return normalizedStatus === "PENDING"
      ? "Pending"
      : normalizedStatus === "DELIVERED"
      ? "Delivered"
      : normalizedStatus === "RETRIEVED"
      ? "Retrieved"
      : status;
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

  const formatFullDateInfo = (parcel: Parcel): string => {
    return `
      <b>Created:</b> ${formatDate(parcel.createdAt)} |
      <b>Delivered:</b> ${formatDate(parcel.deliveryDate)} |
      <b>Retrieved:</b> ${formatDate(parcel.retrievedDate)}
    `.trim();
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
      <main className="h-screen bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] flex items-center justify-center">
        <div className="text-white text-xl font-extrabold animate-pulse">Loading register...</div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      {/* Global CSS Injector for Keyframe Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="mx-auto flex h-full w-full flex-col gap-4 animate-fade-in">
        <header className="shrink-0 rounded-[1.5rem] bg-[#FFFFFF]/25 px-4 py-3 backdrop-blur-sm md:px-6 md:py-3 lg:px-8 lg:py-4 transition-all duration-300 hover:bg-[#FFFFFF]/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/home" className="flex items-center transition-transform duration-200 hover:scale-105 active:scale-95">
              <Image
                src="/padalock-logo.png"
                alt="PadaLock logo"
                width={340}
                height={70}
                className="h-auto w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px]"
                priority
              />
            </Link>

            <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-white sm:text-sm md:text-base lg:justify-end lg:gap-x-6 lg:text-lg">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`transition-all duration-200 hover:opacity-100 hover:text-white/80 hover:-translate-y-0.5 transform ${
                    item.href === "/register" ? "font-extrabold" : "opacity-80"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="flex min-h-0 flex-col rounded-[2rem] bg-white/25 p-4 backdrop-blur-sm sm:p-5 md:p-6 animate-slide-up [animation-delay:100ms]">
            <div className="shrink-0">
              <h2 className="text-xl font-extrabold text-white md:text-2xl">
                Registered Tracking Numbers
              </h2>

              <p className="mt-3 max-w-[650px] text-xs leading-relaxed text-white sm:text-sm">
                All expected parcels are listed here. Register your tracking
                number, and it will appear in the list with Pending Status.
              </p>

              {error && (
                <div className="mt-3 rounded-xl bg-red-400/50 p-3 text-sm text-white animate-shake">
                  {error}
                  <button
                    onClick={fetchParcels}
                    className="ml-2 inline-flex items-center gap-1 text-xs underline hover:no-underline transition-opacity hover:opacity-80"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 rounded-[1.5rem] bg-white/35 p-2">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveFilter(tab)}
                    className={`min-w-[110px] flex-1 rounded-full px-3 py-2 text-xs font-bold transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) transform active:scale-95 ${
                      activeFilter === tab
                        ? "bg-[#de9aae] text-white shadow-md scale-102"
                        : "text-[#de9aae] hover:bg-white/30"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#de9aae] [&::-webkit-scrollbar-track]:bg-transparent [scrollbar-color:#de9aae_transparent] [scrollbar-width:thin]">
              <div className="flex flex-col gap-3">
                {dataLoading ? (
                  <div className="flex min-h-full flex-col items-center justify-center rounded-[1.5rem] bg-white/30 py-10 text-center animate-fade-in">
                    <div className="animate-spin h-8 w-8 border-2 border-[#de9aae]/50 border-t-[#de9aae] rounded-full mx-auto mb-4"></div>
                    <p className="text-white">Loading parcels...</p>
                  </div>
                ) : filteredParcels.length === 0 ? (
                  <div className="flex min-h-full items-center justify-center rounded-[1.5rem] bg-white/30 py-10 text-center animate-fade-in">
                    <div>
                      <p className="text-lg font-bold text-[#de9aae] md:text-xl">
                        No parcels{" "}
                        {activeFilter !== "All"
                          ? `with ${activeFilter.toLowerCase()} status`
                          : ""}{" "}
                        found
                      </p>
                      <p className="mt-2 text-sm text-[#dd9db0]">
                        Register your first tracking number above
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredParcels.map((parcel, idx) => {
                    const statusStyle =
                      statusColors[
                        parcel.status as keyof typeof statusColors
                      ] || {
                        bg: "bg-gray-400",
                        text: "text-gray-800",
                      };

                    const isEditing = editingId === parcel._id;

                    return (
                      <div
                        key={parcel._id}
                        style={{ animationDelay: `${idx * 40}ms` }}
                        className="flex flex-col gap-4 rounded-[1.5rem] bg-white/45 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between transition-all duration-300 ease-out hover:bg-white/60 hover:shadow-sm hover:-translate-y-0.5 animate-slide-up"
                      >
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <div className="animate-fade-in">
                              <input
                                type="text"
                                value={editTrackingNumber}
                                onChange={(e) =>
                                  setEditTrackingNumber(e.target.value)
                                }
                                className="w-full bg-white/50 px-2 py-1 rounded-md text-lg font-extrabold text-[#de9aae] outline-none border border-[#de9aae]/20 focus:border-[#de9aae] transition-colors sm:text-xl md:text-2xl"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleUpdate(parcel._id);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                              />
                              <div className="mt-1 text-xs text-[#de9aae] sm:text-sm md:text-base">
                                {editParcelName !== "Parcel" && (
                                  <input
                                    type="text"
                                    value={editParcelName}
                                    onChange={(e) =>
                                      setEditParcelName(e.target.value)
                                    }
                                    className="block w-full bg-white/50 px-2 py-0.5 rounded-md mt-1 font-medium outline-none border border-[#de9aae]/10 focus:border-[#de9aae] transition-colors"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        handleUpdate(parcel._id);
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                  />
                                )}
                                <span className="inline-block mt-2">{formatDate(parcel.createdAt)}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="animate-fade-in">
                              <h3 className="break-all text-lg font-extrabold text-[#de9aae] sm:text-xl md:text-2xl">
                                {parcel.trackingNumber}
                              </h3>
                              <div className="mt-1 text-xs text-[#de9aae] sm:text-sm md:text-base">
                                {parcel.parcelName !== "Parcel" && (
                                  <span className="block font-medium">
                                    {parcel.parcelName}
                                  </span>
                                )}
                                <div
                                  className="font-medium leading-relaxed"
                                  dangerouslySetInnerHTML={{
                                    __html: formatFullDateInfo(parcel),
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:ml-4 lg:flex-nowrap">
                          <span
                            className={`rounded-full px-4 py-2 text-xs font-extrabold transition-all duration-300 sm:text-sm md:px-5 md:text-base hover:brightness-95 ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {getStatusDisplay(parcel.status)}
                          </span>

                          <div className="flex items-center gap-3">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className="text-lg text-green-600 transition-all transform hover:scale-125 hover:opacity-100 active:scale-95 md:text-xl"
                                  aria-label="Save changes"
                                  onClick={() => handleUpdate(parcel._id)}
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  className="text-lg text-red-500 transition-all transform hover:scale-125 hover:opacity-100 active:scale-95 md:text-xl"
                                  aria-label="Cancel edit"
                                  onClick={cancelEdit}
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="text-lg text-[#de9aae] opacity-80 transition-all transform hover:scale-125 hover:opacity-100 hover:text-[#df4473] active:scale-95 md:text-xl"
                                  aria-label={`Edit ${parcel.trackingNumber}`}
                                  onClick={() => startEdit(parcel)}
                                >
                                  ✎
                                </button>
                                <button
                                  type="button"
                                  className="text-lg text-[#de9aae] opacity-80 transition-all transform hover:scale-125 hover:opacity-100 hover:text-red-500 active:scale-95 md:text-xl"
                                  aria-label={`Delete ${parcel.trackingNumber}`}
                                  onClick={() =>
                                    handleDelete(parcel._id, parcel.trackingNumber)
                                  }
                                >
                                  🗑
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col rounded-[2rem] bg-white/25 p-4 backdrop-blur-sm sm:p-5 md:p-6 animate-slide-up [animation-delay:200ms]">
            <div className="shrink-0">
              <h2 className="text-xl font-extrabold text-white md:text-2xl">
                Register Tracking Number
              </h2>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleRegister}>
              <div className="transition-all duration-300 focus-within:translate-x-1">
                <label className="mb-2 block text-base font-medium text-white md:text-lg">
                  Tracking number *
                </label>
                <input
                  id="trackingNumber"
                  type="text"
                  placeholder="Enter your parcel's tracking number"
                  className="h-12 w-full rounded-full bg-white/45 px-5 text-sm text-[#dd8ea5] outline-none placeholder:text-[#dd9db0]/70 focus:ring-2 focus:ring-white/50 focus:bg-white/60 transition-all duration-300 md:h-14 md:text-base"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="transition-all duration-300 focus-within:translate-x-1">
                <label className="mb-2 block text-base font-medium text-white md:text-lg">
                  Parcel name (optional)
                </label>
                <input
                  id="parcelName"
                  type="text"
                  placeholder="e.g., Birthday Gift, Documents"
                  className="h-12 w-full rounded-full bg-white/45 px-5 text-sm text-[#dd8ea5] outline-none placeholder:text-[#dd9db0]/70 focus:ring-2 focus:ring-white/50 focus:bg-white/60 transition-all duration-300 md:h-14 md:text-base"
                  value={parcelName}
                  onChange={(e) => setParcelName(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !trackingNumber.trim()}
                className="h-12 w-full rounded-full bg-[#df4473] px-6 text-base font-extrabold text-white shadow-md transition-all duration-300 transform cubic-bezier(0.16, 1, 0.3, 1) hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none md:h-14 md:text-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-5 w-5 border-2 border-white/50 border-t-white rounded-full"></span>
                    Registering...
                  </span>
                ) : (
                  "Register"
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}