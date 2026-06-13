import type { GameState, Incident, IncidentSeverity, IncidentType } from "../models/types";

const SEVERITY_TTR: Record<IncidentSeverity, number> = {
  critical: 4,
  high: 7,
  medium: 12,
  low: 20,
};

let incidentCounter = 0;

function make(
  tick: number,
  fields: Omit<Incident, "id" | "status" | "timeToResolve" | "createdAtTick">
): Incident {
  incidentCounter++;
  return {
    id: `inc-${tick}-${incidentCounter}`,
    status: "open",
    timeToResolve: SEVERITY_TTR[fields.severity],
    createdAtTick: tick,
    ...fields,
  };
}

export function generateIncidents(state: GameState, tick: number): Incident[] {
  const created: Incident[] = [];
  const active = state.incidents.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  );

  // ── 1. Silo risk ──────────────────────────────────────────────────────────
  for (const silo of state.silos) {
    if (!silo.discovered || silo.contained || silo.riskLevel <= 80) continue;
    if (active.some((i) => i.triggeredBySiloId === silo.id)) continue;

    const dept = state.datasets.filter((d) => d.department === silo.department);
    created.push(
      make(tick, {
        type: "silo_dependency_failure",
        severity: silo.riskLevel > 90 ? "critical" : "high",
        affectedDatasetIds: dept.slice(0, 2).map((d) => d.id),
        source: "silo",
        triggeredBySiloId: silo.id,
      })
    );
  }

  // ── 2. Governance failures ────────────────────────────────────────────────
  for (const [dsId, entry] of Object.entries(state.catalogue)) {
    if (entry.governanceRisk <= 75 || entry.ownerId) continue;
    if (
      active.some(
        (i) => i.type === "governance_failure" && i.affectedDatasetIds.includes(dsId)
      )
    )
      continue;

    created.push(
      make(tick, {
        type: "governance_failure",
        severity: entry.governanceRisk > 90 ? "critical" : "high",
        affectedDatasetIds: [dsId],
        source: "governance",
      })
    );
  }

  // ── 3. Stale signals escalate ─────────────────────────────────────────────
  for (const signal of state.signals) {
    if (signal.resolved) continue;
    if (tick - signal.tick < 3) continue;
    if (signal.severity === "low") continue;
    if (active.some((i) => i.triggeredBySignalId === signal.id)) continue;

    const typeMap: Record<string, IncidentType> = {
      schema_drift: "pipeline_break",
      missing_owner: "governance_failure",
      governance_risk_escalating: "governance_failure",
    };
    const incType: IncidentType = typeMap[signal.type] ?? "data_quality_failure";

    const dept = state.datasets.filter((d) => d.department === signal.department);
    created.push(
      make(tick, {
        type: incType,
        severity: signal.severity === "high" ? "high" : "medium",
        affectedDatasetIds: dept.slice(0, 1).map((d) => d.id),
        source: "analyst",
        triggeredBySignalId: signal.id,
      })
    );
  }

  // Cap at 2 new incidents per tick to prevent cascading explosion
  return created.slice(0, 2);
}

export function tickIncidents(incidents: Incident[]): {
  updated: Incident[];
  failedCount: number;
  reputationDelta: number;
} {
  let failedCount = 0;
  let reputationDelta = 0;

  const updated = incidents.map((inc) => {
    if (inc.status === "resolved" || inc.status === "failed") return inc;
    const remaining = inc.timeToResolve - 1;
    if (remaining <= 0) {
      failedCount++;
      reputationDelta -= inc.severity === "critical" ? 5 : inc.severity === "high" ? 3 : 1;
      return { ...inc, timeToResolve: 0, status: "failed" as const };
    }
    return { ...inc, timeToResolve: remaining };
  });

  return { updated, failedCount, reputationDelta };
}

export function computeIncidentTrustDelta(incidents: Incident[]): number {
  let delta = 0;
  for (const inc of incidents) {
    if (inc.status !== "open" && inc.status !== "in_progress") continue;
    if (inc.severity === "critical") delta -= 3;
    else if (inc.severity === "high") delta -= 2;
    else if (inc.severity === "medium") delta -= 1;
  }
  return Math.max(-8, delta);
}
