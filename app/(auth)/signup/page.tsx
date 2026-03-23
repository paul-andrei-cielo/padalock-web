"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/login");

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6f2f4] via-[#efc7d3] to-[#df4f7d] px-6 py-8 md:px-10 lg:px-16">
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-between gap-10">
      <section className="flex-1 text-white">
        <div className="mb-16 flex items-center gap-4">
          <div className="mb-16">
            <Image
              src="/padalock-logo.png"
              alt="PadaLock Logo"
              width={390}
              height={90}
              className="object-contain"
              priority
            />
          </div>
        </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-extrabold leading-[1.2] md:text-5xl">
              Create an
              <br />
              account
            </h2>
          </div>
        </section>

        <section className="flex w-full max-w-xl justify-center lg:justify-end">
          <div className="w-full rounded-[2rem] bg-[#f6e8ec]/50 p-8 shadow-[0_20px_60px_rgba(214,84,126,0.18)] backdrop-blur-sm md:p-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-full bg-red-100/80 border border-red-300 p-4 text-center text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-lg font-medium text-[#e34774]"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Your name"
                  className="h-12 w-full rounded-full border-none bg-[#f8f4f5] px-6 text-base text-[#dd8ea5] outline-none placeholder:text-[#dd9db0] focus:ring-2 focus:ring-[#e33e70]"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-lg font-medium text-[#e34774]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="user@example.com"
                  className="h-12 w-full rounded-full border-none bg-[#f8f4f5] px-6 text-base text-[#dd8ea5] outline-none placeholder:text-[#dd9db0] focus:ring-2 focus:ring-[#e33e70]"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-lg font-medium text-[#e34774]"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Your password"
                  className="h-12 w-full rounded-full border-none bg-[#f8f4f5] px-6 text-base text-[#dd8ea5] outline-none placeholder:text-[#dd9db0] focus:ring-2 focus:ring-[#e33e70]"
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 min-w-[190px] rounded-full bg-[#e33e70] px-8 text-lg font-bold text-white transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    "Get Started"
                  )}
                </button>
              </div>

              <p className="mt-4 text-center text-sm text-[#e34774]">
                Already have an account?{" "}
                <Link href="/login" className="font-bold hover:underline">
                  Login
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}