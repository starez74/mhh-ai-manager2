import type { Crew } from "@/lib/types/crew";
import type { ResourceSummary } from "@/lib/types/resource";
import type { Vehicle } from "@/lib/types/vehicle";

export function buildResourceSummary(
  crews: Crew[],
  vehicles: Vehicle[]
): ResourceSummary {
  const activeCrews = crews.filter(crew => crew.is_active);
  const activeVehicles = vehicles.filter(vehicle => vehicle.is_active);

  return {
    totalCrews: activeCrews.length,
    availableCrews: activeCrews.filter(
      crew => crew.availability_status === "available"
    ).length,
    busyCrews: activeCrews.filter(crew => crew.availability_status === "busy")
      .length,
    unavailableCrews: activeCrews.filter(
      crew => crew.availability_status === "leave"
    ).length,
    totalVehicles: activeVehicles.length,
    availableVehicles: activeVehicles.filter(
      vehicle => vehicle.availability_status === "available"
    ).length,
    busyVehicles: activeVehicles.filter(
      vehicle => vehicle.availability_status === "busy"
    ).length,
    unavailableVehicles: activeVehicles.filter(
      vehicle => vehicle.availability_status === "maintenance"
    ).length,
  };
}
