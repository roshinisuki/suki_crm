// Forecast is a Variant 2+ module — disabled in Variant 1 (BRD §6, VIO-01)
import { redirect } from "next/navigation";
export default function ForecastDisabled() {
  redirect("/dashboard");
}
