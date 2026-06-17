// Forecast is a Variant 2+ module ù disabled in Variant 1 (BRD º6, VIO-01)
import { redirect } from "next/navigation";
export default function ForecastDisabled() {
  redirect("/dashboard");
}