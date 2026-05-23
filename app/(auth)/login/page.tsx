"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── EXACT IMAGE LOGO FROM UPLOAD ──
function SukiWhiteLogo({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl shadow-md", className)}>
      <Image
        src="/images/suki-logo.jpg"
        alt="Suki CRM Logo"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}

// ── HORIZONTAL HEADER BRAND BLOCK ──
function SukiBrandHeader({ theme = "light" }: { theme?: "light" | "dark" }) {
  return (
    <div className="flex items-center gap-4">
      <SukiWhiteLogo className={cn(
        "w-12 h-12 drop-shadow-sm",
        theme === "dark" ? "text-white" : "text-brand-primary-container"
      )} />
      <div className="flex flex-col items-start leading-none">
        <div className="flex items-center">
          <span className={cn(
            "text-2xl font-black tracking-tight",
            theme === "dark" ? "text-white" : "text-brand-primary-container"
          )}>
            SUKI
          </span>
          <span className="text-[10px] font-bold text-blue-500 align-super ml-0.5">®</span>
        </div>
        <span className={cn(
          "text-[9.5px] font-bold tracking-widest mt-1",
          theme === "dark" ? "text-slate-400" : "text-slate-500"
        )}>
          SOFTWARE SOLUTIONS
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  
  // Interactive UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Business Rule Check: Only approved company domain users allowed
    const approvedDomain = "@sukisoftware.com";
    if (!email.toLowerCase().endsWith(approvedDomain)) {
      setError(`Access restricted. Please use your official domain ${approvedDomain}`);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate backend authentication request
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex bg-brand-surface font-sans antialiased selection:bg-brand-secondary-container selection:text-brand-on-secondary-container">
      
      {/* ── LEFT PANEL: DEEP CORPORATE NAVY PANEL (50% WIDTH) ── */}
      <section className="hidden lg:flex lg:w-[50%] bg-[#1e3a5f] text-brand-on-primary flex-col items-center justify-center p-12 xl:p-16 relative overflow-hidden">
        {/* Soft elegant radial overlays matching texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(69,95,135,0.4)_0%,transparent_75%)] pointer-events-none" />

        {/* Content Container (Center aligned) */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto space-y-6">
          
          {/* Hexagonal S Logo centered (Mathematically perfect solid white with gaps) */}
          <SukiWhiteLogo className="w-24 h-24 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.06)] mb-2" />

          {/* Heading (Display Large weight and typography rules) */}
          <div className="space-y-1">
            <h1 className="text-[36px] font-light leading-[44px] tracking-[-0.02em] text-white">
              Welcome to
            </h1>
            <h2 className="text-[44px] xl:text-[48px] font-bold leading-[52px] tracking-[-0.02em] text-white">
              Suki CRM
            </h2>
          </div>

          {/* Tagline Paragraph (Body Large rule) */}
          <p className="text-slate-300 text-[16px] leading-[24px] max-w-sm font-normal">
            Secure access to your customer ecosystem. Manage relationships, analyze data, and grow your brand with enterprise-grade precision.
          </p>

          {/* Security Pill Badge (Fully rounded badge tint) */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[12px] leading-[16px] text-brand-on-primary font-medium tracking-[0.05em] uppercase shadow-sm">
            <ShieldCheck className="w-4 h-4 text-brand-on-primary-container" />
            <span>Sign in with your official company email.</span>
          </div>

        </div>
      </section>

      {/* ── RIGHT PANEL: CLEAN MINIMALIST CREDENTIALS (50% WIDTH) ── */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-brand-surface-bright">
        {/* Abstract subtle background dots matching flat modern design system */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #191c1e 1px, transparent 0)",
            backgroundSize: "24px 24px"
          }}
        />

        <div className="w-full max-w-[440px] flex flex-col items-center space-y-8">
          
          {/* Level 1 Tonal Layered Credentials Card (1px border and diff shadow) */}
          <div className="w-full bg-white rounded-2xl border border-brand-surface-highest/60 shadow-[0px_2px_4px_rgba(11,31,58,0.04)] p-8 sm:p-10">
            
            {/* Header Text (Headline SM style) */}
            <div className="mb-6">
              <h3 className="text-[20px] font-semibold leading-[28px] text-brand-on-surface">
                Internal Portal Login
              </h3>
              <p className="text-[14px] leading-[20px] text-brand-on-surface-variant/80 mt-1 font-normal">
                Enter your credentials to continue.
              </p>
            </div>

            {/* Domain Verification Notifications */}
            {error && (
              <div className="bg-brand-error-container border border-brand-error/10 rounded-lg p-3.5 flex gap-2.5 items-start mb-5 animate-shake">
                <ShieldAlert className="w-4 h-4 text-brand-error-container mt-0.5 flex-shrink-0" />
                <span className="text-[12px] leading-[16px] font-semibold text-brand-on-error-container leading-tight">
                  {error}
                </span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3.5 flex gap-2.5 items-start mb-5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="text-[12px] leading-[16px] font-semibold text-emerald-800 leading-tight">
                  Sign in validated! Access approved. Redirecting to workspace...
                </span>
              </div>
            )}

            {/* Form inputs */}
            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              
              {/* Company Email Field */}
              <div>
                <label 
                  htmlFor="company-email" 
                  className="block text-[12px] font-semibold text-brand-on-surface tracking-[0.05em] uppercase mb-1.5"
                >
                  Company Email
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-on-surface-variant group-focus-within:text-brand-secondary transition-colors duration-200">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="company-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-outline-variant bg-white text-brand-on-surface text-[14px] leading-[20px] placeholder:text-brand-outline/70 focus:outline-none focus:ring-2 focus:ring-brand-secondary/15 focus:border-brand-secondary transition-all duration-200 font-normal"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label 
                    htmlFor="password" 
                    className="text-[12px] font-semibold text-brand-on-surface tracking-[0.05em] uppercase"
                  >
                    Password
                  </label>
                  <a 
                    href="#" 
                    className="text-[11px] font-bold text-brand-outline hover:text-brand-on-surface transition-colors duration-150"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-on-surface-variant group-focus-within:text-brand-secondary transition-colors duration-200">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-brand-outline-variant bg-white text-brand-on-surface text-[14px] leading-[20px] placeholder:text-brand-outline/70 focus:outline-none focus:ring-2 focus:ring-brand-secondary/15 focus:border-brand-secondary transition-all duration-200 font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-outline hover:text-brand-on-surface transition-colors duration-150"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Keep me signed in Checkbox */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] leading-[16px] text-brand-on-surface-variant font-medium">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-outline-variant text-brand-primary-container focus:ring-brand-primary-container/30 cursor-pointer accent-brand-primary-container"
                  />
                  <span>Keep me signed in for 30 days</span>
                </label>
              </div>

              {/* Login Button (Solid Dark Blue primary, 8px border-radius) */}
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full py-3 px-4 rounded-lg bg-brand-primary-container hover:bg-brand-primary text-white text-[14px] leading-[20px] font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary-container/20 active:scale-[0.99] transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Ecosystem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider Line (Subtle Blue highlight hairline border) */}
            <div className="w-full h-[1px] bg-brand-surface-highest/60 my-6" />

            {/* Assistance Footer */}
            <div className="text-center text-[12px] leading-[16px] text-brand-on-surface-variant font-medium">
              Need assistance or lost access?{" "}
              <a 
                href="#" 
                className="font-bold text-brand-on-surface hover:text-black hover:underline transition-all duration-150"
              >
                Contact IT Support
              </a>
            </div>

          </div>

          {/* Three Pagination Indicator Dots (8px increments) */}
          <div className="flex gap-2 items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-outline-variant transition-colors duration-150" />
            <span className="w-2.5 h-2.5 rounded-full bg-brand-surface-container transition-colors duration-150" />
            <span className="w-2.5 h-2.5 rounded-full bg-brand-surface-container transition-colors duration-150" />
          </div>

        </div>
      </section>

    </main>
  );
}
