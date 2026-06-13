export type Department = "Finance" | "Sales" | "Marketing" | "HR" | "Operations";

export interface Dataset {
  id: string;
  name: string;
  department: Department;
  layer: "bronze";
  recordCount: number;
}

export interface Analyst {
  id: string;
  name: string;
  skills: {
    analysis: number;
    governance: number;
  };
  assignedDepartment?: Department;
  active: boolean;
}

export interface Silo {
  id: string;
  name: string;
  department: Department;
  riskLevel: number;
  importance: number;
  discovered: boolean;
  contained: boolean;
}

export type SignalType =
  | "inconsistency_detected"
  | "shadow_dataset_detected"
  | "schema_drift"
  | "duplicate_data_suspected"
  | "missing_owner"
  | "governance_risk_escalating";

export type SignalSeverity = "low" | "medium" | "high";

export interface Signal {
  id: string;
  type: SignalType;
  department: Department;
  severity: SignalSeverity;
  tick: number;
  relatedSiloId?: string;
  relatedDatasetId?: string;
  resolved: boolean;
}

// ── Phase 3 ──────────────────────────────────────────────────────────────────

export type PersonRoleType = "owner" | "steward" | "custodian";

export interface Person {
  id: string;
  name: string;
  roleType: PersonRoleType;
  skills: {
    governance: number;
    analysis: number;
    engineering: number;
  };
}

export interface CatalogueEntry {
  datasetId: string;
  name: string;
  layer: "bronze" | "silver" | "gold";
  ownerId?: string;
  stewardId?: string;
  custodianId?: string;
  trustScore: number;
  status: "official" | "shadow" | "deprecated";
  governanceRisk: number;
}

// ── Phase 4 ──────────────────────────────────────────────────────────────────

export type IncidentType =
  | "data_quality_failure"
  | "kpi_mismatch"
  | "silo_dependency_failure"
  | "governance_failure"
  | "pipeline_break";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus   = "open" | "in_progress" | "resolved" | "failed";

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  affectedDatasetIds: string[];
  source: "analyst" | "system" | "silo" | "governance";
  status: IncidentStatus;
  timeToResolve: number;           // ticks remaining
  triggeredBySignalId?: string;
  triggeredBySiloId?: string;
  createdAtTick: number;
}

export type ExecutivePressureType =
  | "board_request"
  | "finance_pressure"
  | "compliance_audit"
  | "ceo_escalation"
  | "operational_review";

export type PressureStatus = "pending" | "completed" | "failed";

export interface ExecutivePressure {
  id: string;
  type: ExecutivePressureType;
  demand: string;
  urgency: "low" | "medium" | "high" | "critical";
  requiredDatasetDomains: Department[];
  timeLimit: number;               // ticks remaining
  status: PressureStatus;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface GameState {
  datasets: Dataset[];
  analysts: Analyst[];
  persons: Person[];
  silos: Silo[];
  signals: Signal[];
  catalogue: Record<string, CatalogueEntry>;
  incidents: Incident[];
  executivePressures: ExecutivePressure[];
  tick: number;
  trustScore: number;
  reputation: number;
}
