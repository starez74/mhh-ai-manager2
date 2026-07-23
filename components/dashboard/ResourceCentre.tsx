"use client";

import type { Crew } from "@/lib/types/crew";
import type { ResourceSummary } from "@/lib/types/resource";
import type { Vehicle } from "@/lib/types/vehicle";

type ResourceCentreProps = {
  crews: Crew[];
  vehicles: Vehicle[];
  summary: ResourceSummary;
  loading: boolean;
  error: string;
  onRetry: () => void;
};

function statusLabel(value: string): string {
  return value.replace("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function ResourceCentre({
  crews,
  vehicles,
  summary,
  loading,
  error,
  onRetry,
}: ResourceCentreProps) {
  if (loading) {
    return (
      <div className="card">
        <h2>Resources</h2>
        <p className="muted">Loading crew and vehicle resources…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Resources</h2>
        <div className="notice diagnosticError">{error}</div>
        <button className="btn" onClick={onRetry}>Try again</button>
      </div>
    );
  }

  return (
    <>
      <div className="sectionHead">
        <div>
          <h2>Resource Centre</h2>
          <p className="muted">
            Crew and fleet availability for operational planning.
          </p>
        </div>
      </div>

      <div className="grid four resourceMetrics">
        <div className="card">
          <div className="metric">{summary.totalCrews}</div>
          <div>Active crews</div>
          <div className="muted">
            {summary.availableCrews} available · {summary.busyCrews} busy
          </div>
        </div>
        <div className="card">
          <div className="metric">{summary.unavailableCrews}</div>
          <div>Crews on leave</div>
        </div>
        <div className="card">
          <div className="metric">{summary.totalVehicles}</div>
          <div>Active vehicles</div>
          <div className="muted">
            {summary.availableVehicles} available · {summary.busyVehicles} busy
          </div>
        </div>
        <div className="card">
          <div className="metric">{summary.unavailableVehicles}</div>
          <div>Vehicles in maintenance</div>
        </div>
      </div>

      <div className="grid two resourceLists">
        <div className="card">
          <div className="sectionHead">
            <h3>Crews</h3>
            <span className="badge">{crews.length}</span>
          </div>
          {crews.length === 0 ? (
            <p className="muted">No crew records have been added yet.</p>
          ) : (
            crews.map(crew => (
              <div className="resourceRow" key={crew.id}>
                <div>
                  <strong>{crew.name}</strong>
                  <div className="muted">
                    {crew.contact_name || "No contact"}{crew.phone ? ` · ${crew.phone}` : ""}
                  </div>
                </div>
                <div className="resourceRowStatus">
                  {!crew.is_active && <span className="badge">Inactive</span>}
                  <span className="badge">{statusLabel(crew.availability_status)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="sectionHead">
            <h3>Vehicles</h3>
            <span className="badge">{vehicles.length}</span>
          </div>
          {vehicles.length === 0 ? (
            <p className="muted">No vehicle records have been added yet.</p>
          ) : (
            vehicles.map(vehicle => (
              <div className="resourceRow" key={vehicle.id}>
                <div>
                  <strong>{vehicle.name}</strong>
                  <div className="muted">
                    {vehicle.registration || "No registration"}
                    {vehicle.vehicle_type ? ` · ${vehicle.vehicle_type}` : ""}
                  </div>
                </div>
                <div className="resourceRowStatus">
                  {!vehicle.is_active && <span className="badge">Inactive</span>}
                  <span className="badge">{statusLabel(vehicle.availability_status)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
