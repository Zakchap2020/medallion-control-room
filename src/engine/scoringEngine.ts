import type { GameState, FinalScore, EndgameArchetype, Achievement } from "../models/types";
import { compositeQuality } from "./medallionEngine";

// ── Sub-score computers ───────────────────────────────────────────────────────

function computeDataTrustScore(state: GameState): number {
  const gold = state.datasets.filter((d) => d.layer === "gold");
  const goldQuality =
    gold.length > 0
      ? gold.reduce((sum, d) => sum + compositeQuality(d.quality), 0) / gold.length
      : 0;

  const totalInc = state.incidents.length;
  const failedInc = state.incidents.filter((i) => i.status === "failed").length;
  const incidentHealth = totalInc > 0 ? (1 - failedInc / totalInc) * 100 : 75;

  const totalSig = state.signals.length;
  const resolvedSig = state.signals.filter((s) => s.resolved).length;
  const signalResolution = totalSig > 0 ? (resolvedSig / totalSig) * 100 : 60;

  const total = state.datasets.length;
  const advanced = state.datasets.filter((d) => d.layer !== "bronze").length;
  const pipelineRatio = total > 0 ? (advanced / total) * 100 : 0;

  return Math.round(
    goldQuality    * 0.40 +
    incidentHealth * 0.30 +
    signalResolution * 0.15 +
    pipelineRatio  * 0.15
  );
}

function computeGovernanceMaturityScore(state: GameState): number {
  const entries = Object.values(state.catalogue);
  const total = entries.length;
  if (total === 0) return 0;

  const withOwner    = entries.filter((e) => e.ownerId).length;
  const withSteward  = entries.filter((e) => e.stewardId).length;
  const withCustodian = entries.filter((e) => e.custodianId).length;
  const avgCoverage  = (withOwner + withSteward + withCustodian) / (total * 3);

  const discoveredSilos = state.silos.filter((s) => s.discovered).length;
  const containedSilos  = state.silos.filter((s) => s.contained).length;
  const siloHealth = discoveredSilos > 0 ? (containedSilos / discoveredSilos) * 100 : 100;

  const avgGovRisk =
    entries.reduce((sum, e) => sum + e.governanceRisk, 0) / entries.length;
  const riskScore = Math.max(0, 100 - avgGovRisk);

  return Math.round(avgCoverage * 100 * 0.50 + siloHealth * 0.30 + riskScore * 0.20);
}

function computeOperationalStabilityScore(state: GameState): number {
  const totalInc  = state.incidents.length;
  const failedInc = state.incidents.filter((i) => i.status === "failed").length;
  const incidentScore = totalInc > 0 ? (1 - failedInc / totalInc) * 100 : 80;

  const heal = state.healingEvents;
  const healSuccess = heal.filter((e) => e.success).length;
  const autoFixScore = heal.length > 0 ? (healSuccess / heal.length) * 100 : 60;

  const totalSig   = state.signals.length;
  const resolvedSig = state.signals.filter((s) => s.resolved).length;
  const noiseScore = totalSig > 0 ? (resolvedSig / totalSig) * 100 : 60;

  return Math.round(incidentScore * 0.40 + autoFixScore * 0.30 + noiseScore * 0.30);
}

function computeExecutiveSatisfactionScore(state: GameState): number {
  const pressures = state.executivePressures;
  const total = pressures.length;
  if (total === 0) return 65;

  const completed = pressures.filter((p) => p.status === "completed").length;
  const failed    = pressures.filter((p) => p.status === "failed").length;

  const completionScore  = (completed / total) * 100;
  const reliabilityScore = ((total - failed) / total) * 100;

  return Math.round(completionScore * 0.60 + reliabilityScore * 0.40);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function computeFinalScore(state: GameState): FinalScore {
  const dataTrustScore             = computeDataTrustScore(state);
  const governanceMaturityScore    = computeGovernanceMaturityScore(state);
  const operationalStabilityScore  = computeOperationalStabilityScore(state);
  const executiveSatisfactionScore = computeExecutiveSatisfactionScore(state);

  const overallScore = Math.round(
    dataTrustScore             * 0.30 +
    governanceMaturityScore    * 0.30 +
    operationalStabilityScore  * 0.25 +
    executiveSatisfactionScore * 0.15
  );

  return {
    dataTrustScore,
    governanceMaturityScore,
    operationalStabilityScore,
    executiveSatisfactionScore,
    overallScore,
  };
}

export function classifyEndgame(
  state: GameState,
  score: FinalScore
): EndgameArchetype {
  const {
    dataTrustScore,
    governanceMaturityScore,
    operationalStabilityScore,
    executiveSatisfactionScore,
    overallScore,
  } = score;

  const total      = state.datasets.length;
  const autoFixN   = state.datasets.filter((d) => d.autoFixEnabled).length;
  const autoFixRatio = total > 0 ? autoFixN / total : 0;
  const entries    = Object.values(state.catalogue);
  const fullyGov   = entries.filter((e) => e.ownerId && e.stewardId && e.custodianId).length;
  const govCoverage = entries.length > 0 ? fullyGov / entries.length : 0;

  if (overallScore >= 72) return "mature_data_driven";

  if (dataTrustScore >= 65 && executiveSatisfactionScore < 35)
    return "technically_stable_politically_fragile";

  if (governanceMaturityScore < 30 || dataTrustScore < 25) return "governance_failure";

  if (autoFixRatio > 0.70 && govCoverage < 0.30 && operationalStabilityScore >= 50)
    return "self_healing_illusion";

  return "operationally_chaotic";
}

export function computeAchievements(state: GameState): Achievement[] {
  const entries  = Object.values(state.catalogue);
  const total    = state.datasets.length;
  const autoFixN = state.datasets.filter((d) => d.autoFixEnabled).length;
  const fullyGov = entries.filter((e) => e.ownerId && e.stewardId && e.custodianId).length;
  const discovered = state.silos.filter((s) => s.discovered).length;
  const uncontained = state.silos.filter((s) => s.discovered && !s.contained).length;

  return [
    {
      id: "first_gold",
      label: "First Gold Dataset",
      description: "Promoted at least one dataset to the Gold layer.",
      unlocked: state.datasets.some((d) => d.layer === "gold"),
    },
    {
      id: "full_governance",
      label: "Full Governance Coverage",
      description: "Owner, Steward, and Custodian assigned to every catalogued dataset.",
      unlocked: entries.length > 0 && fullyGov === entries.length,
    },
    {
      id: "silo_hunter",
      label: "Zero Shadow Silos",
      description: "All discovered silos have been contained.",
      unlocked: discovered > 0 && uncontained === 0,
    },
    {
      id: "exec_confidence",
      label: "Executive Confidence",
      description: "Completed 3 or more executive pressure requests.",
      unlocked: state.executivePressures.filter((p) => p.status === "completed").length >= 3,
    },
    {
      id: "resilient_platform",
      label: "Resilient Platform",
      description: "Reached tick 20 with a positive trust score.",
      unlocked: state.tick >= 20 && state.trustScore > 0,
    },
    {
      id: "silent_risk",
      label: "Silent Risk Warning",
      description:
        "Over 70% of datasets rely on Auto-Fix with less than 30% full governance — a fragile foundation.",
      unlocked:
        total > 2 &&
        autoFixN / total > 0.70 &&
        (entries.length === 0 || fullyGov / entries.length < 0.30),
    },
  ];
}
