import KPIGrid from "@/components/dashboard/KPIGrid";
import type { DashboardStats as DashboardStatsType } from "@/lib/types/dashboard";

export default function DashboardStats(props: DashboardStatsType) {
  return <KPIGrid {...props} />;
}
