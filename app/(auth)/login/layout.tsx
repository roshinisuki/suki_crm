import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Suki Marketing CRM",
  description:
    "Sign in to your Suki Marketing CRM account to manage your marketing campaigns and customer relationships.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
