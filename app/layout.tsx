import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { getMeAction } from "@/app/actions/auth";

const inter = Inter({ subsets: ["latin"] });

// Mark as dynamic since getMeAction() uses cookies() which requires server-side rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: " SUKI  Marketing CRM",
  description: "Internal CRM portal for  SUKI  Marketing teams",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRes = await getMeAction();
  const initialUser = userRes.success ? userRes.data : null;

  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider initialUser={initialUser as any}>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
