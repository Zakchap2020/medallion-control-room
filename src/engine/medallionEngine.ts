import type {
  Dataset,
  DatasetQuality,
  CatalogueEntry,
  HealingEvent,
  GameState,
} from "../models/types";

// ─── Utilities ───────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function compositeQuality(q: DatasetQuality): number {
  return (q.accuracy + q.completeness + q.consistency + q.uniqueness + q.timeliness) / 5;
}

let healCounter = 0;

// ─── 1. Quality drift ─────────────────────────────────────────────────────────
// Applied every tick before auto-fix. Governance determines how fast things decay.

export function applyQualityDrift(
  datasets: Dataset[],
  catalogue: Record<string, CatalogueEntry>,
  silos: GameState["silos"]
): Dataset[] {
  return datasets.map((ds) => {
    if (ds.layer === "gold") return ds; // Gold is stable once promoted

    const entry    = catalogue[ds.id];
    const hasOwner = !!entry?.ownerId;
    const hasSteward  = !!entry?.stewardId;
    const hasCustodian = !!entry?.custodianId;

    // Active uncontained silo in dept amplifies drift
    const siloPresent = silos.some(
      (s) => s.department === ds.department && !s.contained && s.riskLevel > 50
    );
    const siloMult = siloPresent ? 1.6 : 1.0;

    const q = { ...ds.quality };

    // Schema drift — always decays in Bronze, slower in Silver
    const driftBase = ds.layer === "bronze" ? ri(1, 3) : ri(0, 2);
    q.consistency = clamp(q.consistency - driftBase * siloMult);

    // Completeness decays without custodian (ingestion issues)
    if (!hasCustodian) q.completeness = clamp(q.completeness - ri(1, 2));

    // Accuracy decays without owner (no correctness checks)
    if (!hasOwner) q.accuracy = clamp(q.accuracy - ri(0, 1));

    // Uniqueness decays in Bronze (re-ingestion duplicates)
    if (ds.layer === "bronze") q.uniqueness = clamp(q.uniqueness - ri(0, 2));

    // Timeliness decays without steward maintaining freshness contracts
    if (!hasSteward) q.timeliness = clamp(q.timeliness - ri(0, 1));

    return { ...ds, quality: q };
  });
}

// ─── 2. Auto-fix ─────────────────────────────────────────────────────────────
// Attempts automatic repair. Quality of outcome depends on governance coverage.

export function runAutoFix(
  datasets: Dataset[],
  catalogue: Record<string, CatalogueEntry>,
  silos: GameState["silos"],
  tick: number
): { datasets: Dataset[]; events: HealingEvent[] } {
  const events: HealingEvent[] = [];
  const maxEvents = 8; // cap per tick to avoid flooding

  const updated = datasets.map((ds) => {
    if (!ds.autoFixEnabled) return ds;
    if (ds.layer === "gold")  return ds;

    const entry      = catalogue[ds.id];
    const hasSteward = !!entry?.stewardId;

    // Silos can corrupt or block auto-fix
    const blockedBySilo = silos.some(
      (s) => s.department === ds.department && !s.contained && s.riskLevel > 65
    ) && Math.random() < 0.45;

    if (blockedBySilo) {
      if (events.length < maxEvents) {
        healCounter++;
        events.push({
          id: `heal-${tick}-${healCounter}`,
          tick,
          datasetId: ds.id,
          datasetName: ds.name,
          action: "clean_nulls",
          success: false,
          qualityDelta: 0,
          note: "blocked by active silo",
        });
      }
      return ds;
    }

    // Without steward: 35% chance fix introduces errors instead
    if (!hasSteward && Math.random() < 0.35) {
      const q    = { ...ds.quality };
      const loss = ri(1, 5);
      const dims = [
        "accuracy", "completeness", "consistency", "uniqueness", "timeliness",
      ] as (keyof DatasetQuality)[];
      const target = dims[Math.floor(Math.random() * dims.length)];
      q[target] = clamp(q[target] - loss);

      if (events.length < maxEvents) {
        healCounter++;
        events.push({
          id: `heal-${tick}-${healCounter}`,
          tick,
          datasetId: ds.id,
          datasetName: ds.name,
          action: "standardise_schema",
          success: false,
          qualityDelta: -loss,
          note: "unguided fix — error introduced",
        });
      }
      return { ...ds, quality: q };
    }

    // Successful fix — steward improves effectiveness
    const q = { ...ds.quality };
    let totalDelta = 0;

    if (q.completeness < 82) {
      const d = ri(1, hasSteward ? 5 : 2);
      q.completeness = clamp(q.completeness + d);
      totalDelta += d;
      if (events.length < maxEvents) {
        healCounter++;
        events.push({
          id: `heal-${tick}-${healCounter}`,
          tick,
          datasetId: ds.id,
          datasetName: ds.name,
          action: "clean_nulls",
          success: true,
          qualityDelta: d,
        });
      }
    }

    if (q.uniqueness < 82) {
      const d = ri(1, hasSteward ? 4 : 2);
      q.uniqueness = clamp(q.uniqueness + d);
      totalDelta += d;
      if (events.length < maxEvents) {
        healCounter++;
        events.push({
          id: `heal-${tick}-${healCounter}`,
          tick,
          datasetId: ds.id,
          datasetName: ds.name,
          action: "deduplicate",
          success: true,
          qualityDelta: d,
        });
      }
    }

    if (q.consistency < 78) {
      const d = ri(2, hasSteward ? 7 : 3);
      q.consistency = clamp(q.consistency + d);
      totalDelta += d;
      if (events.length < maxEvents) {
        healCounter++;
        events.push({
          id: `heal-${tick}-${healCounter}`,
          tick,
          datasetId: ds.id,
          datasetName: ds.name,
          action: "standardise_schema",
          success: true,
          qualityDelta: d,
        });
      }
    }

    return { ...ds, quality: q };
  });

  return { datasets: updated, events };
}

