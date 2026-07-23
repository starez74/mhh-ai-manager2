"use client";

import { useState } from "react";
import {
  createCrew,
  setCrewArchived,
  updateCrew,
} from "@/lib/services/crewService";
import {
  createVehicle,
  setVehicleArchived,
  updateVehicle,
} from "@/lib/services/vehicleService";
import type {
  Crew,
  CrewAvailabilityStatus,
  CrewInput,
} from "@/lib/types/crew";
import type { ResourceSummary } from "@/lib/types/resource";
import type {
  Vehicle,
  VehicleAvailabilityStatus,
  VehicleInput,
} from "@/lib/types/vehicle";

type ResourceCentreProps = {
  userId: string;
  crews: Crew[];
  vehicles: Vehicle[];
  summary: ResourceSummary;
  loading: boolean;
  error: string;
  onRetry: () => void;
};

const emptyCrew: CrewInput = {
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  skills: [],
  availability_status: "available",
};

const emptyVehicle: VehicleInput = {
  name: "",
  registration: "",
  vehicle_type: "",
  capacity_notes: "",
  service_due_at: null,
  inspection_due_at: null,
  availability_status: "available",
};

function statusLabel(value: string): string {
  return value.replace("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function crewToInput(crew: Crew): CrewInput {
  return {
    name: crew.name,
    contact_name: crew.contact_name,
    phone: crew.phone,
    email: crew.email,
    skills: crew.skills,
    availability_status: crew.availability_status,
  };
}

function vehicleToInput(vehicle: Vehicle): VehicleInput {
  return {
    name: vehicle.name,
    registration: vehicle.registration,
    vehicle_type: vehicle.vehicle_type,
    capacity_notes: vehicle.capacity_notes,
    service_due_at: vehicle.service_due_at,
    inspection_due_at: vehicle.inspection_due_at,
    availability_status: vehicle.availability_status,
  };
}

export default function ResourceCentre({
  userId,
  crews,
  vehicles,
  summary,
  loading,
  error,
  onRetry,
}: ResourceCentreProps) {
  const [crewForm, setCrewForm] = useState<CrewInput>(emptyCrew);
  const [vehicleForm, setVehicleForm] = useState<VehicleInput>(emptyVehicle);
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [showCrewForm, setShowCrewForm] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [success, setSuccess] = useState("");

  function resetFeedback() {
    setMutationError("");
    setSuccess("");
  }

  function openNewCrew() {
    resetFeedback();
    setEditingCrewId(null);
    setCrewForm(emptyCrew);
    setShowCrewForm(true);
  }

  function openEditCrew(crew: Crew) {
    resetFeedback();
    setEditingCrewId(crew.id);
    setCrewForm(crewToInput(crew));
    setShowCrewForm(true);
  }

  function openNewVehicle() {
    resetFeedback();
    setEditingVehicleId(null);
    setVehicleForm(emptyVehicle);
    setShowVehicleForm(true);
  }

  function openEditVehicle(vehicle: Vehicle) {
    resetFeedback();
    setEditingVehicleId(vehicle.id);
    setVehicleForm(vehicleToInput(vehicle));
    setShowVehicleForm(true);
  }

  async function saveCrew() {
    resetFeedback();
    setSaving(true);
    try {
      if (editingCrewId) {
        await updateCrew(editingCrewId, crewForm);
        setSuccess("Crew updated.");
      } else {
        await createCrew(userId, crewForm);
        setSuccess("Crew added.");
      }
      setShowCrewForm(false);
      setCrewForm(emptyCrew);
      setEditingCrewId(null);
      await onRetry();
    } catch (saveError) {
      setMutationError(
        saveError instanceof Error ? saveError.message : "Unable to save crew."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveVehicle() {
    resetFeedback();
    setSaving(true);
    try {
      if (editingVehicleId) {
        await updateVehicle(editingVehicleId, vehicleForm);
        setSuccess("Vehicle updated.");
      } else {
        await createVehicle(userId, vehicleForm);
        setSuccess("Vehicle added.");
      }
      setShowVehicleForm(false);
      setVehicleForm(emptyVehicle);
      setEditingVehicleId(null);
      await onRetry();
    } catch (saveError) {
      setMutationError(
        saveError instanceof Error ? saveError.message : "Unable to save vehicle."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCrewArchived(crew: Crew) {
    const action = crew.is_active ? "archive" : "restore";
    if (
      crew.is_active &&
      !window.confirm(`Archive ${crew.name}? Existing job text will not be changed.`)
    ) {
      return;
    }

    resetFeedback();
    setSaving(true);
    try {
      await setCrewArchived(crew.id, crew.is_active);
      setSuccess(`Crew ${action}d.`);
      await onRetry();
    } catch (archiveError) {
      setMutationError(
        archiveError instanceof Error
          ? archiveError.message
          : `Unable to ${action} crew.`
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleVehicleArchived(vehicle: Vehicle) {
    const action = vehicle.is_active ? "archive" : "restore";
    if (
      vehicle.is_active &&
      !window.confirm(
        `Archive ${vehicle.name}? Existing job text will not be changed.`
      )
    ) {
      return;
    }

    resetFeedback();
    setSaving(true);
    try {
      await setVehicleArchived(vehicle.id, vehicle.is_active);
      setSuccess(`Vehicle ${action}d.`);
      await onRetry();
    } catch (archiveError) {
      setMutationError(
        archiveError instanceof Error
          ? archiveError.message
          : `Unable to ${action} vehicle.`
      );
    } finally {
      setSaving(false);
    }
  }

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
            Manage crew and fleet availability for operational planning.
          </p>
        </div>
      </div>

      {(mutationError || success) && (
        <div className={`notice ${mutationError ? "diagnosticError" : ""}`}>
          {mutationError || success}
        </div>
      )}

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
            <div>
              <h3>Crews</h3>
              <span className="badge">{crews.length}</span>
            </div>
            <button className="btn small" onClick={openNewCrew} disabled={saving}>
              Add crew
            </button>
          </div>

          {showCrewForm && (
            <div className="resourceForm">
              <h4>{editingCrewId ? "Edit crew" : "Add crew"}</h4>
              <label htmlFor="crew-name">Crew name *</label>
              <input
                id="crew-name"
                value={crewForm.name}
                onChange={event =>
                  setCrewForm({ ...crewForm, name: event.target.value })
                }
              />

              <div className="grid two">
                <div>
                  <label htmlFor="crew-contact">Contact name</label>
                  <input
                    id="crew-contact"
                    value={crewForm.contact_name}
                    onChange={event =>
                      setCrewForm({
                        ...crewForm,
                        contact_name: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label htmlFor="crew-phone">Phone</label>
                  <input
                    id="crew-phone"
                    value={crewForm.phone}
                    onChange={event =>
                      setCrewForm({ ...crewForm, phone: event.target.value })
                    }
                  />
                </div>
              </div>

              <label htmlFor="crew-email">Email</label>
              <input
                id="crew-email"
                type="email"
                value={crewForm.email}
                onChange={event =>
                  setCrewForm({ ...crewForm, email: event.target.value })
                }
              />

              <label htmlFor="crew-skills">Skills</label>
              <input
                id="crew-skills"
                value={crewForm.skills.join(", ")}
                onChange={event =>
                  setCrewForm({
                    ...crewForm,
                    skills: event.target.value.split(","),
                  })
                }
                placeholder="Heavy lifting, packing, piano moves"
              />

              <label htmlFor="crew-status">Availability</label>
              <select
                id="crew-status"
                value={crewForm.availability_status}
                onChange={event =>
                  setCrewForm({
                    ...crewForm,
                    availability_status: event.target
                      .value as CrewAvailabilityStatus,
                  })
                }
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="leave">Leave</option>
              </select>

              <div className="actions">
                <button className="btn" onClick={saveCrew} disabled={saving}>
                  {saving ? "Saving…" : "Save crew"}
                </button>
                <button
                  className="btn secondary"
                  onClick={() => setShowCrewForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {crews.length === 0 ? (
            <p className="muted">No crew records have been added yet.</p>
          ) : (
            crews.map(crew => (
              <div className="resourceRow" key={crew.id}>
                <div>
                  <strong>{crew.name}</strong>
                  <div className="muted">
                    {crew.contact_name || "No contact"}
                    {crew.phone ? ` · ${crew.phone}` : ""}
                  </div>
                  {crew.skills.length > 0 && (
                    <div className="resourceSkills">{crew.skills.join(" · ")}</div>
                  )}
                </div>
                <div className="resourceRowActions">
                  <div className="resourceRowStatus">
                    {!crew.is_active && <span className="badge">Inactive</span>}
                    <span className="badge">
                      {statusLabel(crew.availability_status)}
                    </span>
                  </div>
                  <div className="actions">
                    <button
                      className="btn secondary small"
                      onClick={() => openEditCrew(crew)}
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      className={`btn small ${crew.is_active ? "danger" : "secondary"}`}
                      onClick={() => toggleCrewArchived(crew)}
                      disabled={saving}
                    >
                      {crew.is_active ? "Archive" : "Restore"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="sectionHead">
            <div>
              <h3>Vehicles</h3>
              <span className="badge">{vehicles.length}</span>
            </div>
            <button
              className="btn small"
              onClick={openNewVehicle}
              disabled={saving}
            >
              Add vehicle
            </button>
          </div>

          {showVehicleForm && (
            <div className="resourceForm">
              <h4>{editingVehicleId ? "Edit vehicle" : "Add vehicle"}</h4>
              <label htmlFor="vehicle-name">Vehicle name *</label>
              <input
                id="vehicle-name"
                value={vehicleForm.name}
                onChange={event =>
                  setVehicleForm({ ...vehicleForm, name: event.target.value })
                }
              />

              <div className="grid two">
                <div>
                  <label htmlFor="vehicle-registration">Registration</label>
                  <input
                    id="vehicle-registration"
                    value={vehicleForm.registration}
                    onChange={event =>
                      setVehicleForm({
                        ...vehicleForm,
                        registration: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label htmlFor="vehicle-type">Vehicle type</label>
                  <input
                    id="vehicle-type"
                    value={vehicleForm.vehicle_type}
                    onChange={event =>
                      setVehicleForm({
                        ...vehicleForm,
                        vehicle_type: event.target.value,
                      })
                    }
                    placeholder="Truck, van, ute"
                  />
                </div>
              </div>

              <label htmlFor="vehicle-capacity">Capacity notes</label>
              <textarea
                id="vehicle-capacity"
                value={vehicleForm.capacity_notes}
                onChange={event =>
                  setVehicleForm({
                    ...vehicleForm,
                    capacity_notes: event.target.value,
                  })
                }
              />

              <div className="grid two">
                <div>
                  <label htmlFor="vehicle-service">Service due</label>
                  <input
                    id="vehicle-service"
                    type="date"
                    value={vehicleForm.service_due_at ?? ""}
                    onChange={event =>
                      setVehicleForm({
                        ...vehicleForm,
                        service_due_at: event.target.value || null,
                      })
                    }
                  />
                </div>
                <div>
                  <label htmlFor="vehicle-inspection">Inspection due</label>
                  <input
                    id="vehicle-inspection"
                    type="date"
                    value={vehicleForm.inspection_due_at ?? ""}
                    onChange={event =>
                      setVehicleForm({
                        ...vehicleForm,
                        inspection_due_at: event.target.value || null,
                      })
                    }
                  />
                </div>
              </div>

              <label htmlFor="vehicle-status">Availability</label>
              <select
                id="vehicle-status"
                value={vehicleForm.availability_status}
                onChange={event =>
                  setVehicleForm({
                    ...vehicleForm,
                    availability_status: event.target
                      .value as VehicleAvailabilityStatus,
                  })
                }
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <div className="actions">
                <button className="btn" onClick={saveVehicle} disabled={saving}>
                  {saving ? "Saving…" : "Save vehicle"}
                </button>
                <button
                  className="btn secondary"
                  onClick={() => setShowVehicleForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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
                  {vehicle.capacity_notes && (
                    <div className="resourceSkills">{vehicle.capacity_notes}</div>
                  )}
                </div>
                <div className="resourceRowActions">
                  <div className="resourceRowStatus">
                    {!vehicle.is_active && <span className="badge">Inactive</span>}
                    <span className="badge">
                      {statusLabel(vehicle.availability_status)}
                    </span>
                  </div>
                  <div className="actions">
                    <button
                      className="btn secondary small"
                      onClick={() => openEditVehicle(vehicle)}
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      className={`btn small ${vehicle.is_active ? "danger" : "secondary"}`}
                      onClick={() => toggleVehicleArchived(vehicle)}
                      disabled={saving}
                    >
                      {vehicle.is_active ? "Archive" : "Restore"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
