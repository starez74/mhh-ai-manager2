import type { Crew } from "@/lib/types/crew";
import type { Vehicle } from "@/lib/types/vehicle";

export type ResourceSummary = {
  totalCrews: number;
  availableCrews: number;
  busyCrews: number;
  unavailableCrews: number;
  totalVehicles: number;
  availableVehicles: number;
  busyVehicles: number;
  unavailableVehicles: number;
};

export type ResourceData = {
  crews: Crew[];
  vehicles: Vehicle[];
  summary: ResourceSummary;
};
