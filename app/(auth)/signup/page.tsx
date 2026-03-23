import Link from "next/link";

export default function SignupPage() {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#f6f2f4] via-[#efc7d3] to-[#df4f7d] px-6 py-8 md:px-10 lg:px-16">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-between gap-10">
          <section className="flex-1 text-white">
            <div className="mb-16 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#e33e70]" />
              <h1 className="text-4xl font-light tracking-tight md:text-5xl">
                Pada<span className="font-semibold">Lock</span>
              </h1>
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
            <div className="w-full rounded-[2rem] bg-[#f6e8ec]/80 p-8 shadow-[0_20px_60px_rgba(214,84,126,0.18)] backdrop-blur-sm md:p-10">
              <form className="space-y-6">
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
                    placeholder="Your name"
                    className="h-12 w-full rounded-full border-none bg-[#f8f4f5] px-6 text-base text-[#dd8ea5] outline-none placeholder:text-[#dd9db0]"
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
                    placeholder="user@example.com"
                    className="h-12 w-full rounded-full border-none bg-[#f8f4f5] px-6 text-base text-[#dd8ea5] outline-none placeholder:text-[#dd9db0]"
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
                    placeholder="Your password"
                    className="h-12 w-full rounded-full border-none bg-[#f8f4f5] px-6 text-base text-[#dd8ea5] outline-none placeholder:text-[#dd9db0]"
                  />
                </div>
  
                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    className="h-12 min-w-[190px] rounded-full bg-[#e33e70] px-8 text-lg font-bold text-white transition hover:scale-[1.02]"
                  >
                    Get Started
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