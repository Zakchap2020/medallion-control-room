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

  // 5. Incidents: tick existing timers, then generate new ones
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

  // 6. Executive pressure: tick timers, then generate new
  const { updated: tickedPressures, reputationDelta: execRepDelta } =
    tickExecutivePressures(state.executivePressures);
  const stateForExec: GameState = {
    ...stateForIncidents,
    incidents: allIncidents,
  };
  const newPressures = generateExecutivePressure(stateForExec, nextTick);
  const allPressures = [...tickedPressures, ...newPressures];

  // 7. Trust score
  const siloTrustDelta      = computeSiloTrustDelta(allSilos);
  const govTrustDelta       = computeGovernanceTrustDelta(updatedCatalogue);
  const incidentTrustDelta  = computeIncidentTrustDelta(allIncidents);
  const trustScore = state.trustScore + 1 + siloTrustDelta + govTrustDelta + incidentTrustDelta;

  // 8. Reputation (slower-moving, heavier penalty on failures)
  const reputationDelta = incRepDelta + execRepDelta;
  const reputationDrift = trustScore > state.trustScore ? 0.5 : -0.5;
  const reputation = Math.max(
    0,
    Math.min(100, state.reputation + reputationDelta + reputationDrift)
  );

  return {
    tick: nextTick,
    datasets: allDatasets,
    silos: allSilos,
    signals: allSignals,
    catalogue: updatedCatalogue,
    incidents: allIncidents,
    executivePressures: allPressures,
    trustScore,
    reputation,
  };
}