// ─── 3. Pipeline promotion (Bronze → Silver → Gold) ───────────────────────────

export function promoteDatasets(
  datasets: Dataset[],
  catalogue: Record<string, CatalogueEntry>,
  tick: number
): {
  datasets: Dataset[];
  catalogue: Record<string, CatalogueEntry>;
  events: HealingEvent[];
} {
  const events: HealingEvent[] = [];
  const updatedCatalogue = { ...catalogue };

  const updated = datasets.map((ds) => {
    const entry = catalogue[ds.id];
    if (!entry) return ds;

    const cq = compositeQuality(ds.quality);

    // ── Bronze → Silver ────────────────────────────────────────────────────
    if (ds.layer === "bronze") {
      // Requires: custodian assigned, composite quality > 65, 40% chance per tick
      if (cq <= 65 || !entry.custodianId || Math.random() > 0.4) return ds;

      const q: DatasetQuality = {
        ...ds.quality,
        completeness: clamp(ds.quality.completeness + ri(3, 8)),
        consistency:  clamp(ds.quality.consistency  + ri(6, 12)),
        uniqueness:   clamp(ds.quality.uniqueness   + ri(4, 9)),
      };

      updatedCatalogue[ds.id] = { ...updatedCatalogue[ds.id], layer: "silver" };
      healCounter++;
      events.push({
        id: `heal-${tick}-${healCounter}`,
        tick,
        datasetId: ds.id,
        datasetName: ds.name,
        action: "auto_promoted",
        success: true,
        qualityDelta: ri(8, 15),
        note: "Bronze → Silver",
      });
      return { ...ds, layer: "silver" as const, quality: q };
    }

    // ── Silver → Gold ──────────────────────────────────────────────────────
    if (ds.layer === "silver") {
      // Requires: owner + steward assigned, composite quality > 80, 20% chance
      if (cq <= 80 || !entry.ownerId || !entry.stewardId || Math.random() > 0.2) return ds;

      const q: DatasetQuality = {
        ...ds.quality,
        accuracy:    clamp(ds.quality.accuracy    + ri(5, 10)),
        consistency: clamp(ds.quality.consistency + ri(3, 7)),
        timeliness:  clamp(ds.quality.timeliness  + ri(2, 5)),
      };

      updatedCatalogue[ds.id] = { ...updatedCatalogue[ds.id], layer: "gold" };
      healCounter++;
      events.push({
        id: `heal-${tick}-${healCounter}`,
        tick,
        datasetId: ds.id,
        datasetName: ds.name,
        action: "validate_governance_rules",
        success: true,
        qualityDelta: ri(10, 18),
        note: "Silver → Gold",
      });
      return { ...ds, layer: "gold" as const, quality: q };
    }

    return ds;
  });

  return { datasets: updated, catalogue: updatedCatalogue, events };
}

// ─── 4. Trust contribution from pipeline quality ──────────────────────────────

export function computeQualityTrustDelta(datasets: Dataset[]): number {
  const gold  = datasets.filter((d) => d.layer === "gold").length;
  const poor  = datasets.filter((d) => compositeQuality(d.quality) < 30).length;
  // Gold datasets earn trust; severely degraded datasets drain it
  return Math.min(3, gold) - Math.min(3, poor);
}
