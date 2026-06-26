"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { PageShell } from "@/components/ui/PageShell";
import { cn } from "@/lib/ui-utils";
import {
  Plus, Search, Trash2, Check, X, FileText, BookOpen,
  Package, Eye,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { formatCurrency } = useCurrency();
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: "", message: "", action: () => {} });

  const view = searchParams.get("view") || "";

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      if (view) params.view = view;
      const res = await fetch(`/api/catalogue/products?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (data.success && data.data) setProducts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, view]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/catalogue/categories");
      const data = await res.json();
      if (data.success && data.data) setCategories(data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Product",
      message: "Are you sure you want to delete this product? This action cannot be undone.",
      action: async () => {
        try {
          const res = await fetch(`/api/catalogue/products/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            toast.success("Product deleted successfully");
            loadProducts();
          } else {
            toast.error(data.message || "Failed to delete product");
          }
        } catch {
          toast.error("Failed to delete product");
        }
      },
    });
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/catalogue/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Product status updated");
        loadProducts();
      } else {
        toast.error(data.message || "Failed to update product");
      }
    } catch {
      toast.error("Failed to update product status");
    }
  };

  const pageTitle = view === "datasheets" ? "Datasheets" : view === "brochures" ? "Brochures" : "Products";
  const pageSubtitle = view === "datasheets" ? "Browse product datasheets" : view === "brochures" ? "Browse product brochures" : "Manage your product catalogue";

  return (
    <PageShell
      title={pageTitle}
      subtitle={pageSubtitle}
      breadcrumb={[{ label: "Product Catalogue", href: "/catalogue" }, { label: pageTitle }]}
      action={!view ? (
        <button onClick={() => router.push("/catalogue/products/new")} className="btn-primary">
          <Plus size={16} />
          Add Product
        </button>
      ) : undefined}
    >
      {/* Filters */}
      <div className="mt-6 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="select-field max-w-[200px]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th className="text-left">Code</th>
                <th className="text-left">Product Name</th>
                <th className="text-left">Category</th>
                <th className="text-left">Unit</th>
                <th className="text-right">Base Price</th>
                <th className="text-center">Status</th>
                {!view && <th className="text-center">Docs</th>}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={view ? 7 : 8} className="text-center py-12">
                    <div className="inline-flex items-center gap-3 text-slate-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-transparent" />
                      <span className="text-sm font-medium">Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={view ? 7 : 8} className="text-center py-12">
                    <Package size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500 font-medium">No products found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Add your first product to get started</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td className="font-mono text-xs text-slate-600 whitespace-nowrap">{product.productCode}</td>
                    <td>
                      <button
                        onClick={() => router.push(`/catalogue/products/${product.id}`)}
                        className="font-semibold text-slate-800 hover:text-[var(--accent)] truncate max-w-[220px] text-left"
                      >
                        {product.name}
                      </button>
                    </td>
                    <td className="text-slate-500 truncate max-w-[150px]">{product.category?.name || "—"}</td>
                    <td className="text-slate-500 whitespace-nowrap">{product.unit || "—"}</td>
                    <td className="text-right font-medium text-slate-700 whitespace-nowrap">{product.basePrice ? formatCurrency(product.basePrice) : "—"}</td>
                    <td className="text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                        product.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {!view && (
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {product.datasheetUrl ? (
                            <a href={product.datasheetUrl} target="_blank" rel="noopener noreferrer" className="action-icon-btn text-blue-600 hover:bg-blue-50" title="Datasheet">
                              <FileText size={14} />
                            </a>
                          ) : (
                            <span className="w-[30px]" />
                          )}
                          {product.brochureUrl ? (
                            <a href={product.brochureUrl} target="_blank" rel="noopener noreferrer" className="action-icon-btn text-rose-600 hover:bg-rose-50" title="Brochure">
                              <BookOpen size={14} />
                            </a>
                          ) : (
                            <span className="w-[30px]" />
                          )}
                        </div>
                      </td>
                    )}
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/catalogue/products/${product.id}`)} className="action-icon-btn" title="View Details">
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(product.id, product.isActive)}
                          className={cn("action-icon-btn", product.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50")}
                          title={product.isActive ? "Deactivate" : "Activate"}
                        >
                          {product.isActive ? <X size={15} /> : <Check size={15} />}
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="action-icon-btn text-rose-500 hover:bg-rose-50" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState({ isOpen: false, title: "", message: "", action: () => {} })}
        isDestructive={true}
      />
    </PageShell>
  );
}
