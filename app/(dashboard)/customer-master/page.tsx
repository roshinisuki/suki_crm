"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCustomersAction, createCustomerAction, updateCustomerAction, deleteCustomersAction } from "@/app/actions/customers";
import { getUsersAction } from "@/app/actions/users";
import { Customer, User } from "@/types";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";

const Ico = ({ d, size = 16, className }: { d: string; size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const icons = {
  plus: "M12 4v16m8-8H4",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
  x: "M6 18L18 6M6 6l12 12",
  users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  check: "M5 13l4 4L19 7",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  map: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Inactive: "bg-red-100 text-red-800 border-red-200",
    Prospect: "bg-amber-100 text-amber-800 border-amber-200",
    APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
    REJECTED: "bg-slate-200 text-slate-700 border-slate-300",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    New: "bg-indigo-100 text-indigo-800 border-indigo-200",
    Contacted: "bg-cyan-100 text-cyan-800 border-cyan-200",
    Qualified: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    Converted: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Lost: "bg-rose-100 text-rose-800 border-rose-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

export default function CustomerMasterPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [executives, setExecutives] = useState<User[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const toast = useToast();
  const [confirmState, setConfirmState] = useState<{isOpen: boolean; title: string; message: string; action: () => void}>({ isOpen: false, title: "", message: "", action: () => {} });

  const [formData, setFormData] = useState({
    id: "",
    customerCode: "",
    name: "",
    email: "",
    phone: "",
    city: "",
    status: "New" as any,
    assignedUserId: "",
  });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await getCustomersAction(params);
      if (res.success && res.data) {
        setCustomers(res.data as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutives = async () => {
    if (user?.role === "Admin" || user?.role === "MarketingLead") {
      const res = await getUsersAction();
      if (res.success && res.data) {
        setExecutives(res.data.filter((u: any) => u.role === "MarketingExecutive") as any);
      }
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter]);

  useEffect(() => {
    loadExecutives();
  }, [user]);

  const openCreateModal = () => {
    setFormData({
      id: "",
      customerCode: "",
      name: "",
      email: "",
      phone: "",
      city: "",
      status: "New",
      assignedUserId: "",
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setFormData({
      id: c.id,
      customerCode: c.customerCode,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      city: c.city || "",
      status: c.status,
      assignedUserId: c.assignedUserId || "",
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg("");

    if (!formData.customerCode.trim() || !formData.name.trim()) {
      setErrorMsg("Customer Code and Company Name are required");
      setFormLoading(false);
      return;
    }

    let res;
    if (formData.id) {
      res = await updateCustomerAction(formData);
    } else {
      res = await createCustomerAction(formData);
    }

    if (res.success) {
      setIsModalOpen(false);
      loadCustomers();
    } else {
      setErrorMsg(res.message || "Operation failed");
    }
    setFormLoading(false);
  };

  const toggleAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map(c => c.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteSelected = () => {
    setConfirmState({
      isOpen: true,
      title: "Delete Customers",
      message: `Are you sure you want to permanently delete ${selectedIds.length} customer(s)? This will erase ALL their visits, subscriptions, and portal access. This action CANNOT be undone.`,
      action: async () => {
        setIsDeleting(true);
        const res = await deleteCustomersAction(selectedIds);
        setIsDeleting(false);
        if (res.success) {
          toast.success(res.message || "Customers deleted.");
          setSelectedIds([]);
          loadCustomers();
        } else {
          toast.error(res.message || "Failed to delete customers.");
        }
      }
    });
  };

  const handleDeleteOne = (c: Customer) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Customer",
      message: `Delete "${c.name}" (${c.customerCode})?\n\nThis will permanently erase ALL their visits, subscriptions, and portal access.\n\nThis action CANNOT be undone.`,
      action: async () => {
        setIsDeleting(true);
        const res = await deleteCustomersAction([c.id]);
        setIsDeleting(false);
        if (res.success) {
          toast.success(`"${c.name}" has been deleted.`);
          setSelectedIds(prev => prev.filter(x => x !== c.id));
          loadCustomers();
        } else {
          toast.error(res.message || "Failed to delete customer.");
        }
      }
    });
  };


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Leads Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and track your customer pipeline.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#DF643B] text-white rounded-md text-[13px] font-medium hover:bg-[#D1552C] transition-colors shadow-sm"
        >
          <Ico d={icons.plus} size={16} />
          Create Lead
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-amber-50 border border-amber-200/50 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col">
          <p className="text-sm font-semibold text-slate-700">Total Leads (All)</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-black text-slate-900">{customers.length}</h3>
            <div className="text-amber-500 opacity-80">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600">
             <span>Live Data</span>
          </div>
        </div>
        
        {/* Card 2 */}
        <div className="bg-blue-50 border border-blue-200/50 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col">
          <p className="text-sm font-semibold text-slate-700">Active Clients</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-black text-slate-900">{customers.filter(c => c.status === "Active").length}</h3>
            <div className="text-blue-500 opacity-80">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600">
             <span>Live Data</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-100 border border-slate-200/50 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col">
          <p className="text-sm font-semibold text-slate-700">Qualified Leads</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-black text-slate-900">{customers.filter(c => c.status === "Qualified").length}</h3>
            <div className="text-slate-600 opacity-80">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600">
             <span>Live Data</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-red-50 border border-red-200/50 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col">
          <p className="text-sm font-semibold text-slate-700">Lost / Inactive</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-black text-slate-900">{customers.filter(c => c.status === "Inactive").length}</h3>
            <div className="text-red-500 opacity-80">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600">
             <span>Live Data</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800">Leads List</h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Ico d={icons.search} size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600 font-medium focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
              <option disabled>--- Legacy ---</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Prospect">Prospect</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {selectedIds.length > 0 && (
            <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between text-sm font-medium animate-in fade-in slide-in-from-top-4">
              <span>{selectedIds.length} lead(s) selected</span>
              <button 
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center gap-2 shadow-sm border border-red-400 text-xs"
              >
                {isDeleting ? "Deleting..." : "Delete Selected"}
              </button>
            </div>
          )}
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    checked={customers.length > 0 && selectedIds.length === customers.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-5 py-4">Lead Code</th>
                <th className="px-5 py-4">Lead Name</th>
                <th className="px-5 py-4">City</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm text-slate-500">
                    Loading leads data...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm text-slate-500">
                    No leads found.
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(c.id) ? 'bg-indigo-50/50' : ''}`}>
                    <td className="px-5 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleOne(c.id)}
                      />
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-medium">{c.customerCode}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 block leading-tight">{c.name}</span>
                          <span className="text-[10px] text-slate-400 block leading-tight">{c.email || "No email"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.city || "-"}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 text-slate-400">
                        <button
                          onClick={() => router.push(`/customer-master/${c.id}`)}
                          className="hover:text-emerald-600 transition-colors p-1"
                          title="View Lead Details"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="hover:text-blue-600 transition-colors p-1"
                          title="Edit Lead"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>

                        {(user?.role === "Admin" || user?.role === "MarketingLead") && (
                          <button
                            onClick={() => handleDeleteOne(c)}
                            disabled={isDeleting}
                            className="hover:text-red-600 transition-colors p-1 disabled:opacity-50"
                            title="Delete Lead"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-800">
                {formData.id ? "Edit Lead Record" : "Add New Lead"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <Ico d={icons.x} size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 overflow-y-auto space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-[8px] bg-[#ffdad6] border border-[#ffb4ab] text-[13px] text-[#93000a] font-medium text-center">
                    {errorMsg}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Customer Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    disabled={!!formData.id}
                    value={formData.customerCode}
                    onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                    placeholder="e.g. RAM-101" 
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60" 
                  />
                  <p className="text-xs text-slate-500 mt-1">Manual identifier code (cannot be changed once created).</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter company name" 
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Email address" 
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone number" 
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City" 
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                      <option disabled>--- Legacy ---</option>
                      <option value="Active">Active</option>
                      <option value="Prospect">Prospect</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                {(user?.role === "Admin" || user?.role === "MarketingLead") && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assign to Executive</label>
                    <select 
                      value={formData.assignedUserId}
                      onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="">Unassigned</option>
                      {executives.map(exec => (
                        <option key={exec.id} value={exec.id}>{exec.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-[#0D2137] hover:bg-[#1a365d] transition-colors shadow-sm disabled:opacity-75"
                >
                  {formLoading ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        isDestructive={true}
      />
    </div>
  );
}
