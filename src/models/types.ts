// ── Governance model ───────────────────────────────────────────────────────
export type GovernanceModel = "centralised" | "federated" | "platform_led";

// ── Organisational maturity ────────────────────────────────────────────────
export type MaturityStage = "chaos" | "stabilising" | "governed" | "data_driven";

// ── End states ─────────────────────────────────────────────────────────────
export type EndState =
  | "data_driven"
  | "politically_fractured"
  | "technically_stable"
  | "shadow_dominated"
  | "over_governed";

// ── Game phases ────────────────────────────────────────────────────────────
export type GamePhase = "setup" | "playing" | "ended";

// ── Business domains ───────────────────────────────────────────────────────
export type DataDomain = "Finance" | "Sales" | "Marketing" | "HR" | "Operations";

// ── Medallion layers ───────────────────────────────────────────────────────
export type DataLayer = "bronze" | "silver" | "gold";

// ── Data classification ────────────────────────────────────────────────────
export type DataClassification = "public" | "internal" | "confidential" | "restricted";

// ── Staff roles ────────────────────────────────────────────────────────────
export type StaffRole = "DataOwner" | "DataSteward" | "DataEngineer" | "DataCustodian";

// ── Stakeholder roles (uncontrollable pressure generators) ─────────────────
export type StakeholderRole = "CFO" | "CRO" | "CMO" | "CHRO" | "COO" | "BoardMember" | "CEO";

// ── Person traits ──────────────────────────────────────────────────────────
export type PersonTrait = "methodical" | "ambitious" | "veteran" | "reliable" | "political" | "impatient";

// ── Pressure types ─────────────────────────────────────────────────────────
export type PressureType =
  | "governance_gap"
  | "kpi_conflict"
  | "data_quality_failure"
  | "compliance_risk"
  | "executive_escalation"
  | "dependency_cascade"
  | "audit_demand"
  | "stakeholder_frustration"
  | "shadow_data_risk";

// ── Quality dimensions ─────────────────────────────────────────────────────
export interface QualityDimensions {
  completeness: number;
  accuracy:     number;
  consistency:  number;
  timeliness:   number;
  validity:     number;
}

// ── Static dataset definition (never changes at runtime) ───────────────────
export interface FixedDataset {
  id:                    string;
  name:                  string;
  domain:                DataDomain;
  description:           string;
  classification:        DataClassification;
  criticality:           1 | 2 | 3 | 4 | 5;
  upstreamIds:           string[];
  usageCount:            number;
  stakeholderImportance: number;
  politicalCharge:       string;
}

// ── Runtime dataset state ──────────────────────────────────────────────────
export interface DatasetState {
  id:               string;
  quality:          QualityDimensions;
  layer:            DataLayer;
  ownerId?:         string;
  stewardId?:       string;
  custodianId?:     string;
  engineerId?:      string;
  governanceRisk:   number;
  lastReviewedTick: number;
}

// ── Named staff member (assignable governance actor) ──────────────────────
export interface StaffMember {
  id:          string;
  name:        string;
  title:       string;
  role:        StaffRole;
  domain:      DataDomain;
  skills: {
    governance: number;
    technical:  number;
    influence:  number;
  };
  trait:       PersonTrait;
  avatarIndex: number;
  active:      boolean;
}

// ── Business stakeholder (uncontrollable; generates pressure) ─────────────
export interface Stakeholder {
  id:          string;
  name:        string;
  title:       string;
  role:        StakeholderRole;
  domain:      DataDomain;
  patience:    number;
  avatarIndex: number;
  trait:       PersonTrait;
}

// ── Resolution option ──────────────────────────────────────────────────────
export interface ResolutionOption {
  id:           string;
  label:        string;
  description:  string;
  capacityCost: number;
  effect: {
    trustDelta?:   number;
    patienceBoost?: number;
    stakeholderId?: string;
    datasetEffects?: Array<{
      datasetId:      string;
      riskReduction?: number;
      qualityBoost?:  Partial<QualityDimensions>;
    }>;
    initiativeUnlock?: string;
    narrativeOutcome:  string;
    delayedTrustDelta?: number;
    delayedTicks?:      number;
  };
}

// ── Business pressure ──────────────────────────────────────────────────────
export interface BusinessPressure {
  id:                   string;
  type:                 PressureType;
  title:                string;
  description:          string;
  detail:               string;
  causeChain:           string[];
  affectedDatasets:     string[];
  sourceStakeholderId?: string;
  urgency:              "critical" | "high" | "medium";
  tickAppeared:         number;
  tickDeadline?:        number;
  status:               "open" | "resolved" | "escalated" | "expired";
  resolutionOptions:    ResolutionOption[];
  resolvedAtTick?:      number;
  consequenceIfIgnored: string;
}

// ── Static initiative definition ──────────────────────────────────────────
export interface InitiativeDefinition {
  key:                  string;
  name:                 string;
  shortName:            string;
  description:          string;
  domain?:              DataDomain;
  cyclesRequired:       number;
  capacityCostPerCycle: number;
  launchCost:           number;
  prerequisites?:       string[];
  effects: Array<{
    type:    "quality_floor" | "risk_reduction" | "trust_boost" | "capacity_increase" | "pressure_reduction" | "maturity_boost";
    target?: string;
    value:   number;
  }>;
}

// ── Active (runtime) initiative ───────────────────────────────────────────
export interface ActiveInitiative {
  id:            string;
  key:           string;
  status:        "active" | "completed" | "abandoned";
  tickStarted:   number;
  tickCompletes: number;
  progress:      number;
}

// ── Narrative event ────────────────────────────────────────────────────────
export interface NarrativeEvent {
  id:        string;
  tick:      number;
  type:      "story" | "pressure" | "resolution" | "initiative" | "milestone" | "warning" | "audit";
  title:     string;
  body:      string;
  domain?:   DataDomain;
  severity:  "critical" | "high" | "medium" | "info";
}

// ── Cycle capacity ─────────────────────────────────────────────────────────
export interface CycleCapacity {
  total:          number;
  used:           number;
  cycleStartTick: number;
}

// ── Delayed effect ─────────────────────────────────────────────────────────
export interface DelayedEffect {
  id:             string;
  firesAtTick:    number;
  trustDelta?:    number;
  patienceDelta?: number;
  stakeholderId?: string;
  narrative?:     string;
}

// ── Main game state ───────────────────────────────────────────────────────
export interface GameState {
  governanceModel:       GovernanceModel | null;
  datasets:              Record<string, DatasetState>;
  staff:                 StaffMember[];
  stakeholders:          Stakeholder[];
  pressures:             BusinessPressure[];
  initiatives:           ActiveInitiative[];
  narrativeLog:          NarrativeEvent[];
  delayedEffects:        DelayedEffect[];

  tick:                  number;
  trustScore:            number;
  maturityStage:         MaturityStage;
  executiveSatisfaction: number;

  cycleCapacity:         CycleCapacity;

  gamePhase:             GamePhase;
  peakTrustScore:        number;
  nextAuditTick:         number;
  auditsPassed:          number;
  auditsFailed:          number;
  endState?:             EndState;
  finalScore?:           number;

  pressureCooldowns:     Record<string, number>;

  startGame:        (model: GovernanceModel) => void;
  runTick:          () => void;
  endSession:       () => void;
  resetGame:        () => void;
  assignRole:       (datasetId: string, role: StaffRole, staffId: string | undefined) => void;
  resolvePressure:  (pressureId: string, optionId: string) => void;
  launchInitiative: (initiativeKey: string) => void;
}
