import type { CatalogueEntry, Dataset, GameState } from "../models/types";

// Risk delta per tick for each missing/present role
const MISSING = { owner: 5, steward: 2, custodian: 1 };
const PRESENT  = { owner: 4, steward: 2, custodian: 2 };

export function initCatalogueEntries(
  existing: Record<string, CatalogueEntry>,
  datasets: Dataset[]
): Record<string, CatalogueEntry> {
  const updated = { ...existing };
  for (const ds of datasets) {
    if (!updated[ds.id]) {
      updated[ds.id] = {
        datasetId: ds.id,
        name: ds.name,
        layer: ds.layer,
        trustScore: 50,
        status: "shadow",
        governanceRisk: 0,
      };
    }
  }
  return updated;
}

export function updateGovernanceRisks(
  catalogue: Record<string, CatalogueEntry>
): Record<string, CatalogueEntry> {
  const updated: Record<string, CatalogueEntry> = {};

  for (const [id, entry] of Object.entries(catalogue)) {
    let riskDelta = 0;

    // Penalties for absent roles
    if (!entry.ownerId)    riskDelta += MISSING.owner;
    if (!entry.stewardId)  riskDelta += MISSING.steward;
    if (!entry.custodianId) riskDelta += MISSING.custodian;

    // Bonuses for present roles
    if (entry.ownerId)    riskDelta -= PRESENT.owner;
    if (entry.stewardId)  riskDelta -= PRESENT.steward;
    if (entry.custodianId) riskDelta -= PRESENT.custodian;

    const newRisk = Math.max(0, Math.min(100, entry.governanceRisk + riskDelta));

    const status: CatalogueEntry["status"] =
      entry.status === "deprecated"
        ? "deprecated"
        : entry.ownerId && newRisk < 60
        ? "official"
        : "shadow";

    const trustDelta = entry.ownerId ? 1 : -1;
    const newTrust = Math.max(0, Math.min(100, entry.trustScore + trustDelta));

    updated[id] = { ...entry, governanceRisk: newRisk, status, trustScore: newTrust };
  }

  return updated;
}

// Dept-level average governance risk — used by silo engine
export function deptGovernanceRisk(
  catalogue: Record<string, CatalogueEntry>,
  datasets: Dataset[]
): Partial<Record<string, number>> {
  const totals: Record<string, { sum: number; count: number }> = {};

  for (const ds of datasets) {
    const entry = catalogue[ds.id];
    if (!entry) continue;
    if (!totals[ds.department]) totals[ds.department] = { sum: 0, count: 0 };
    totals[ds.department].sum   += entry.governanceRisk;
    totals[ds.department].count += 1;
  }

  const result: Partial<Record<string, number>> = {};
  for (const [dept, { sum, count }] of Object.entries(totals)) {
    result[dept] = count > 0 ? sum / count : 0;
  }
  return result;
}

// Global trust drain from governance failures (capped to avoid runaway penalty)
export function computeGovernanceTrustDelta(
  catalogue: Record<string, CatalogueEntry>
): number {
  const entries = Object.values(catalogue);
  const critical = entries.filter((e) => e.governanceRisk > 80).length;
  const high     = entries.filter((e) => e.governanceRisk > 60).length;
  return Math.max(-5, -(critical * 2 + high));
}

// Return dataset ids that should trigger governance signals this tick
export function findGovernanceAlerts(
  state: GameState
): { datasetId: string; type: "missing_owner" | "governance_risk_escalating" }[] {
  const alerts: { datasetId: string; type: "missing_owner" | "governance_risk_escalating" }[] = [];

  for (const [id, entry] of Object.entries(state.catalogue)) {
    if (!entry.ownerId && entry.governanceRisk > 30) {
      alerts.push({ datasetId: id, type: "missing_owner" });
    } else if (entry.governanceRisk > 70) {
      alerts.push({ datasetId: id, type: "governance_risk_escalating" });
    }
  }

  // Return top 3 most critical to avoid flooding the feed
  return alerts
    .sort((a, b) =>
      (state.catalogue[b.datasetId]?.governanceRisk ?? 0) -
      (state.catalogue[a.datasetId]?.governanceRisk ?? 0)
    )
    .slice(0, 3);
}
