import type { QualityDimensions, DataLayer, DatasetState } from "../models/types";

export function compositeQuality(q: QualityDimensions): number {
  return Math.round(
    (q.completeness + q.accuracy + q.consistency + q.timeliness + q.validity) / 5
  );
}

export function qualityColor(score: number): string {
  if (score >= 75) return "#00ff88";
  if (score >= 55) return "#ffa500";
  if (score >= 35) return "#ff6600";
  return "#ff2222";
}

export function layerForState(ds: DatasetState): DataLayer {
  const cq = compositeQuality(ds.quality);
  if (cq >= 80 && ds.ownerId && ds.stewardId) return "gold";
  if (cq >= 60 && ds.ownerId) return "silver";
  return "bronze";
}

export function governanceScore(ds: DatasetState): number {
  let score = 0;
  if (ds.ownerId) score += 35;
  if (ds.stewardId) score += 30;
  if (ds.custodianId || ds.engineerId) score += 20;
  return Math.min(100, score);
}
