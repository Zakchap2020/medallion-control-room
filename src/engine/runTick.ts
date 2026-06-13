import type { GameState } from "../models/types";
import { generateBronzeDatasets } from "./datasetGenerator";

export function runTick(state: GameState): Partial<GameState> {
  const nextTick = state.tick + 1;
  const newDatasets = generateBronzeDatasets(nextTick);

  return {
    tick: nextTick,
    datasets: [...state.datasets, ...newDatasets],
    trustScore: state.trustScore + 1,
  };
}
