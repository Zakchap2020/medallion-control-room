import type { GameState, DatasetState, QualityDimensions, NarrativeEvent } from "../models/types";
import { FIXED_DATASETS, DATASET_BY_ID } from "../data/datasets";
import { INITIATIVE_BY_KEY } from "../data/initiatives";
import { generateCausalPressures, tickPressureLifecycle } from "./causalEngine";
import { computeMaturity } from "./maturityEngine";
import { compositeQuality, layerForState } from "./qualityUtils";
import { playSound } from "./soundEngine";

const CYCLE_LENGTH = 15;

// ── Quality drift per tick ─────────────────────────────────────────────────

function driftDataset(ds: DatasetState, tick: number, floors: Map<string, number>): DatasetState {
  const fd = DATASET_BY_ID[ds.id];
  if (!fd) return ds;

  const base = fd.criticality * 0.3;
  const protection = (ds.ownerId ? 0.5 : 0) + (ds.stewardId ? 0.6 : 0) + ((ds.custodianId || ds.engineerId) ? 0.3 : 0);
  const net = Math.max(0, base - protection);
  const v = () => (Math.random() - 0.5) * 1.0;
  const floor = floors.get(ds.id) ?? 0;
  const cl = (x: number) => Math.min(100, Math.max(floor, x));

  const q: QualityDimensions = {
    completeness: cl(ds.quality.completeness - net * 0.8 + v()),
    accuracy:     cl(ds.quality.accuracy     - net * 1.0 + v()),
    consistency:  cl(ds.quality.consistency  - net * 0.9 + v()),
    timeliness:   cl(ds.quality.timeliness   - net * 0.7 + v()),
    validity:     cl(ds.quality.validity      - net * 0.8 + v()),
  };

  // Governed datasets slowly improve
  if (protection >= 1.2 && tick % 3 === 0) {
    q.accuracy     = cl(q.accuracy     + 0.8);
    q.completeness = cl(q.completeness + 0.6);
    q.consistency  = cl(q.consistency  + 0.5);
  }

  const risk = Math.min(100, Math.max(0,
    ds.governanceRisk
    + (ds.ownerId ? -0.5 : 0.4)
    + (ds.stewardId ? -0.4 : 0.3)
    + ((ds.custodianId || ds.engineerId) ? -0.3 : 0.2)
  ));

  return { ...ds, quality: q, layer: layerForState({ ...ds, quality: q }), governanceRisk: risk, lastReviewedTick: tick };
}

// ── Stakeholder patience ───────────────────────────────────────────────────

function tickStakeholders(state: GameState): GameState["stakeholders"] {
  const execLiteracy = state.initiatives.some((i) => i.key === "executive-data-literacy" && i.status === "completed");
  const bonus = execLiteracy ? 0.4 : 0;
  return state.stakeholders.map((s) => {
    const drain = state.pressures.filter((p) => p.status === "open" && p.sourceStakeholderId === s.id).length * 0.8;
    const decay = Math.max(0, 0.3 + drain - bonus);
    return { ...s, patience: Math.max(0, Math.min(100, s.patience - decay)) };
  });
}

// ── Initiative progress ────────────────────────────────────────────────────

function tickInitiatives(state: GameState, tick: number): GameState["initiatives"] {
  return state.initiatives.map((ini) => {
    if (ini.status !== "active") return ini;
    const elapsed  = tick - ini.tickStarted;
    const total    = ini.tickCompletes - ini.tickStarted;
    const progress = Math.min(100, Math.round((elapsed / total) * 100));
    const status   = tick >= ini.tickCompletes ? "completed" as const : "active" as const;
    return { ...ini, progress, status };
  });
}

// ── Quality floors from completed initiatives ──────────────────────────────

