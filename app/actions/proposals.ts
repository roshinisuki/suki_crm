"use server";

// Proposal Management is a Variant 2+ module ù disabled in Variant 1 (BRD º6, VIO-02)
const DISABLED = { success: false, message: "Proposal Management is not available in Variant 1.", data: [] as any[] };

export async function getProposalsAction(_params?: { search?: string; status?: string }) {
  return DISABLED;
}
export async function getProposalByIdAction(_id: string) {
  return DISABLED;
}
export async function createProposalAction(_data: any) {
  return DISABLED;
}
export async function updateProposalAction(_data: any) {
  return DISABLED;
}
export async function advanceProposalStatusAction(_id: string, _newStatus: string) {
  return DISABLED;
}
export async function deleteProposalAction(_id: string) {
  return DISABLED;
}