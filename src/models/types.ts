export type Department = "Finance" | "Sales" | "Marketing" | "HR" | "Operations";
export type DataLayer  = "bronze" | "silver" | "gold";

export interface DatasetQuality {
  accuracy:     number; // correctness, 0–100
  completeness: number; // no missing values, 0–100
  consistency:  number; // schema / format coherence, 0–100
  uniqueness:   number; // no duplicates, 0–100
  timeliness:   number; // data currency, 0–100
}

export interface Dataset {
  id: string;
  name: string;
  department: Department;
  layer: DataLayer;
  recordCount: number;
  quality: DatasetQuality;
  autoFixEnabled: boolean;
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
  layer: DataLayer;
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
  timeToResolve: number;
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
  timeLimit: number;
  status: PressureStatus;
}

// ── Phase 5 ──────────────────────────────────────────────────────────────────

export type HealingAction =
  | "clean_nulls"
  | "deduplicate"
  | "standardise_schema"
  | "aggregate"
  | "validate_governance_rules"
  | "auto_promoted";

export interface HealingEvent {
  id: string;
  tick: number;
  datasetId: string;
  datasetName: string;
  action: HealingAction;
  success: boolean;
  qualityDelta: number;
  note?: string;
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
  healingEvents: HealingEvent[];
  tick: number;
  trustScore: number;
  reputation: number;
}
