import type { GameState, Department } from "../models/types";
import { compositeQuality } from "./medallionEngine";

export function departmentHealth(dept: Department, state: GameState): number {
  const deptDatasets  = state.datasets.filter((d) => d.department === dept);
  const deptCatalogue = deptDatasets.map((d) => state.catalogue[d.id]).filter(Boolean);

  const avgQuality = deptDatasets.length > 0
    ? deptDatasets.reduce((s, d) => s + compositeQuality(d.quality), 0) / deptDatasets.length
    : 50;

  const ungovernedPct = deptCatalogue.length > 0
    ? deptCatalogue.filter((e) => !e.ownerId).length / deptCatalogue.length
    : 0;

  const deptIds = new Set(deptDatasets.map((d) => d.id));
  const openIncidents = state.incidents.filter(
    (i) =>
      (i.status === "open" || i.status === "in_progress") &&
      i.affectedDatasetIds.some((id) => deptIds.has(id))
  ).length;

  return Math.max(0, Math.min(100,
    avgQuality * 0.5 - ungovernedPct * 30 - openIncidents * 8
  ));
}

export function healthColor(score: number): string {
  if (score >= 70) return "#00ff88";
  if (score >= 45) return "#ffa500";
  if (score >= 25) return "#ff6600";
  return "#ff2222";
}
