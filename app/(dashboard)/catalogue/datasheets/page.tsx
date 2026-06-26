"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PageShell } from "@/components/ui/PageShell";
import { Modal } from "@/components/ui/Modal";
import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { formatDate } from "@/lib/ui-utils";
import {
  Plus, Search, Trash2, FileText, ExternalLink, Pencil,
  FileCheck,
} from "lucide-react";

export default function DatasheetsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: "", message: "", action: () => {} });
  const toast = useToast();

  const [formData, setFormData] = useState({
    id: "",
    productId: "",
    name: "",
    fileUrl: "",
    description: "",
    mimeType: "",
    fileSize: 0,
  });

  const loadDatasheets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (productFilter) params.productId = productFilter;
      const res = await fetch(`/api/catalogue/datasheets?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (data.success && data.data) setDocs(data.data);
    } catch {
      console.error("Failed to load datasheets");
    } finally {
      setLoading(false);
    }
  }, [search, productFilter]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/catalogue/products");
      const data = await res.json();
      if (data.success && data.data) setProducts(data.data);
    } catch {
      console.error("Failed to load products");
    }
  }, []);

  useEffect(() => { loadDatasheets(); loadProducts(); }, [loadDatasheets, loadProducts]);

  const resetForm = () => setFormData({ id: "", productId: "", name: "", fileUrl: "", description: "", mimeType: "", fileSize: 0 });

  const handleSave = async () => {
    if (!formData.productId || !formData.name || !formData.fileUrl) {
      toast.error("Product, name, and file URL are required");
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        productId: formData.productId,
        name: formData.name,
        fileUrl: formData.fileUrl,
        description: formData.description,
        mimeType: formData.mimeType || "application/pdf",
        fileSize: formData.fileSize || 0,
      };

      const res = formData.id
        ? await fetch(`/api/catalogue/datasheets/${formData.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/catalogue/datasheets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (data.success) {
        toast.success(formData.id ? "Datasheet updated" : "Datasheet added");
        setIsModalOpen(false);
        resetForm();
        loadDatasheets();
      } else {
        toast.error(data.message || "Failed to save datasheet");
      }
    } catch {
      toast.error("Failed to save datasheet");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Datasheet",
      message: "Are you sure you want to delete this datasheet? This action cannot be undone.",
      action: async () => {
        try {
          const res = await fetch(`/api/catalogue/datasheets/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            toast.success("Datasheet deleted");
            loadDatasheets();
          } else {
            toast.error(data.message || "Failed to delete datasheet");
          }
        } catch {
          toast.error("Failed to delete datasheet");
        }
      },
    });
  };

  const openEditModal = (doc: any) => {
    setFormData({
      id: doc.id,
      productId: doc.entityId,
      name: doc.name,
      fileUrl: doc.fileUrl,
      description: doc.description || "",
      mimeType: doc.mimeType || "",
      fileSize: doc.fileSize || 0,
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    resetForm();
    if (products.length > 0) setFormData((prev) => ({ ...prev, productId: products[0].id }));
    setIsModalOpen(true);
  };

  return (
    <PageShell
      title="Datasheets"
      subtitle="Upload and manage technical product datasheets"
      breadcrumb={[{ label: "Product Catalogue", href: "/catalogue" }, { label: "Datasheets" }]}
      action={
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={16} />
          Add Datasheet
        </button>
      }
    >
      {/* Filters */}
      <div className="mt-6 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search datasheets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="select-field max-w-[220px]"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th className="text-left">Document</th>
                <th className="text-left">Product</th>
                <th className="text-left">Version</th>
                <th className="text-left">Uploaded By</th>
                <th className="text-left">Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="inline-flex items-center gap-3 text-slate-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-transparent" />
                      <span className="text-sm font-medium">Loading datasheets...</span>
                    </div>
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500 font-medium">No datasheets found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Upload your first product datasheet to get started</p>
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 text-sm truncate max-w-[200px]">{doc.name}</div>
                          <div className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{doc.documentCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {doc.product ? (
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-700 truncate max-w-[160px]">{doc.product.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{doc.product.productCode}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                        <FileCheck size={13} className="text-slate-400" />
                        v{doc.version}
                      </span>
                    </td>
                    <td className="text-sm text-slate-600 truncate max-w-[120px]">{doc.uploadedBy?.name || "—"}</td>
                    <td className="text-sm text-slate-500 whitespace-nowrap">{formatDate(doc.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="action-icon-btn text-blue-600 hover:bg-blue-50" title="View">
                          <ExternalLink size={15} />
                        </a>
                        <button onClick={() => openEditModal(doc)} className="action-icon-btn" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="action-icon-btn text-rose-500 hover:bg-rose-50" title="Delete">
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
        title={formData.id ? "Edit Datasheet" : "Add Datasheet"}
        subtitle={formData.id ? "Update datasheet details" : "Link a new datasheet to a product"}
        size="md"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleSave} disabled={formLoading} className="btn-primary">
              {formLoading ? "Saving..." : formData.id ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <div className="p-6 space-y-4">
          <FormField label="Product" required>
            <Select value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })}>
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.productCode})</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Document Name" required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Technical Specifications Sheet"
            />
          </FormField>
          <FormField label="File URL" required hint="Link to a PDF or external document">
            <Input
              type="url"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              placeholder="https://example.com/datasheet.pdf"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this datasheet"
              rows={2}
            />
          </FormField>
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
