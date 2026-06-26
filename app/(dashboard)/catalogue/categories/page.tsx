"use client";

import { useState, useEffect, useCallback } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { PageShell } from "@/components/ui/PageShell";
import { Modal } from "@/components/ui/Modal";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { cn } from "@/lib/ui-utils";
import {
  Plus, Search, Pencil, Trash2, Check, X, FolderTree, Package,
} from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const toast = useToast();
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: "", message: "", action: () => {} });

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    isActive: true,
  });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const res = await fetch(`/api/catalogue/categories?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (data.success && data.data) setCategories(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const resetForm = () => setFormData({ id: "", name: "", description: "", isActive: true });

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      const res = await fetch("/api/catalogue/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category created successfully");
        setIsModalOpen(false);
        resetForm();
        loadCategories();
      } else {
        toast.error(data.message || "Failed to create category");
      }
    } catch {
      toast.error("Failed to create category");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/catalogue/categories/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category updated successfully");
        setIsModalOpen(false);
        resetForm();
        loadCategories();
      } else {
        toast.error(data.message || "Failed to update category");
      }
    } catch {
      toast.error("Failed to update category");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Category",
      message: "Are you sure you want to delete this category? This action cannot be undone.",
      action: async () => {
        try {
          const res = await fetch(`/api/catalogue/categories/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            toast.success("Category deleted successfully");
            loadCategories();
          } else {
            toast.error(data.message || "Failed to delete category");
          }
        } catch {
          toast.error("Failed to delete category");
        }
      },
    });
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    try {
      const res = await fetch(`/api/catalogue/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cat.name, description: cat.description, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Category status updated");
        loadCategories();
      } else {
        toast.error(data.message || "Failed to update category");
      }
    } catch {
      toast.error("Failed to update category status");
    }
  };

  const openEditModal = (category: any) => {
    setFormData({ id: category.id, name: category.name, description: category.description || "", isActive: category.isActive });
    setIsModalOpen(true);
  };

  const filtered = categories;

  return (
    <PageShell
      title="Categories"
      subtitle="Organize products into hierarchical categories"
      breadcrumb={[{ label: "Product Catalogue", href: "/catalogue" }, { label: "Categories" }]}
      action={
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus size={16} />
          Add Category
        </button>
      }
    >
      {/* Search bar */}
      <div className="mt-6 mb-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Description</th>
                <th className="text-center">Products</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="inline-flex items-center gap-3 text-slate-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-transparent" />
                      <span className="text-sm font-medium">Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <FolderTree size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500 font-medium">No categories found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Add your first product category to get started</p>
                  </td>
                </tr>
              ) : (
                filtered.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FolderTree size={16} />
                        </div>
                        <span className="font-semibold text-slate-800 truncate max-w-[200px]">{category.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-500 truncate max-w-[280px]">{category.description || "—"}</td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                        <Package size={13} className="text-slate-400" />
                        {category.productCount || 0}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
                        category.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(category)} className="action-icon-btn" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(category.id, category.isActive)}
                          className={cn("action-icon-btn", category.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50")}
                          title={category.isActive ? "Deactivate" : "Activate"}
                        >
                          {category.isActive ? <X size={15} /> : <Check size={15} />}
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="action-icon-btn text-rose-500 hover:bg-rose-50" title="Delete">
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

      {/* Add/Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? "Edit Category" : "Add Category"}
        subtitle={formData.id ? "Update category details" : "Create a new product category"}
        size="sm"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
            <button
              onClick={formData.id ? handleUpdate : handleCreate}
              disabled={formLoading || !formData.name.trim()}
              className="btn-primary"
            >
              {formLoading ? "Saving..." : formData.id ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <div className="p-6 space-y-4">
          <FormField label="Category Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Industrial Valves"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this category"
              rows={3}
            />
          </FormField>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="text-sm font-medium text-slate-700">Active</span>
          </label>
        </div>
      </Modal>

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
