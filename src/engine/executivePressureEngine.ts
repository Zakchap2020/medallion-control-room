import type { GameState, ExecutivePressure, ExecutivePressureType, Department } from "../models/types";

interface PressureTemplate {
  demand: string;
  requiredDomains: Department[];
  baseTimeLimit: number;
}

const TEMPLATES: Record<ExecutivePressureType, PressureTemplate[]> = {
  board_request: [
    { demand: "Board requests accurate revenue breakdown by region — requires Finance & Sales alignment.", requiredDomains: ["Finance", "Sales"], baseTimeLimit: 8 },
    { demand: "Board needs verified headcount cost analysis before next investor meeting.", requiredDomains: ["HR", "Finance"], baseTimeLimit: 8 },
  ],
  finance_pressure: [
    { demand: "Finance requires reconciled transaction data for quarter-end close. No shadow sources.", requiredDomains: ["Finance"], baseTimeLimit: 6 },
    { demand: "Budget vs actuals variance report required — data must be governed and traceable.", requiredDomains: ["Finance", "Operations"], baseTimeLimit: 5 },
  ],
  compliance_audit: [
    { demand: "Regulator requests full data lineage for all customer-facing datasets.", requiredDomains: ["Sales", "Marketing"], baseTimeLimit: 10 },
    { demand: "Compliance requires evidence of active data stewardship for all PII-related datasets.", requiredDomains: ["HR", "Sales"], baseTimeLimit: 10 },
  ],
  ceo_escalation: [
    { demand: "CEO: 'Why are our dashboards showing conflicting KPIs?' — Needs immediate resolution.", requiredDomains: ["Finance", "Sales"], baseTimeLimit: 4 },
    { demand: "CEO escalation: single source of truth for operational metrics is now a Board priority.", requiredDomains: ["Operations", "Finance"], baseTimeLimit: 5 },
  ],
  operational_review: [
    { demand: "Ops review flagged inconsistent pipeline output across three departments.", requiredDomains: ["Operations"], baseTimeLimit: 7 },
    { demand: "Cross-departmental data quality review: all catalogue entries must have assigned owners.", requiredDomains: ["Finance", "HR", "Operations"], baseTimeLimit: 8 },
  ],
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let pressureCounter = 0;

export function generateExecutivePressure(state: GameState, tick: number): ExecutivePressure[] {
  const active = state.executivePressures.filter((p) => p.status === "pending");
  if (active.length >= 3) return [];

  const openIncidents = state.incidents.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  ).length;

  const entries = Object.values(state.catalogue);
  const avgGovRisk =
    entries.length === 0
      ? 0
      : entries.reduce((s, e) => s + e.governanceRisk, 0) / entries.length;

  const criticalSilos = state.silos.filter(
    (s) => !s.contained && s.riskLevel > 80
  ).length;

  const activeTypes = new Set(active.map((p) => p.type));
  const candidates: ExecutivePressureType[] = [];

  if (state.trustScore < 20 && !activeTypes.has("ceo_escalation"))
    candidates.push("ceo_escalation");
  if (openIncidents >= 3 && !activeTypes.has("operational_review"))
    candidates.push("operational_review");
  if (avgGovRisk > 60 && !activeTypes.has("compliance_audit"))
    candidates.push("compliance_audit");
  if (criticalSilos > 0 && !activeTypes.has("finance_pressure"))
    candidates.push("finance_pressure");
  if (tick > 0 && tick % 8 === 0 && !activeTypes.has("board_request"))
    candidates.push("board_request");

  if (candidates.length === 0) return [];

  const type = randomFrom(candidates);
  const template = randomFrom(TEMPLATES[type]);

  const urgency: ExecutivePressure["urgency"] =
    type === "ceo_escalation"   ? "critical" :
    type === "compliance_audit" ? "high"     :
    type === "finance_pressure" ? "high"     : "medium";

  pressureCounter++;
  return [
    {
      id: `exec-${tick}-${pressureCounter}`,
      type,
      demand: template.demand,
      urgency,
      requiredDatasetDomains: template.requiredDomains,
      timeLimit: template.baseTimeLimit,
      status: "pending",
    },
  ];
}

export function tickExecutivePressures(pressures: ExecutivePressure[]): {
  updated: ExecutivePressure[];
  failedCount: number;
  reputationDelta: number;
} {
  let failedCount = 0;
  let reputationDelta = 0;

  const updated = pressures.map((p) => {
    if (p.status !== "pending") return p;
    const remaining = p.timeLimit - 1;
    if (remaining <= 0) {
      failedCount++;
      reputationDelta -= p.urgency === "critical" ? 8 : p.urgency === "high" ? 5 : 3;
      return { ...p, timeLimit: 0, status: "failed" as const };
    }
    return { ...p, timeLimit: remaining };
  });

  return { updated, failedCount, reputationDelta };
}
