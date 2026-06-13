import type { GameState, EndState } from "../models/types";
import { computeMaturity } from "./maturityEngine";
import { compositeQuality } from "./qualityUtils";
import { FIXED_DATASETS } from "../data/datasets";

export interface FinalScore {
  overallScore:          number;
  endState:              EndState;
  endStateLabel:         string;
  endStateDescription:   string;
  breakdown: {
    trust:            number;
    maturity:         number;
    governance:       number;
    pressureHandling: number;
    stakeholders:     number;
    initiatives:      number;
  };
  verdict: string;
}

export function computeFinalScore(state: GameState): FinalScore {
  const maturityResult = computeMaturity(state);
  const { trustScore, stakeholders, pressures, initiatives } = state;

  const avgPatience = stakeholders.length > 0
    ? stakeholders.reduce((s, k) => s + k.patience, 0) / stakeholders.length
    : 50;

  const resolved = pressures.filter((p) => p.status === "resolved").length;
  const closed   = pressures.filter((p) => p.status !== "open").length;
  const pressureScore = closed > 0 ? (resolved / closed) * 100 : 100;

  const completedInitiatives = initiatives.filter((i) => i.status === "completed").length;
  const initiativeScore = (completedInitiatives / 8) * 100;

  const gov = maturityResult.breakdown;
  const govScore = gov.ownership * 0.4 + gov.stewardship * 0.35 + gov.technicalControl * 0.25;

  const breakdown = {
    trust:            Math.round(trustScore * 0.25),
    maturity:         Math.round(maturityResult.score * 0.25),
    governance:       Math.round(govScore * 0.20),
    pressureHandling: Math.round(pressureScore * 0.15),
    stakeholders:     Math.round(avgPatience * 0.10),
    initiatives:      Math.round(initiativeScore * 0.05),
  };

  const overallScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const endState = determineEndState(state, maturityResult.score, avgPatience, gov);
  const copy = END_STATE_COPY[endState];

  return {
    overallScore,
    endState,
    endStateLabel: copy.label,
    endStateDescription: copy.description,
    breakdown,
    verdict: copy.verdict(overallScore),
  };
}

function determineEndState(
  state: GameState,
  maturityScore: number,
  avgPatience: number,
  breakdown: { ownership: number; technicalControl: number }
): EndState {
  const { initiatives, pressures } = state;
  const completedCount = initiatives.filter((i) => i.status === "completed").length;
  const expiredCount = pressures.filter((p) => p.status === "expired").length;
  const shadowExpired = pressures.filter((p) => p.type === "shadow_data_risk" && p.status === "expired").length;

  if (completedCount >= 7 && avgPatience < 50) return "over_governed";
  if (expiredCount >= 4 || shadowExpired >= 2) return "shadow_dominated";
  if (maturityScore >= 70 && avgPatience >= 60) return "data_driven";
  if (maturityScore >= 45 && avgPatience < 40) return "politically_fractured";
  if (breakdown.technicalControl >= 75 && breakdown.ownership < 40) return "technically_stable";
  if (maturityScore >= 50) return "data_driven";
  if (maturityScore >= 30) return "politically_fractured";
  return "shadow_dominated";
}

export function avgCompositeQuality(state: GameState): number {
  const all = FIXED_DATASETS;
  if (all.length === 0) return 0;
  const empty = { completeness: 0, accuracy: 0, consistency: 0, timeliness: 0, validity: 0 };
  return Math.round(
    all.reduce((s, d) => s + compositeQuality(state.datasets[d.id]?.quality ?? empty), 0) / all.length
  );
}

const END_STATE_COPY: Record<EndState, { label: string; description: string; verdict: (score: number) => string }> = {
  data_driven: {
    label: "Data-Driven Organisation",
    description: "Mature, distributed data governance achieved. Stakeholders trust the data. Decisions come from a single version of truth.",
    verdict: (s) => `You transformed a broken data estate into a governed, trusted organisation. Score: ${s}.`,
  },
  politically_fractured: {
    label: "Politically Fractured",
    description: "Governance frameworks exist but political will does not. Stakeholders are pursuing their own data strategies.",
    verdict: (s) => `Governance was built but stakeholder alignment was lost. Score: ${s}. The frameworks are real — but without buy-in, they will not hold.`,
  },
  technically_stable: {
    label: "Technically Stable, Business-Misaligned",
    description: "Strong technical infrastructure, missing business ownership. Engineers keep the lights on but no one owns the truth.",
    verdict: (s) => `Strong technical execution, insufficient business engagement. Score: ${s}. Data quality holds but the business doesn't own it.`,
  },
  shadow_dominated: {
    label: "Shadow-Data Dominated",
    description: "Spreadsheets and exports are more trusted than governed systems. The governed estate lost the war for truth.",
    verdict: (s) => `Shadow data won. Score: ${s}. Informal data filled the governance gap. Authority has collapsed.`,
  },
  over_governed: {
    label: "Over-Governed Bureaucracy",
    description: "Governance processes are comprehensive but suffocating. Every policy written — but the business moved on.",
    verdict: (s) => `Perfect governance, wrong priorities. Score: ${s}. The frameworks are admirable. The organisation doesn't know what to do with them.`,
  },
};
