import { create } from "zustand";
import type {
  GameState,
  Analyst,
  Person,
  Department,
  PersonRoleType,
  GamePhase,
} from "../models/types";

import { runTick } from "../engine/runTick";

const INITIAL_ANALYSTS: Analyst[] = [
  { id: "analyst-1", name: "Alice Morgan", skills: { analysis: 7, governance: 5 }, active: true },
  { id: "analyst-2", name: "Ben Okafor",   skills: { analysis: 5, governance: 8 }, active: true },
  { id: "analyst-3", name: "Priya Shah",   skills: { analysis: 6, governance: 6 }, active: true },
];

const INITIAL_PERSONS: Person[] = [
  { id: "person-1", name: "Jordan Hayes",  roleType: "owner",     skills: { governance: 8, analysis: 5, engineering: 4 } },
  { id: "person-2", name: "Sam Nkosi",     roleType: "owner",     skills: { governance: 7, analysis: 6, engineering: 4 } },
  { id: "person-3", name: "Maya Patel",    roleType: "steward",   skills: { governance: 6, analysis: 8, engineering: 5 } },
  { id: "person-4", name: "Chris Adewale", roleType: "steward",   skills: { governance: 7, analysis: 7, engineering: 5 } },
  { id: "person-5", name: "Taylor Obi",    roleType: "custodian", skills: { governance: 5, analysis: 4, engineering: 9 } },
  { id: "person-6", name: "Ren Watanabe",  roleType: "custodian", skills: { governance: 5, analysis: 5, engineering: 8 } },
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
}

const INITIAL_GAME_STATE: GameState = {
  datasets: [],
  analysts: INITIAL_ANALYSTS,
  persons: INITIAL_PERSONS,
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
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_GAME_STATE,

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
    set({ ...INITIAL_GAME_STATE });
  },
}));
