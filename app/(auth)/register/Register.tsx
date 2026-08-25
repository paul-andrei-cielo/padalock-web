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
  { label: "RETURNS", href: "/returns" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

const filterTabs = ["ALL", "PENDING", "DELIVERED", "RETRIEVED"];

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

      const sortedParcels = Array.isArray(data)
        ? [...data].sort(
            (a: Parcel, b: Parcel) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        : [];

      setParcels(sortedParcels);
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
    if (activeFilter.toUpperCase() === "ALL") return true;
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
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative group transition-all duration-300"
                >
                  {item.label}

                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all duration-300 ${
                      item.href === "/register"
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
              {navItems.map((item, idx) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                  className={`p-4 text-[#df4473] font-bold hover:bg-pink-50 rounded-xl transition-all duration-200 transform ${
                    isMenuOpen ? "translate-x-0" : "-translate-x-4"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* CONTENT SECTION */}
        <section className="relative z-0 flex flex-col lg:grid lg:grid-cols-[1.6fr_1fr] flex-1 gap-4 min-h-0">

          {/* REGISTER FORM */}
          <div className="order-1 lg:order-2 flex flex-col shrink-0 rounded-[2.5rem] bg-black/5 backdrop-blur-md border border-white/20 p-8 shadow-inner h-fit transition-all duration-500 hover:bg-black/10">
            <h2 className="text-xs font-black text-white/80 uppercase tracking-[0.3em] mb-6">
              Register New
            </h2>

            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-4 mb-2 block">
                  Tracking Number
                </label>

                <input
                  id="trackingNumber"
                  type="text"
                  placeholder="Enter number..."
                  className="w-full h-14 rounded-3xl bg-white/20 border border-white/30 px-6 text-white placeholder:text-white/30 outline-none focus:bg-white/30 focus:scale-[1.01] transition-all duration-300"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-4 mb-2 block">
                  Parcel Name (Optional)
                </label>

                <input
                  id="parcelName"
                  type="text"
                  placeholder="e.g. Birthday Gift"
                  className="w-full h-14 rounded-3xl bg-white/20 border border-white/30 px-6 text-white placeholder:text-white/30 outline-none focus:bg-white/30 focus:scale-[1.01] transition-all duration-300"
                  value={parcelName}
                  onChange={(e) => setParcelName(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !trackingNumber.trim()}
                className="w-full h-14 mt-4 rounded-3xl bg-[#df4473] text-white font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Register"}
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
                Registered Tracking Numbers
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
                    {tab}
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
                      Loading parcels...
                    </p>
                  </div>
                ) : filteredParcels.length > 0 ? (
                  filteredParcels.map((parcel) => {
                    const statusStyle =
                      statusColors[
                        parcel.status as keyof typeof statusColors
                      ] || {
                        bg: "bg-gray-300",
                        text: "text-gray-800",
                      };

                    const isEditing = editingId === parcel._id;

                    return (
                      <div
                        key={parcel._id}
                        className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl bg-white/15 p-5 border border-white/10 hover:bg-white/25 hover:scale-[1.01] transition-all duration-300"
                      >
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editTrackingNumber}
                                onChange={(e) =>
                                  setEditTrackingNumber(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdate(parcel._id);
                                  }

                                  if (e.key === "Escape") {
                                    cancelEdit();
                                  }
                                }}
                                className="w-full rounded-2xl bg-white/20 border border-white/30 px-4 py-2 text-lg font-bold text-white outline-none focus:bg-white/30"
                                autoFocus
                              />

                              <input
                                type="text"
                                value={editParcelName}
                                onChange={(e) =>
                                  setEditParcelName(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdate(parcel._id);
                                  }

                                  if (e.key === "Escape") {
                                    cancelEdit();
                                  }
                                }}
                                className="w-full rounded-2xl bg-white/20 border border-white/30 px-4 py-2 text-sm text-white outline-none focus:bg-white/30"
                                placeholder="Parcel name"
                              />
                            </div>
                          ) : (
                            <>
                              <h3 className="text-lg font-bold text-white break-all">
                                {parcel.trackingNumber}
                              </h3>

                              <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                                {parcel.parcelName}
                              </p>

                              <p className="mt-1 text-[11px] text-white/40">
                                Created: {formatDate(parcel.createdAt)}
                                {" • "}Delivered:{" "}
                                {formatDate(parcel.deliveryDate)}
                                {" • "}Retrieved:{" "}
                                {formatDate(parcel.retrievedDate)}
                              </p>
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <span
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {getStatusDisplay(parcel.status)}
                          </span>

                          <div className="flex items-center gap-3">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdate(parcel._id)}
                                  className="text-lg text-green-300 hover:text-green-200 hover:scale-125 transition-all"
                                  aria-label="Save changes"
                                >
                                  ✓
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="text-lg text-red-300 hover:text-red-200 hover:scale-125 transition-all"
                                  aria-label="Cancel edit"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEdit(parcel)}
                                  className="text-lg text-white/60 hover:text-white hover:scale-125 transition-all"
                                  aria-label={`Edit ${parcel.trackingNumber}`}
                                >
                                  ✎
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      parcel._id,
                                      parcel.trackingNumber
                                    )
                                  }
                                  className="text-lg text-white/60 hover:text-red-300 hover:scale-125 transition-all"
                                  aria-label={`Delete ${parcel.trackingNumber}`}
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
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <p className="text-sm font-bold uppercase tracking-widest">
                      No parcels found
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