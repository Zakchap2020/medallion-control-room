import type { GameState, Person, Dataset, PersonRoleType } from "../models/types";
import { compositeQuality } from "./medallionEngine";

type Template = (p: Person, ds: Dataset) => string;

// ── Role-specific event templates ─────────────────────────────────────────────

const OWNER_GOOD: Template[] = [
  (p, ds) => `${p.name} signed off data accountability review for ${ds.name}`,
  (p, ds) => `${p.name} confirmed ${ds.name} meets business data standards this cycle`,
  (p, ds) => `${p.name} approved stakeholder access policy update for ${ds.name}`,
  (p)     => `${p.name} presented data governance health report to the steering committee`,
  (p, ds) => `${p.name} resolved a data definition conflict blocking ${ds.name} reporting`,
];

const OWNER_POOR: Template[] = [
  (p, ds) => `${p.name} flagged unresolved accountability gaps in ${ds.name}`,
  (p, ds) => `${p.name} unable to obtain sign-off on ${ds.name} remediation budget`,
  (p)     => `${p.name} raised escalation on conflicting data definitions — no consensus reached`,
  (p, ds) => `${p.name} warned that ${ds.name} may fail the next compliance review`,
];

const STEWARD_GOOD: Template[] = [
  (p, ds) => `${p.name} updated the business glossary for ${ds.name}`,
  (p, ds) => `${p.name} confirmed ${ds.name} quality meets acceptance criteria`,
  (p)     => `${p.name} completed data lineage documentation across the Silver pipeline`,
  (p, ds) => `${p.name} identified and closed a data gap in ${ds.name} before escalation`,
];

const STEWARD_POOR: Template[] = [
  (p, ds) => `${p.name} raised a consistency issue in ${ds.name} — manual review required`,
  (p, ds) => `${p.name} found undocumented transformations in ${ds.name}`,
  (p)     => `${p.name} requested emergency quality audit — anomalies detected across datasets`,
  (p, ds) => `${p.name} warns that ${ds.name} risks losing "official" status`,
];

const CUSTODIAN_GOOD: Template[] = [
  (p, ds) => `${p.name} optimised the ingestion pipeline for ${ds.name}`,
  (p, ds) => `${p.name} completed schema validation checks on ${ds.name}`,
  (p)     => `${p.name} updated platform access controls following the governance review`,
  (p, ds) => `${p.name} resolved a technical blocker on ${ds.name} pipeline throughput`,
];

const CUSTODIAN_POOR: Template[] = [
  (p, ds) => `${p.name} flagged growing technical debt in the ${ds.name} ingestion layer`,
  (p, ds) => `${p.name} raised a schema drift ticket for ${ds.name} — still unresolved`,
  (p)     => `${p.name} warned the team about pipeline instability — manual intervention needed`,
  (p, ds) => `${p.name} unable to patch ${ds.name} — access controls are blocking the fix`,
];

const NO_ROLES_EVENTS: (() => string)[] = [
  () => "No Data Owner in Finance — accountability gap is widening this quarter",
  () => "Sales datasets lack stewardship — quality standards are slipping unchecked",
  () => "HR data has no assigned steward — business glossary is now out of date",
  () => "Operations custodian vacancy is creating technical governance gaps",
  () => "Multiple datasets have no ownership — trust in data is eroding across departments",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function templatesByRole(role: PersonRoleType, healthy: boolean): Template[] {
  if (role === "owner")     return healthy ? OWNER_GOOD     : OWNER_POOR;
  if (role === "steward")   return healthy ? STEWARD_GOOD   : STEWARD_POOR;
  return healthy ? CUSTODIAN_GOOD : CUSTODIAN_POOR;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateCharacterEvent(state: GameState): string | null {
  // ~25% chance per tick — enough to feel alive, not overwhelming
  if (Math.random() > 0.25) return null;

  const { persons, datasets, catalogue } = state;

  interface Pair { person: Person; dataset: Dataset; role: PersonRoleType }
  const pairs: Pair[] = [];

  datasets.forEach((ds) => {
    const entry = catalogue[ds.id];
    if (!entry) return;

    const tryAdd = (pid: string | undefined, role: PersonRoleType) => {
      const p = pid ? persons.find((x) => x.id === pid) : undefined;
      if (p) pairs.push({ person: p, dataset: ds, role });
    };

    tryAdd(entry.ownerId,     "owner");
    tryAdd(entry.stewardId,   "steward");
    tryAdd(entry.custodianId, "custodian");
  });

  // No assignments yet → generate a governance concern
  if (pairs.length === 0) {
    return Math.random() < 0.6 ? pick(NO_ROLES_EVENTS)() : null;
  }

  const { person, dataset, role } = pick(pairs);
  const cq      = compositeQuality(dataset.quality);
  const healthy = cq > 55;

  return pick(templatesByRole(role, healthy))(person, dataset);
}
