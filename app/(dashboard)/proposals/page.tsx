// Proposal Management is a Variant 2+ module — disabled in Variant 1 (BRD §6, VIO-02)
import { redirect } from "next/navigation";
export default function ProposalsDisabled() {
  redirect("/dashboard");
}
