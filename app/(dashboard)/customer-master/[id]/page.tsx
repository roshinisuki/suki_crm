"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCustomerByIdAction, updateCustomerAction } from "@/app/actions/customers";
import { createFollowUpAction } from "@/app/actions/followUps";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";

const icons = {
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  check: "M5 13l4 4L19 7",
  plus: "M12 4v16m8-8H4",
};

const Ico = ({ d, size = 16, className }: { d: string; size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Converted", "Lost"];

export default function LeadDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Follow Up Form State
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  const loadCustomer = async () => {
    setLoading(true);
    const res = await getCustomerByIdAction(params.id);
    if (res.success) {
      setCustomer(res.data);
    } else {
      toast.error("Failed to load lead details.");
      router.push("/customer-master");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCustomer();
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!customer) return;
    const res = await updateCustomerAction({
      id: customer.id,
      customerCode: customer.customerCode,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      status: newStatus,
      assignedUserId: customer.assignedUserId
    });
    if (res.success) {
      toast.success(`Status updated to ${newStatus}`);
      setCustomer({ ...customer, status: newStatus });
    } else {
      toast.error(res.message || "Failed to update status");
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFollowUp(true);
    const res = await createFollowUpAction({
      customerId: params.id,
      scheduledTime: followUpDate,
      notes: followUpNotes,
      assignedToId: user?.id
    });
    
    if (res.success) {
      toast.success("Follow-up scheduled.");
      setShowFollowUpModal(false);
      setFollowUpDate("");
      setFollowUpNotes("");
      loadCustomer(); // Refresh data
    } else {
      toast.error(res.message || "Failed to schedule follow-up.");
    }
    setSavingFollowUp(false);
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading Lead details...</div>;
  }
  if (!customer) return null;

  const currentIndex = STATUS_OPTIONS.indexOf(customer.status);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/customer-master")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <Ico d={icons.back} size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{customer.name}</h1>
            <p className="text-sm text-slate-500 font-medium">{customer.customerCode} • {customer.city || "No City"}</p>
          </div>
        </div>
        
        {/* Only show 'Create Deal' when Qualified */}
        {customer.status === "Qualified" && (
          <button 
            onClick={() => router.push(`/subscription`)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 animate-in fade-in zoom-in duration-300"
          >
            <Ico d={icons.check} />
            Create Deal / Convert
          </button>
        )}
      </div>

      {/* Progress Pipeline */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Lead Pipeline Stage</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STATUS_OPTIONS.map((status, index) => {
            const isCompleted = currentIndex > index || (currentIndex === index && (status === "Converted" || status === "Lost"));
            const isCurrent = currentIndex === index && status !== "Converted" && status !== "Lost";
            
            let colorClass = "bg-slate-100 text-slate-400 border-slate-200";
            if (isCompleted) colorClass = "bg-emerald-50 text-emerald-600 border-emerald-200";
            if (isCurrent) colorClass = "bg-indigo-500 text-white border-indigo-600 shadow-md";
            
            return (
              <React.Fragment key={status}>
                <div 
                  onClick={() => handleStatusChange(status)}
                  className={`flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${colorClass} ${status === "Lost" && isCurrent ? "!bg-rose-500 !text-white !border-rose-600" : ""}`}
                >
                  {status}
                </div>
                {index < STATUS_OPTIONS.length - 1 && (
                  <div className={`h-0.5 w-8 shrink-0 ${isCompleted ? "bg-emerald-200" : "bg-slate-100"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-1">Email Address</p>
                <p className="text-slate-800 font-medium">{customer.email || "Not provided"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-1">Phone Number</p>
                <p className="text-slate-800 font-medium">{customer.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold mb-1">Created On</p>
                <p className="text-slate-800 font-medium">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Follow-ups & Activity</h3>
              <button 
                onClick={() => setShowFollowUpModal(true)}
                className="text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Ico d={icons.plus} size={14} />
                Add Follow Up
              </button>
            </div>
            <div className="p-5">
              {customer.followUps.length === 0 ? (
                <p className="text-sm text-slate-500 italic text-center py-4">No follow-ups recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {customer.followUps.map((f: any) => (
                    <div key={f.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Ico d={icons.clock} size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {new Date(f.nextMeetingDate).toLocaleString()}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          Assigned to: {f.assignedUser?.name || "System"} • Status: {f.status}
                        </p>
                        {f.remarks && (
                          <p className="text-sm text-slate-600 mt-2 bg-white p-3 rounded-lg border border-slate-100">
                            {f.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Follow Up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Schedule Follow-up</h2>
              <button onClick={() => setShowFollowUpModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <Ico d={icons.plus} size={20} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddFollowUp} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date & Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes (Optional)</label>
                <textarea 
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" 
                  placeholder="What is this follow up regarding?"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowFollowUpModal(false)} 
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingFollowUp}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-75"
                >
                  {savingFollowUp ? "Saving..." : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
