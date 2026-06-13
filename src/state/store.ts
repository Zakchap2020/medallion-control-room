import { create } from "zustand";
import type { GameState, GovernanceModel, StaffRole, ResolutionOption } from "../models/types";
import { buildInitialDatasets } from "../data/datasets";
import { ALL_STAFF, ALL_STAKEHOLDERS } from "../data/staff";
import { INITIATIVE_BY_KEY } from "../data/initiatives";
import { runOneTick } from "../engine/runTick";
import { computeFinalScore } from "../engine/scoringEngine";

function createInitialState(): Omit<GameState, "startGame" | "runTick" | "endSession" | "resetGame" | "assignRole" | "resolvePressure" | "launchInitiative"> {
  return {
    governanceModel:       null,
    datasets:              buildInitialDatasets(),
    staff:                 ALL_STAFF.map((s) => ({ ...s })),
    stakeholders:          ALL_STAKEHOLDERS.map((s) => ({ ...s })),
    pressures:             [],
    initiatives:           [],
    narrativeLog:          [],
    delayedEffects:        [],
    tick:                  0,
    trustScore:            0,
    maturityStage:         "chaos",
    executiveSatisfaction: 70,
    cycleCapacity:         { total: 4, used: 0, cycleStartTick: 0 },
    gamePhase:             "setup",
    peakTrustScore:        0,
    nextAuditTick:         35,
    auditsPassed:          0,
    auditsFailed:          0,
    pressureCooldowns:     {},
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...createInitialState(),

  // ── Setup ────────────────────────────────────────────────────────────────

  startGame: (model: GovernanceModel) => {
    const capMap: Record<GovernanceModel, number> = { centralised: 4, federated: 6, platform_led: 3 };
    set({
      governanceModel: model,
      cycleCapacity:   { total: capMap[model], used: 0, cycleStartTick: 0 },
      gamePhase:       "playing",
    });
  },

  // ── Game loop ────────────────────────────────────────────────────────────

  runTick: () => {
    const state = get();
    if (state.gamePhase !== "playing") return;
    const partial = runOneTick(state);
    set(partial);
  },

  // ── End / reset ──────────────────────────────────────────────────────────

  endSession: () => {
    const state = get();
    const result = computeFinalScore(state);
    set({ gamePhase: "ended", endState: result.endState, finalScore: result.overallScore });
  },

  resetGame: () => {
    set({ ...createInitialState() });
  },

  // ── Governance — costs 1 capacity each ────────────────────────────────────

  assignRole: (datasetId: string, role: StaffRole, staffId: string | undefined) => {
    const state = get();
    if (state.cycleCapacity.used >= state.cycleCapacity.total) return;
    const ds = state.datasets[datasetId];
    if (!ds) return;

    const updated = { ...ds };
    if (role === "DataOwner")    updated.ownerId    = staffId;
    if (role === "DataSteward")  updated.stewardId  = staffId;
    if (role === "DataCustodian") updated.custodianId = staffId;
    if (role === "DataEngineer") updated.engineerId  = staffId;

    set({
      datasets: { ...state.datasets, [datasetId]: updated },
      cycleCapacity: { ...state.cycleCapacity, used: state.cycleCapacity.used + 1 },
    });
  },

  // ── Resolve pressure ──────────────────────────────────────────────────────

  resolvePressure: (pressureId: string, optionId: string) => {
    const state = get();
    const pressure = state.pressures.find((p) => p.id === pressureId);
    if (!pressure || pressure.status !== "open") return;

    const option: ResolutionOption | undefined = pressure.resolutionOptions.find((o) => o.id === optionId);
    if (!option) return;

    const cost = option.capacityCost;
    if (state.cycleCapacity.used + cost > state.cycleCapacity.total) return;

    // Apply effects
    let trustDelta = option.effect.trustDelta ?? 0;
    const updatedDatasets = { ...state.datasets };
    const updatedStakeholders = [...state.stakeholders];

    if (option.effect.datasetEffects) {
      for (const de of option.effect.datasetEffects) {
        const ds = updatedDatasets[de.datasetId];
        if (!ds) continue;
        let q = { ...ds.quality };
        if (de.qualityBoost) {
          for (const [k, v] of Object.entries(de.qualityBoost)) {
            if (v !== undefined) (q as Record<string, number>)[k] = Math.min(100, (q as Record<string, number>)[k] + v);
          }
        }
        const risk = Math.max(0, ds.governanceRisk - (de.riskReduction ?? 0));
        updatedDatasets[de.datasetId] = { ...ds, quality: q, governanceRisk: risk };
      }
    }

    if (option.effect.patienceBoost && option.effect.stakeholderId) {
      const idx = updatedStakeholders.findIndex((s) => s.id === option.effect.stakeholderId);
      if (idx >= 0) {
        updatedStakeholders[idx] = {
          ...updatedStakeholders[idx],
          patience: Math.min(100, Math.max(0, updatedStakeholders[idx].patience + (option.effect.patienceBoost ?? 0))),
        };
      }
    }

    // Delayed effects
    const updatedDelayed = [...state.delayedEffects];
    if (option.effect.delayedTrustDelta !== undefined && option.effect.delayedTicks !== undefined) {
      updatedDelayed.push({
        id: `de-${Date.now()}`,
        firesAtTick: state.tick + option.effect.delayedTicks,
        trustDelta: option.effect.delayedTrustDelta,
        narrative: `Delayed consequence from earlier decision: ${option.effect.narrativeOutcome}`,
      });
    }

    // Initiative unlock
    let updatedInitiatives = [...state.initiatives];
    if (option.effect.initiativeUnlock) {
      const key = option.effect.initiativeUnlock;
      const def = INITIATIVE_BY_KEY[key];
      const alreadyActive = updatedInitiatives.some((i) => i.key === key);
      if (def && !alreadyActive) {
        updatedInitiatives = [...updatedInitiatives, {
          id: `ini-${Date.now()}`,
          key,
          status: "active",
          tickStarted: state.tick,
          tickCompletes: state.tick + def.cyclesRequired * 15,
          progress: 0,
        }];
      }
    }

    // Narrative log entry
    const narrativeLog = [
      {
        id: `ne-res-${Date.now()}`,
        tick: state.tick,
        type: "resolution" as const,
        title: `Resolved: ${pressure.title}`,
        body: option.effect.narrativeOutcome,
        severity: "info" as const,
      },
      ...state.narrativeLog,
    ];

    const updatedPressures = state.pressures.map((p) =>
      p.id === pressureId ? { ...p, status: "resolved" as const, resolvedAtTick: state.tick } : p
    );

    set({
      pressures: updatedPressures,
      datasets: updatedDatasets,
      stakeholders: updatedStakeholders,
      delayedEffects: updatedDelayed,
      initiatives: updatedInitiatives,
      narrativeLog,
      trustScore: Math.min(100, Math.max(0, state.trustScore + trustDelta)),
      cycleCapacity: { ...state.cycleCapacity, used: state.cycleCapacity.used + cost },
    });
  },

  // ── Launch initiative ──────────────────────────────────────────────────────

  launchInitiative: (key: string) => {
    const state = get();
    const def = INITIATIVE_BY_KEY[key];
    if (!def) return;

    // Check prerequisites
    if (def.prerequisites) {
      for (const prereqKey of def.prerequisites) {
        const done = state.initiatives.some((i) => i.key === prereqKey && i.status === "completed");
        if (!done) return;
      }
    }

    // Check not already active
    if (state.initiatives.some((i) => i.key === key && (i.status === "active" || i.status === "completed"))) return;

    // Check capacity
    const cost = def.launchCost;
    if (state.cycleCapacity.used + cost > state.cycleCapacity.total) return;

    const newInitiative = {
      id: `ini-${Date.now()}`,
      key,
      status: "active" as const,
      tickStarted: state.tick,
      tickCompletes: state.tick + def.cyclesRequired * 15,
      progress: 0,
    };

    const narrativeLog = [
      {
        id: `ne-ini-${Date.now()}`,
        tick: state.tick,
        type: "initiative" as const,
        title: `Launched: ${def.name}`,
        body: def.description,
        severity: "info" as const,
      },
      ...state.narrativeLog,
    ];

    set({
      initiatives: [...state.initiatives, newInitiative],
      cycleCapacity: { ...state.cycleCapacity, used: state.cycleCapacity.used + cost },
      narrativeLog,
    });
  },
}));
