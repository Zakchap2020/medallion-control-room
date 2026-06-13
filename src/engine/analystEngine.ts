import type { GameState, Signal, SignalType, Department } from "../models/types";
import { findGovernanceAlerts } from "./governanceEngine";

const SIGNAL_TYPES: SignalType[] = [
  "inconsistency_detected",
  "shadow_dataset_detected",
  "schema_drift",
  "duplicate_data_suspected",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let signalCounter = 0;

export function generateSignals(state: GameState, tick: number): Signal[] {
  const newSignals: Signal[] = [];

  const deptCounts: Partial<Record<Department, number>> = {};
  for (const ds of state.datasets) {
    deptCounts[ds.department] = (deptCounts[ds.department] ?? 0) + 1;
  }

  const assignedDepts = new Set(
    state.analysts
      .filter((a) => a.active && a.assignedDepartment)
      .map((a) => a.assignedDepartment!)
  );

  // Signals from assigned analysts (data quality + silo detection)
  for (const analyst of state.analysts) {
    if (!analyst.active || !analyst.assignedDepartment) continue;

    const dept = analyst.assignedDepartment;
    const count = deptCounts[dept] ?? 0;
    if (count === 0) continue;

    const detectionChance = Math.min(0.75, 0.25 + count * 0.06 + analyst.skills.analysis * 0.02);
    if (Math.random() > detectionChance) continue;

    const undiscoveredSilo = state.silos.find(
      (s) => s.department === dept && !s.discovered && !s.contained
    );

    const type: SignalType = undiscoveredSilo ? "shadow_dataset_detected" : randomFrom(SIGNAL_TYPES);

    let severity: "low" | "medium" | "high" = "low";
    if (undiscoveredSilo) {
      if (undiscoveredSilo.riskLevel > 60) severity = "high";
      else if (undiscoveredSilo.riskLevel > 30) severity = "medium";
    } else {
      const roll = Math.random();
      if (roll < 0.15) severity = "high";
      else if (roll < 0.45) severity = "medium";
    }

    signalCounter += 1;
    newSignals.push({
      id: `sig-${tick}-${signalCounter}`,
      type,
      department: dept,
      severity,
      tick,
      relatedSiloId: undiscoveredSilo?.id,
      resolved: false,
    });
  }

  // Passive signals from unmonitored departments with many datasets
  for (const dept of Object.keys(deptCounts) as Department[]) {
    if (assignedDepts.has(dept)) continue;
    const count = deptCounts[dept] ?? 0;
    if (count < 4) continue;
    if (Math.random() > 0.15) continue;

    signalCounter += 1;
    newSignals.push({
      id: `sig-${tick}-${signalCounter}`,
      type: randomFrom(SIGNAL_TYPES),
      department: dept,
      severity: "low",
      tick,
      resolved: false,
    });
  }

  // Governance gap signals — surfaced by analysts who detect accountability holes
  const govAlerts = findGovernanceAlerts(state);
  for (const alert of govAlerts) {
    const ds = state.datasets.find((d) => d.id === alert.datasetId);
    if (!ds) continue;

    // Only emit if an analyst is watching this department (or there's lots of unowned data)
    const watched = assignedDepts.has(ds.department);
    const unownedInDept = Object.values(state.catalogue).filter(
      (e) => !e.ownerId && state.datasets.find((d) => d.id === e.datasetId)?.department === ds.department
    ).length;

    if (!watched && unownedInDept < 3) continue;
    if (Math.random() > 0.5) continue; // not every gap surfaces every tick

    const risk = state.catalogue[alert.datasetId]?.governanceRisk ?? 0;
    const severity: "low" | "medium" | "high" =
      risk > 70 ? "high" : risk > 40 ? "medium" : "low";

    signalCounter += 1;
    newSignals.push({
      id: `sig-${tick}-${signalCounter}`,
      type: alert.type,
      department: ds.department,
      severity,
      tick,
      relatedDatasetId: alert.datasetId,
      resolved: false,
    });
  }

  return newSignals;
}
