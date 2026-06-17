// Marketing Log is a Variant 2+ module — disabled in Variant 1 (BRD §6)
import { redirect } from "next/navigation";
export default function MarketingLogDisabled() {
  redirect("/dashboard");
}
