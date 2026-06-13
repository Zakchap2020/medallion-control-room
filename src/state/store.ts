import { create } from "zustand";
import type {
  GameState,
  Analyst,
  Department,
  PersonRoleType,
  GamePhase,
  DataClassification,
} from "../models/types";

import { runTick } from "../engine/runTick";
import { compositeQuality } from "../engine/medallionEngine";
import { generatePersonnel } from "../engine/personnelGenerator";

const INITIAL_ANALYSTS: Analyst[] = [
  { id: "analyst-1", name: "Alice Morgan", skills: { analysis: 7, governance: 5 }, active: true },
  { id: "analyst-2", name: "Ben Okafor",   skills: { analysis: 5, governance: 8 }, active: true },
  { id: "analyst-3", name: "Priya Shah",   skills: { analysis: 6, governance: 6 }, active: true },
];

interface GameStore extends GameState {
  runTick: () => void;
  assignAnalyst: (analystId: string, department: Department | undefined) => void;
  investigateSignal: (signalId: string) => void;
  resolveSignal: (signalId: string) => void;
  containSilo: (siloId: string) => void;
  assignGovernanceRole: (datasetId: string, role: PersonRoleType, personId: string | undefined) => void;
  resolveIncident: (incidentId: string) => void;
  assignAnalystToIncident: (incidentId: string) => void;
  completeExecutivePressure: (pressureId: string) => void;
  toggleAutoFix: (datasetId: string) => void;
  // Phase 6
  endSession: () => void;
  continueSession: () => void;
  resetGame: () => void;
  promoteDataset: (datasetId: string) => void;
  setClassification: (datasetId: string, classification: DataClassification | undefined) => void;
}

