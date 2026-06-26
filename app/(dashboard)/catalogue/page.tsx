"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/ui/PageShell";
import { cn } from "@/lib/ui-utils";
import {
  FolderTree, Package, SlidersHorizontal, FileText,
  BookOpen, ArrowRight,
} from "lucide-react";

const MODULES = [
  {
    title: "Categories",
    description: "Organize products into hierarchical categories with attributes and sub-categories.",
    href: "/catalogue/categories",
    icon: FolderTree,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    title: "Products",
    description: "Manage your full product inventory with pricing, variants, tags and availability.",
    href: "/catalogue/products",
    icon: Package,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    title: "Specifications",
    description: "Define specification groups and attribute fields mapped to product categories.",
    href: "/catalogue/specifications",
    icon: SlidersHorizontal,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    iconBg: "bg-violet-100 text-violet-600",
  },
  {
    title: "Datasheets",
    description: "Upload and manage technical datasheets with version control and document preview.",
    href: "/catalogue/datasheets",
    icon: FileText,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    title: "Brochures",
    description: "Create and publish marketing brochures with cover images and campaign metadata.",
    href: "/catalogue/brochures",
    icon: BookOpen,
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    iconBg: "bg-rose-100 text-rose-600",
  },
];

export default function CatalogueLandingPage() {
  const router = useRouter();

  return (
    <PageShell
      title="Product Catalogue"
      subtitle="Manage your product catalogue, categories, specifications, and documentation."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.title}
              onClick={() => router.push(mod.href)}
              className={cn(
                "group relative text-left p-6 rounded-2xl border border-slate-200/80 bg-white",
                "hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5",
                "transition-all duration-200 flex flex-col gap-4 min-h-[180px]"
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", mod.iconBg)}>
                  <Icon size={24} />
                </div>
                <ArrowRight
                  size={18}
                  className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{mod.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{mod.description}</p>
              </div>
              <div className={cn("h-1 rounded-full bg-gradient-to-r", mod.color)} />
            </button>
          );
        })}
      </div>
    </PageShell>
  );
}
