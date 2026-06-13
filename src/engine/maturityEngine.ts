import type { GameState, MaturityStage } from "../models/types";
import { FIXED_DATASETS } from "../data/datasets";
import { compositeQuality } from "./qualityUtils";

export interface MaturityBreakdown {
  ownership:        number;   // % critical datasets with owner
  stewardship:      number;   // % all datasets with steward
  technicalControl: number;   // % datasets with custodian or engineer
  dataQuality:      number;   // avg composite quality / 100
  pressureHandling: number;   // resolved / (resolved + expired)
  initiatives:      number;   // completed / available
}

export interface MaturityResult {
  score:     number;
  stage:     MaturityStage;
  breakdown: MaturityBreakdown;
}

export function computeMaturity(state: GameState): MaturityResult {
  const { datasets, pressures, initiatives } = state;
  const allDs = FIXED_DATASETS;

  // 1. Ownership — % of criticality ≥ 4 datasets with ownerId
  const critical = allDs.filter((d) => d.criticality >= 4);
  const ownedCritical = critical.filter((d) => datasets[d.id]?.ownerId).length;
  const ownership = critical.length > 0 ? (ownedCritical / critical.length) * 100 : 0;

  // 2. Stewardship — % of all datasets with stewardId
  const stewarded = allDs.filter((d) => datasets[d.id]?.stewardId).length;
  const stewardship = (stewarded / allDs.length) * 100;

  // 3. Technical control — custodianId or engineerId
  const controlled = allDs.filter((d) => {
    const ds = datasets[d.id];
    return ds && (ds.custodianId || ds.engineerId);
  }).length;
  const technicalControl = (controlled / allDs.length) * 100;

  // 4. Data quality — avg composite quality
  const totalQuality = allDs.reduce((sum, d) => {
    const ds = datasets[d.id];
    return sum + (ds ? compositeQuality(ds.quality) : 0);
  }, 0);
  const dataQuality = totalQuality / allDs.length;

  // 5. Pressure handling — resolved vs expired
  const closed = pressures.filter((p) => p.status === "resolved" || p.status === "expired" || p.status === "escalated");
  const resolved = pressures.filter((p) => p.status === "resolved");
  const pressureHandling = closed.length > 0 ? (resolved.length / closed.length) * 100 : 100;

  // 6. Initiatives — completed / 8
  const completed = initiatives.filter((i) => i.status === "completed").length;
  const initiativeScore = (completed / 8) * 100;

  const breakdown: MaturityBreakdown = {
    ownership,
    stewardship,
    technicalControl,
    dataQuality,
    pressureHandling,
    initiatives: initiativeScore,
  };

  // Weighted score
  const score = Math.round(
    ownership        * 0.25 +
    stewardship      * 0.20 +
    technicalControl * 0.15 +
    dataQuality      * 0.20 +
    pressureHandling * 0.10 +
    initiativeScore  * 0.10
  );

  let stage: MaturityStage;
  if (score < 25)      stage = "chaos";
  else if (score < 50) stage = "stabilising";
  else if (score < 75) stage = "governed";
  else                  stage = "data_driven";

  return { score, stage, breakdown };
}

export const MATURITY_LABELS: Record<MaturityStage, string> = {
  chaos:        "Chaos",
  stabilising:  "Stabilising",
  governed:     "Governed",
  data_driven:  "Data-Driven",
};

export const MATURITY_COLORS: Record<MaturityStage, string> = {
  chaos:        "#ff2222",
  stabilising:  "#ff6600",
  governed:     "#ffa500",
  data_driven:  "#00ff88",
};