function buildFloors(state: GameState): Map<string, number> {
  const m = new Map<string, number>();
  for (const ini of state.initiatives) {
    if (ini.status !== "completed") continue;
    const def = INITIATIVE_BY_KEY[ini.key];
    if (!def) continue;
    for (const e of def.effects) {
      if (e.type !== "quality_floor") continue;
      if (e.target) {
        m.set(e.target, Math.max(m.get(e.target) ?? 0, e.value));
      } else {
        for (const fd of FIXED_DATASETS) {
          m.set(fd.id, Math.max(m.get(fd.id) ?? 0, e.value));
        }
      }
    }
  }
  return m;
}

// ── Base capacity by model ─────────────────────────────────────────────────

function baseCapacity(state: GameState): number {
  const completed = state.initiatives.filter((i) => i.status === "completed");
  let cap = state.governanceModel === "centralised" ? 4 : state.governanceModel === "federated" ? 6 : 3;
  for (const ini of completed) {
    const def = INITIATIVE_BY_KEY[ini.key];
    if (!def) continue;
    for (const e of def.effects) {
      if (e.type === "capacity_increase") cap += e.value;
    }
  }
  return cap;
}

// ── Trust score ────────────────────────────────────────────────────────────

function computeTrust(state: GameState): number {
  const all = FIXED_DATASETS;
  let totalW = 0, weightedQ = 0;
  for (const fd of all) {
    const ds = state.datasets[fd.id];
    if (!ds) continue;
    totalW    += fd.criticality;
    weightedQ += compositeQuality(ds.quality) * fd.criticality;
  }
  const avgQ = totalW > 0 ? weightedQ / totalW : 50;
  const avgP = state.stakeholders.length > 0
    ? state.stakeholders.reduce((s, k) => s + k.patience, 0) / state.stakeholders.length
    : 50;
  const owned = all.filter((d) => state.datasets[d.id]?.ownerId).length;
  const stew  = all.filter((d) => state.datasets[d.id]?.stewardId).length;
  const tech  = all.filter((d) => state.datasets[d.id]?.custodianId || state.datasets[d.id]?.engineerId).length;
  const govCov = ((owned + stew + tech) / (all.length * 3)) * 100;
  const bonus  = state.initiatives.filter((i) => i.status === "completed").length * 2;
  return Math.min(100, Math.max(0, Math.round(avgQ * 0.4 + avgP * 0.3 + govCov * 0.3 + bonus)));
}

// ── Narrative events ───────────────────────────────────────────────────────

let _neIdx = 0;
function neId(): string { return `ne-${++_neIdx}`; }

function makeNarrativeEvents(
  newPressures: GameState["pressures"],
  completedNow: string[],
  tick: number
): NarrativeEvent[] {
  const events: NarrativeEvent[] = [];

  for (const p of newPressures) {
    const domain = DATASET_BY_ID[p.affectedDatasets[0] ?? ""]?.domain;
    events.push({ id: neId(), tick, type: "pressure", title: p.title, body: p.description, domain, severity: p.urgency === "critical" ? "critical" : "high" });
    playSound("incident_critical");
  }

  for (const key of completedNow) {
    const def = INITIATIVE_BY_KEY[key];
    events.push({ id: neId(), tick, type: "initiative", title: `${def?.shortName ?? key} — Complete`, body: `The ${def?.name ?? key} has concluded. Long-term effects are now active.`, severity: "info" });
    playSound("promotion_gold");
  }

  return events;
}

// ── Delayed effects ────────────────────────────────────────────────────────

