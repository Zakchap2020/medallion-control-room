import { create } from "zustand";
import type { GameState } from "../models/types";
import { runTick } from "../engine/runTick";

interface GameStore extends GameState {
  runTick: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  datasets: [],
  tick: 0,
  trustScore: 0,
  runTick: () => {
    const state = get();
    const updates = runTick(state);
    set(updates);
  },
}));
