import type { GameState, Incident, ExecutivePressure } from "../models/types";
import { compositeQuality } from "./medallionEngine";
import { TRAIT_DEPARTURE_CHANCE } from "./personnelGenerator";
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
import { generateCharacterEvent } from "./characterEngine";

const MAX_HEALING_HISTORY = 40;

export function runTick(state: GameState): Partial<GameState> {
  const nextTick = state.tick + 1;

  // 1. Generate bronze datasets
  const newDatasets = generateBronzeDatasets(nextTick);
  const allDatasets = [...state.datasets, ...newDatasets];

  // 2. Catalogue: init new entries + update governance risk
  const catalogueWithNew = initCatalogueEntries(state.catalogue, allDatasets, nextTick);
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

  // 11. Character events
  const stateForChar: GameState = {
    ...state,
    datasets: promotedDatasets,
    catalogue: promotedCatalogue,
  };
  const charEvent = generateCharacterEvent(stateForChar);
  const characterEvents = charEvent
    ? [charEvent, ...state.characterEvents].slice(0, 30)
    : state.characterEvents;

  // 12. Key person departures
  let updatedPersons = [...state.persons];
  const extraCharEvents: string[] = [];

  // Process anyone departing this tick — clear assignments, mark inactive
  const leavingNow = updatedPersons.filter((p) => p.departsAtTick === nextTick);
  let catalogueAfterDepartures = { ...promotedCatalogue };
  for (const person of leavingNow) {
    const field =
      person.roleType === "owner" ? "ownerId" :
      person.roleType === "steward" ? "stewardId" : "custodianId";
    for (const [id, entry] of Object.entries(catalogueAfterDepartures)) {
      if (entry[field] === person.id) {
        catalogueAfterDepartures[id] = { ...entry, [field]: undefined };
      }
    }
    extraCharEvents.push(
      `⚠ ${person.name} has left the organisation. Their datasets are now unassigned.`
    );
  }
  updatedPersons = updatedPersons.map((p) =>
    p.departsAtTick === nextTick
      ? { ...p, active: false, departsAtTick: undefined, returnsAtTick: nextTick + 10 }
      : p
  );

  // Return anyone who was on leave
  updatedPersons = updatedPersons.map((p) =>
    p.active === false && p.returnsAtTick === nextTick
      ? { ...p, active: true, returnsAtTick: undefined }
      : p
  );

  // Randomly schedule a new departure — probability is trait-dependent
  const activePersons    = updatedPersons.filter((p) => p.active !== false && !p.departsAtTick);
  const alreadyDeparting = updatedPersons.some((p) => !!p.departsAtTick);
  if (!alreadyDeparting && activePersons.length > 2) {
    for (const candidate of activePersons) {
      const chance = TRAIT_DEPARTURE_CHANCE[candidate.trait ?? "methodical"] ?? 0.04;
      if (Math.random() < chance) {
        updatedPersons = updatedPersons.map((p) =>
          p.id === candidate.id ? { ...p, departsAtTick: nextTick + 3 } : p
        );
        extraCharEvents.push(
          `🔔 ${candidate.name} (${candidate.roleType}) has announced they will leave in 3 ticks.`
        );
        break;
      }
    }
  }

  // 13. Data breach + unclassified sensitive data incidents
  const securityIncidents: Incident[] = [];
  for (const entry of Object.values(catalogueAfterDepartures)) {
    const ds = promotedDatasets.find((d) => d.id === entry.datasetId);
    if (!ds) continue;

    // Breach: confidential/restricted + high governance risk + no custodian
    if (
      (entry.classification === "confidential" || entry.classification === "restricted") &&
      entry.governanceRisk > 75 &&
      !entry.custodianId
    ) {
      const alreadyBreach = allIncidents.some(
        (i) => i.type === "data_breach" && i.affectedDatasetIds.includes(ds.id) && i.status !== "resolved"
      );
      if (!alreadyBreach) {
        securityIncidents.push({
          id: `breach-${ds.id}-${nextTick}`,
          type: "data_breach",
          severity: "critical",
          affectedDatasetIds: [ds.id],
          source: "governance",
          status: "open",
          timeToResolve: 5,
          createdAtTick: nextTick,
        });
        extraCharEvents.push(
          `🚨 DATA BREACH risk on ${entry.name} — ${entry.classification} data, unprotected.`
        );
      }
    }

    // Unclassified for > 5 ticks: flag it
    const createdAt = entry.createdAtTick ?? 0;
    if (!entry.classification && nextTick - createdAt > 5) {
      const alreadyFlagged = allIncidents.some(
        (i) => i.type === "unclassified_sensitive_data" &&
                i.affectedDatasetIds.includes(ds.id) &&
                i.status !== "resolved"
      );
      if (!alreadyFlagged && Math.random() < 0.15) {
        securityIncidents.push({
          id: `unclassified-${ds.id}-${nextTick}`,
          type: "unclassified_sensitive_data",
          severity: "medium",
          affectedDatasetIds: [ds.id],
          source: "governance",
          status: "open",
          timeToResolve: 4,
          createdAtTick: nextTick,
        });
      }
    }
  }
  const allIncidentsWithSecurity = [...allIncidents, ...securityIncidents];

  // 14. Compliance audits
  let nextAuditTick = state.nextAuditTick;
  let auditsPassed  = state.auditsPassed;
  let auditsFailed  = state.auditsFailed;
  const auditPressures: ExecutivePressure[] = [];
  const auditIncidents: Incident[] = [];

  // Warn 8 ticks before audit
  if (nextTick === nextAuditTick - 8) {
    auditPressures.push({
      id: `audit-warning-${nextTick}`,
      type: "compliance_audit",
      demand: `Compliance audit in 8 ticks. Ensure ≥1 Gold dataset, ≤3 open incidents, and ≤30% ungoverned datasets.`,
      urgency: "high",
      requiredDatasetDomains: [],
      timeLimit: 8,
      status: "pending",
    });
  }

  // Audit day
  if (nextTick === nextAuditTick) {
    const goldCount    = promotedDatasets.filter((d) => d.layer === "gold").length;
    const openInc      = allIncidentsWithSecurity.filter((i) => i.status === "open" || i.status === "in_progress").length;
    const totalDs      = Object.keys(catalogueAfterDepartures).length;
    const ungoverned   = Object.values(catalogueAfterDepartures).filter((e) => !e.ownerId).length;
    const ungovernedPct = totalDs > 0 ? ungoverned / totalDs : 1;
    const avgQuality   = promotedDatasets.length > 0
      ? promotedDatasets.reduce((s, d) => s + compositeQuality(d.quality), 0) / promotedDatasets.length
      : 0;

    const passed = goldCount >= 1 && openInc <= 3 && ungovernedPct <= 0.3 && avgQuality >= 55;

    if (passed) {
      auditsPassed += 1;
      extraCharEvents.push(`✅ Compliance audit PASSED. Trust +15, Reputation +8.`);
      nextAuditTick += 25;
    } else {
      auditsFailed += 1;
      const reasons: string[] = [];
      if (goldCount < 1)        reasons.push("no Gold datasets");
      if (openInc > 3)          reasons.push(`${openInc} open incidents`);
      if (ungovernedPct > 0.3)  reasons.push(`${Math.round(ungovernedPct * 100)}% ungoverned`);
      if (avgQuality < 55)      reasons.push(`avg quality ${Math.round(avgQuality)}`);
      extraCharEvents.push(`❌ Compliance audit FAILED: ${reasons.join(", ")}. Trust -15.`);
      auditIncidents.push({
        id: `audit-fail-${nextTick}`,
        type: "compliance_audit_failed",
        severity: "critical",
        affectedDatasetIds: [],
        source: "governance",
        status: "open",
        timeToResolve: 6,
        createdAtTick: nextTick,
      });
      nextAuditTick += 20;
    }

    // Resolve the audit warning pressure if still pending
    const finalAllPressures = [...allPressures, ...auditPressures].map((p) =>
      p.type === "compliance_audit" && p.status === "pending" && p.id.startsWith("audit-warning")
        ? { ...p, status: "completed" as const }
        : p
    );
    allPressures.splice(0, allPressures.length, ...finalAllPressures);

    // Apply trust delta for audit result
    const auditTrustDelta = passed ? 15 : -15;
    const auditRepDelta   = passed ? 8  : -5;
    const finalTrust      = trustScore + auditTrustDelta;
    const finalRep        = Math.max(0, Math.min(100, reputation + auditRepDelta));
    const finalPeakTrust  = Math.max(peakTrustScore, finalTrust);

    const allFinalIncidents = [...allIncidentsWithSecurity, ...auditIncidents];
    const allFinalCharEvents = [
      ...extraCharEvents,
      ...characterEvents,
    ].slice(0, 30);

    return {
      tick: nextTick,
      persons: updatedPersons,
      datasets: promotedDatasets,
      silos: allSilos,
      signals: allSignals,
      catalogue: catalogueAfterDepartures,
      incidents: allFinalIncidents,
      executivePressures: [...allPressures, ...auditPressures],
      healingEvents: allHealingEvents,
      trustScore: finalTrust,
      reputation: finalRep,
      peakTrustScore: finalPeakTrust,
      gamePhase,
      characterEvents: allFinalCharEvents,
      nextAuditTick,
      auditsPassed,
      auditsFailed,
    };
  }

  // Standard return (non-audit tick)
  const allFinalIncidentsStandard = [...allIncidentsWithSecurity];
  const allFinalCharEvents = [...extraCharEvents, ...characterEvents].slice(0, 30);

  return {
    tick: nextTick,
    persons: updatedPersons,
    datasets: promotedDatasets,
    silos: allSilos,
    signals: allSignals,
    catalogue: catalogueAfterDepartures,
    incidents: allFinalIncidentsStandard,
    executivePressures: [...allPressures, ...auditPressures],
    healingEvents: allHealingEvents,
    trustScore,
    reputation,
    peakTrustScore,
    gamePhase,
    characterEvents: allFinalCharEvents,
    nextAuditTick,
    auditsPassed,
    auditsFailed,
  };
}
