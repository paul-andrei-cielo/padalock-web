"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  User,
  Pencil,
  LogOut,
  Loader2,
} from "lucide-react";

const navItems = [
  { label: "REGISTER", href: "/register" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "NOTIFICATIONS", href: "/notifications" },
  { label: "ACCOUNT", href: "/account" },
];

const scrollbarClass =
  "[&::-webkit-scrollbar]:w-2.5 " +
  "[&::-webkit-scrollbar-track]:bg-[#f2d9e2] " +
  "[&::-webkit-scrollbar-track]:rounded-full " +
  "[&::-webkit-scrollbar-thumb]:bg-[#d985a1] " +
  "[&::-webkit-scrollbar-thumb]:rounded-full " +
  "hover:[&::-webkit-scrollbar-thumb]:bg-[#cf6c91]";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) throw new Error("No authentication token");

      const res = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.user);
      setFirstName(data.user.firstName);
      setLastName(data.user.lastName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.user);
      setEditMode(false);
      setSuccess("Profile updated successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
    setEditMode(false);
    setError("");
    setSuccess("");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/users/profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Account deleted");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1]">
        <Loader2 className="animate-spin text-white" />
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-gradient-to-b from-[#df4473] via-[#e99ab1] to-[#f4eff1] px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-4">

        {/* HEADER */}
        <header className="shrink-0 rounded-[1.75rem] bg-white/25 px-4 py-3 backdrop-blur-sm md:px-6 md:py-3 lg:px-8 lg:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Image
              src="/padalock-logo.png"
              alt="PadaLock logo"
              width={340}
              height={70}
              className="h-auto w-[140px] sm:w-[180px] md:w-[220px] lg:w-[260px]"
              priority
            />

            <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-white sm:text-sm md:text-base lg:justify-end lg:gap-x-6 lg:text-lg">
              {navItems.map((item) => {
                const isActive = item.label === "ACCOUNT";
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`transition hover:opacity-80 ${
                      isActive ? "font-extrabold" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        {/* CONTENT */}
        <section className="min-h-0 flex-1 overflow-hidden rounded-[2rem] bg-white/25 p-4 backdrop-blur-sm sm:p-5 md:p-6">
          <div className="flex h-full flex-col">

            {/* TITLE */}
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h1 className="text-2xl font-extrabold text-white md:text-3xl">
                Account Settings
              </h1>

              <button className="flex items-center gap-2 bg-[#de517e] text-white px-5 py-2.5 rounded-full">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto ${scrollbarClass}`}>
              <div className="flex flex-col gap-4">

                {/* PROFILE */}
                <div className="bg-white/50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[#de517e] font-bold text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Information
                    </h2>

                    {!editMode ? (
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-1 border px-3 py-1 rounded-full"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={handleSaveProfile} className="bg-[#de517e] text-white px-3 py-1 rounded-full">
                          Save
                        </button>
                        <button onClick={handleCancelEdit} className="border px-3 py-1 rounded-full">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* FEEDBACK */}
                  {success && <p className="text-green-700">{success}</p>}
                  {error && <p className="text-red-700">{error}</p>}

                  {/* FORM */}
                  <div className="grid gap-4 md:grid-cols-3">

                    <div>
                      <label className="text-sm font-semibold">First Name</label>
                      {editMode ? (
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full border px-3 py-2 rounded"
                        />
                      ) : (
                        <p>{user?.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Last Name</label>
                      {editMode ? (
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full border px-3 py-2 rounded"
                        />
                      ) : (
                        <p>{user?.lastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Email</label>
                      <p>{user?.email || "Loading..."}</p>
                    </div>

                  </div>
                </div>

                {/* DELETE */}
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete Account
                </button>

              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}