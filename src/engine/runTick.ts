import type { GameState } from "../models/types";
import { generateBronzeDatasets } from "./datasetGenerator";
import { updateSiloRisks, spawnNewSilos, computeSiloTrustDelta } from "./siloEngine";
import { generateSignals } from "./analystEngine";
import {
  initCatalogueEntries,
  updateGovernanceRisks,
  computeGovernanceTrustDelta,
} from "./governanceEngine";
import {
  generateIncidents,
  tickIncidents,
  computeIncidentTrustDelta,
} from "./incidentEngine";
import {
  generateExecutivePressure,
  tickExecutivePressures,
} from "./executivePressureEngine";
import {
  applyQualityDrift,
  runAutoFix,
  promoteDatasets,
  computeQualityTrustDelta,
} from "./medallionEngine";

const MAX_HEALING_HISTORY = 40;

export function runTick(state: GameState): Partial<GameState> {
  const nextTick = state.tick + 1;

  // 1. Generate bronze datasets
  const newDatasets = generateBronzeDatasets(nextTick);
  const allDatasets = [...state.datasets, ...newDatasets];

  // 2. Catalogue: init new entries + update governance risk
  const catalogueWithNew = initCatalogueEntries(state.catalogue, allDatasets);
  const updatedCatalogue = updateGovernanceRisks(catalogueWithNew);

  // 3. Silos: update risk + spawn
  const updatedSilos = updateSiloRisks(state.silos);
  const stateForSilos: GameState = {
    ...state,
    datasets: allDatasets,
    silos: updatedSilos,
    catalogue: updatedCatalogue,
  };
  const newSilos = spawnNewSilos(stateForSilos, nextTick);
  const allSilos = [...updatedSilos, ...newSilos];

  // 4. Analyst + governance signals
  const stateForSignals: GameState = {
    ...state,
    datasets: allDatasets,
    silos: allSilos,
    catalogue: updatedCatalogue,
  };
  const newSignals = generateSignals(stateForSignals, nextTick);
  const allSignals = [...state.signals, ...newSignals];

  // 5. Incidents: tick existing timers + generate new
  const stateForIncidents: GameState = {
    ...state,
    datasets: allDatasets,
    silos: allSilos,
    signals: allSignals,
    catalogue: updatedCatalogue,
  };
  const { updated: tickedIncidents, reputationDelta: incRepDelta } =
    tickIncidents(state.incidents);
  const newIncidents = generateIncidents(stateForIncidents, nextTick);
  const allIncidents = [...tickedIncidents, ...newIncidents];

  // 6. Executive pressure: tick timers + generate new
  const { updated: tickedPressures, reputationDelta: execRepDelta } =
    tickExecutivePressures(state.executivePressures);
  const stateForExec: GameState = { ...stateForIncidents, incidents: allIncidents };
  const newPressures = generateExecutivePressure(stateForExec, nextTick);
  const allPressures = [...tickedPressures, ...newPressures];

  // 7. Medallion pipeline (Phase 5)
  //    a. Quality drift degrades data each tick
  const driftedDatasets = applyQualityDrift(allDatasets, updatedCatalogue, allSilos);
  //    b. Auto-fix attempts repair on eligible datasets
  const { datasets: fixedDatasets, events: fixEvents } = runAutoFix(
    driftedDatasets,
    updatedCatalogue,
    allSilos,
    nextTick
  );
  //    c. Promote Bronze → Silver → Gold where conditions are met
  const {
    datasets: promotedDatasets,
    catalogue: promotedCatalogue,
    events: promoteEvents,
  } = promoteDatasets(fixedDatasets, updatedCatalogue, nextTick);

  const tickHealingEvents = [...fixEvents, ...promoteEvents];
  const allHealingEvents = [
    ...tickHealingEvents,
    ...state.healingEvents,
  ].slice(0, MAX_HEALING_HISTORY);

  // 8. Trust score
  const siloTrustDelta     = computeSiloTrustDelta(allSilos);
  const govTrustDelta      = computeGovernanceTrustDelta(promotedCatalogue);
  const incidentTrustDelta = computeIncidentTrustDelta(allIncidents);
  const qualityTrustDelta  = computeQualityTrustDelta(promotedDatasets);
  const trustScore = state.trustScore + 1
    + siloTrustDelta + govTrustDelta + incidentTrustDelta + qualityTrustDelta;

  // 9. Reputation
  const reputationDelta = incRepDelta + execRepDelta;
  const reputationDrift = trustScore > state.trustScore ? 0.5 : -0.5;
  const reputation = Math.max(
    0,
    Math.min(100, state.reputation + reputationDelta + reputationDrift)
  );

  // 10. Session tracking (Phase 6)
  const peakTrustScore = Math.max(state.peakTrustScore, trustScore);
  const gamePhase = trustScore < -20 ? ("ended" as const) : state.gamePhase;

  return {
    tick: nextTick,
    datasets: promotedDatasets,
    silos: allSilos,
    signals: allSignals,
    catalogue: promotedCatalogue,
    incidents: allIncidents,
    executivePressures: allPressures,
    healingEvents: allHealingEvents,
    trustScore,
    reputation,
    peakTrustScore,
    gamePhase,
  };
}
