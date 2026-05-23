"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Icons ────────────────────────────────────────────────────────────────────
function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-400">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}
function SukiLogo() {
  return (
    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-200">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
        <path d="M24 10C24 10 20 8 16 8C11 8 8 11 8 14C8 17 11 18.5 16 19.5C21 20.5 24 22 24 25C24 28 21 29 16 29C11 29 8 27 8 27" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <circle cx="27" cy="27" r="2.5" fill="#93c5fd" />
      </svg>
    </div>
  );
}

// ── Decorative right panel ────────────────────────────────────────────────────
function DecorativePanel() {
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 items-center justify-center p-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div className="absolute top-16 right-16 w-40 h-40 rounded-full bg-white/10 blur-2xl animate-pulse" />
      <div className="absolute bottom-24 left-12 w-56 h-56 rounded-full bg-indigo-400/20 blur-3xl animate-pulse delay-700" />
      <div className="relative z-10 max-w-sm text-center text-white">
        <div className="grid grid-cols-2 gap-4 mb-10">
          {[
            { label: "Active Campaigns", value: "2,418" },
            { label: "Leads Tracked", value: "18.6K" },
            { label: "Conversion Rate", value: "34.7%" },
            { label: "Revenue Growth", value: "+128%" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-blue-200 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-3">Your marketing command centre</h2>
        <p className="text-sm text-blue-200 leading-relaxed">Manage campaigns, nurture leads, and grow revenue — all from one powerful platform built for modern marketing teams.</p>
        <div className="mt-8 flex items-center justify-center gap-2 bg-white/10 rounded-full px-5 py-2.5 border border-white/20 w-fit mx-auto">
          <div className="flex -space-x-2">
            {["#fbbf24", "#34d399", "#60a5fa"].map((color) => (
              <div key={color} className="w-6 h-6 rounded-full border-2 border-white/40" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span className="text-xs text-blue-100">Trusted by <strong className="text-white">500+</strong> teams</span>
        </div>
      </div>
    </div>
  );
}

// ── Auth Card ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "MarketingExecutive",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const endpoint = isLogin ? "/user/login" : "/user/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.message || "Authentication failed");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-slate-50">
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16 lg:max-w-xl xl:max-w-2xl">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 px-8 py-10 sm:px-10">
            <div className="flex justify-center mb-7">
              <SukiLogo />
            </div>

            <h1 className="text-center text-2xl font-bold text-slate-800 tracking-tight">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-center text-sm text-slate-500 mt-1 mb-8">
              {isLogin ? "Sign in to Suki Marketing CRM" : "Join Suki Marketing CRM today"}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              
              {!isLogin && (
                <>
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><UserIcon /></span>
                      <input id="name" type="text" required value={formData.name} onChange={handleChange} placeholder="John Doe" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-xs font-semibold text-slate-600 mb-1.5">Your Role</label>
                    <div className="relative">
                      <select id="role" required value={formData.role} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
                        <option value="MarketingExecutive">Marketing Executive</option>
                        <option value="MarketingLead">Marketing Lead</option>
                        <option value="Admin">Admin</option>
                        <option value="Customer">Customer</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><MailIcon /></span>
                  <input id="email" type="email" required value={formData.email} onChange={handleChange} placeholder="name@company.com" className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><LockIcon /></span>
                  <input id="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange} placeholder="Enter your password" className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">Forgot Password?</a>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold shadow-md shadow-blue-200 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1">
                {loading ? (
                  <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{isLogin ? "Signing in…" : "Creating account…"}</>
                ) : (
                  isLogin ? "Sign In" : "Sign Up"
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">Secure access</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <p className="mt-5 text-center text-xs text-slate-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing, you agree to our <a href="#" className="hover:underline text-slate-500">Terms of Service</a> &amp; <a href="#" className="hover:underline text-slate-500">Privacy Policy</a>
          </p>
        </div>
      </div>
      <DecorativePanel />
    </main>
  );
}