function processDelayed(state: GameState, tick: number): Pick<GameState, "trustScore" | "stakeholders" | "delayedEffects" | "narrativeLog"> {
  const due    = state.delayedEffects.filter((d) => d.firesAtTick <= tick);
  const future = state.delayedEffects.filter((d) => d.firesAtTick > tick);
  if (due.length === 0) return { trustScore: state.trustScore, stakeholders: state.stakeholders, delayedEffects: future, narrativeLog: state.narrativeLog };

  let trustDelta = 0;
  const extras: NarrativeEvent[] = [];
  const updatedStakeholders = [...state.stakeholders];
  for (const d of due) {
    if (d.trustDelta) trustDelta += d.trustDelta;
    if (d.patienceDelta && d.stakeholderId) {
      const idx = updatedStakeholders.findIndex((s) => s.id === d.stakeholderId);
      if (idx >= 0) {
        updatedStakeholders[idx] = { ...updatedStakeholders[idx], patience: Math.min(100, Math.max(0, updatedStakeholders[idx].patience + d.patienceDelta)) };
      }
    }
    if (d.narrative) extras.push({ id: neId(), tick, type: "story", title: "Consequence", body: d.narrative, severity: "medium" });
  }
  return {
    trustScore: Math.min(100, Math.max(0, state.trustScore + trustDelta)),
    stakeholders: updatedStakeholders,
    delayedEffects: future,
    narrativeLog: [...extras, ...state.narrativeLog],
  };
}

// ── Main ──────────────────────────────────────────────────────────────────

export function runOneTick(state: GameState): Partial<GameState> {
  const tick = state.tick + 1;

  // 1. Cycle boundary — refresh capacity
  let cycleCapacity = { ...state.cycleCapacity };
  if (tick % CYCLE_LENGTH === 0) {
    const newTotal = baseCapacity(state);
    cycleCapacity  = { total: Math.max(state.cycleCapacity.total, newTotal), used: 0, cycleStartTick: tick };
    playSound("tick");
  }

  // 2. Build floors
  const floors = buildFloors(state);

  // 3. Drift datasets
  const driftedDs: Record<string, DatasetState> = {};
  for (const [id, ds] of Object.entries(state.datasets)) driftedDs[id] = driftDataset(ds, tick, floors);

  // 4. Tick initiatives
  const prevKeys = new Set(state.initiatives.filter((i) => i.status === "completed").map((i) => i.key));
  const updatedInits = tickInitiatives({ ...state, datasets: driftedDs }, tick);
  const completedNow = updatedInits.filter((i) => i.status === "completed" && !prevKeys.has(i.key)).map((i) => i.key);

  // 5. Tick stakeholders
  const updatedStakeholders = tickStakeholders({ ...state, datasets: driftedDs, pressures: state.pressures, initiatives: updatedInits });

  // 6. Pressure lifecycle
  const tickedPressures = tickPressureLifecycle(state.pressures, tick);

  // 7. Generate causal pressures
  const stateForCausal: GameState = { ...state, tick, datasets: driftedDs, pressures: tickedPressures, stakeholders: updatedStakeholders, initiatives: updatedInits, cycleCapacity };
  const newPressures = generateCausalPressures(stateForCausal);
  const updatedCooldowns = { ...state.pressureCooldowns };
  for (const p of newPressures) updatedCooldowns[p.type] = tick;
  const allPressures = [...tickedPressures, ...newPressures];

  // 8. Trust + maturity
  const trustScore = computeTrust({ ...stateForCausal, pressures: allPressures });
  const maturityResult = computeMaturity({ ...stateForCausal, pressures: allPressures, initiatives: updatedInits });
  const executiveSatisfaction = Math.round(updatedStakeholders.reduce((s, k) => s + k.patience, 0) / (updatedStakeholders.length || 1));

  // 9. Narrative + delayed
  const narrativeEvents = makeNarrativeEvents(newPressures, completedNow, tick);
  const delayedResult   = processDelayed({ ...stateForCausal, pressures: allPressures, stakeholders: updatedStakeholders }, tick);

  const nextLog = [...narrativeEvents, ...delayedResult.narrativeLog].slice(0, 200);

  return {
    tick,
    datasets: driftedDs,
    initiatives: updatedInits,
    stakeholders: delayedResult.stakeholders,
    pressures: allPressures,
    pressureCooldowns: updatedCooldowns,
    cycleCapacity,
    trustScore: delayedResult.trustScore,
    maturityStage: maturityResult.stage,
    executiveSatisfaction,
    narrativeLog: nextLog,
    delayedEffects: delayedResult.delayedEffects,
    peakTrustScore: Math.max(state.peakTrustScore, trustScore),
  };
}
