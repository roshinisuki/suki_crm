import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { GlobalLoadingProvider } from "@/components/GlobalLoadingProvider";
import { getMeAction } from "@/app/actions/auth";

const inter = { className: "font-sans" };

// Mark as dynamic since getMeAction() uses cookies() which requires server-side rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: " SUKI  Marketing CRM",
  description: "Internal CRM portal for  SUKI  Marketing teams",
  icons: {
    icon: "/tick-mark.svg",
    shortcut: "/tick-mark.svg",
    apple: "/tick-mark.svg",
  },
};

// Map legacy Prisma theme names to new theme keys
const LEGACY_THEME_MAP: Record<string, string> = {
  ember: "orange",
  ocean: "blue",
  forest: "green",
  obsidian: "purple",
  black: "purple",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRes = await getMeAction();
  const initialUser = userRes.success ? userRes.data : null;

  // Resolve theme from user profile (DB), fallback to defaults
  const legacyTheme = initialUser?.theme || "ember";
  const themeMode = initialUser?.themeMode || "light";
  const themeColor = LEGACY_THEME_MAP[legacyTheme] || "orange";
  const isDark = themeMode === "dark";

  return (
    <html lang="en" data-theme={themeColor} data-mode={themeMode} className={isDark ? "dark" : ""}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var map = {ember:"orange",ocean:"blue",forest:"green",obsidian:"purple",black:"purple"};
                var theme = localStorage.getItem("suki-theme") || localStorage.getItem("crm-theme-color") || "${themeColor}";
                var mode = localStorage.getItem("suki-mode") || localStorage.getItem("crm-theme-mode") || "${themeMode}";
                // Migrate old "black" to "purple"
                if (theme === "black") theme = "purple";
                theme = map[theme] || theme;
                document.documentElement.setAttribute("data-theme", theme);
                document.documentElement.setAttribute("data-mode", mode);
                if (mode === "dark") document.documentElement.classList.add("dark");
                else document.documentElement.classList.remove("dark");
              })();
              window.__CRM_VARIANT__ = ${process.env.NEXT_PUBLIC_CRM_VARIANT || "1"};
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider initialUser={initialUser as any}>
            <GlobalLoadingProvider>
              {children}
            </GlobalLoadingProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