function createInitialState(): GameState {
  return {
    datasets: [],
    analysts: INITIAL_ANALYSTS,
    persons: generatePersonnel(),
    silos: [],
    signals: [],
    catalogue: {},
    incidents: [],
    executivePressures: [],
    healingEvents: [],
    tick: 0,
    trustScore: 0,
    reputation: 50,
    gamePhase: "playing" as GamePhase,
    peakTrustScore: 0,
    characterEvents: [],
    nextAuditTick: 30,
    auditsPassed: 0,
    auditsFailed: 0,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  runTick: () => {
    const state = get();
    const updates = runTick(state);
    set(updates);
  },

  assignAnalyst: (analystId, department) => {
    set((s) => ({
      analysts: s.analysts.map((a) =>
        a.id === analystId ? { ...a, assignedDepartment: department } : a
      ),
    }));
  },

  investigateSignal: (signalId) => {
    const { signals, silos } = get();
    const signal = signals.find((s) => s.id === signalId);
    if (!signal) return;
    set({
      signals: signals.map((s) => s.id === signalId ? { ...s, resolved: true } : s),
      silos: signal.relatedSiloId
        ? silos.map((s) => s.id === signal.relatedSiloId ? { ...s, discovered: true } : s)
        : silos,
    });
  },

  resolveSignal: (signalId) => {
    set((s) => ({
      signals: s.signals.map((sig) =>
        sig.id === signalId ? { ...sig, resolved: true } : sig
      ),
    }));
  },

  containSilo: (siloId) => {
    set((s) => ({
      silos: s.silos.map((silo) =>
        silo.id === siloId ? { ...silo, contained: true } : silo
      ),
      trustScore: s.trustScore + 5,
    }));
  },

  assignGovernanceRole: (datasetId, role, personId) => {
    set((s) => {
      const field =
        role === "owner" ? "ownerId" :
        role === "steward" ? "stewardId" : "custodianId";

      // Scarcity: one person can only hold each role on one dataset at a time.
      // Clear them from any other dataset before assigning here.
      const updated: typeof s.catalogue = {};
      for (const [id, entry] of Object.entries(s.catalogue)) {
        if (id !== datasetId && personId && entry[field] === personId) {
          updated[id] = { ...entry, [field]: undefined };
        } else {
          updated[id] = entry;
        }
      }

      const target = updated[datasetId];
      if (!target) return {};
      updated[datasetId] = { ...target, [field]: personId };

      return { catalogue: updated };
    });
  },

  resolveIncident: (incidentId) => {
    set((s) => {
      const inc = s.incidents.find((i) => i.id === incidentId);
      const trustBonus = inc?.severity === "critical" ? 8
        : inc?.severity === "high" ? 5
        : inc?.severity === "medium" ? 3 : 1;
      return {
        incidents: s.incidents.map((i) =>
          i.id === incidentId ? { ...i, status: "resolved" as const } : i
        ),
        trustScore: s.trustScore + trustBonus,
        reputation: Math.min(100, s.reputation + 2),
      };
    });
  },

  assignAnalystToIncident: (incidentId) => {
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === incidentId && i.status === "open"
          ? { ...i, status: "in_progress" as const, timeToResolve: i.timeToResolve + 3 }
          : i
      ),
    }));
  },

  completeExecutivePressure: (pressureId) => {
    set((s) => ({
      executivePressures: s.executivePressures.map((p) =>
        p.id === pressureId ? { ...p, status: "completed" as const } : p
      ),
      reputation: Math.min(100, s.reputation + 5),
      trustScore: s.trustScore + 10,
    }));
  },

  toggleAutoFix: (datasetId) => {
    set((s) => ({
      datasets: s.datasets.map((d) =>
        d.id === datasetId ? { ...d, autoFixEnabled: !d.autoFixEnabled } : d
      ),
    }));
  },

  endSession: () => {
    set({ gamePhase: "ended" as GamePhase });
  },

  continueSession: () => {
    set({ gamePhase: "playing" as GamePhase });
  },

  resetGame: () => {
    set(createInitialState());
  },

  setClassification: (datasetId, classification) => {
    set((s) => ({
      catalogue: {
        ...s.catalogue,
        [datasetId]: { ...s.catalogue[datasetId], classification },
      },
    }));
  },

  promoteDataset: (datasetId) => {
    set((s) => {
      const ds    = s.datasets.find((d) => d.id === datasetId);
      const entry = s.catalogue[datasetId];
      if (!ds || !entry) return {};

      const cq = compositeQuality(ds.quality);

      const boost = (q: typeof ds.quality, amounts: Partial<typeof ds.quality>) => ({
        accuracy:     Math.min(100, q.accuracy     + (amounts.accuracy     ?? 0)),
        completeness: Math.min(100, q.completeness + (amounts.completeness ?? 0)),
        consistency:  Math.min(100, q.consistency  + (amounts.consistency  ?? 0)),
        uniqueness:   Math.min(100, q.uniqueness   + (amounts.uniqueness   ?? 0)),
        timeliness:   Math.min(100, q.timeliness   + (amounts.timeliness   ?? 0)),
      });

      if (ds.layer === "bronze" && cq > 65 && entry.custodianId) {
        const quality = boost(ds.quality, { completeness: 10, consistency: 12, timeliness: 7 });
        return {
          datasets:  s.datasets.map((d)  => d.id === datasetId  ? { ...d,  layer: "silver" as const, quality } : d),
          catalogue: { ...s.catalogue, [datasetId]: { ...entry, layer: "silver" as const } },
        };
      }

      if (ds.layer === "silver" && cq > 80 && entry.ownerId && entry.stewardId) {
        const quality = boost(ds.quality, { accuracy: 10, consistency: 10, uniqueness: 6, timeliness: 8 });
        return {
          datasets:  s.datasets.map((d)  => d.id === datasetId  ? { ...d,  layer: "gold" as const, quality } : d),
          catalogue: { ...s.catalogue, [datasetId]: { ...entry, layer: "gold" as const } },
        };
      }

      return {};
    });
  },
}));
