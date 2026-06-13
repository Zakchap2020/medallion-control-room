import type { GameState, Silo, Department } from "../models/types";
import { deptGovernanceRisk } from "./governanceEngine";

const DEPARTMENTS: Department[] = ["Finance", "Sales", "Marketing", "HR", "Operations"];

const SILO_NAME_TEMPLATES = [
  (d: string) => `shadow_${d}_store`,
  (d: string) => `unofficial_${d}_feed`,
  (d: string) => `unregistered_${d}_extract`,
  (d: string) => `local_${d}_copy`,
  (d: string) => `${d}_dark_archive`,
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let siloCounter = 0;

export function updateSiloRisks(silos: Silo[]): Silo[] {
  return silos.map((silo) => {
    if (silo.contained) return silo;
    return { ...silo, riskLevel: Math.min(100, silo.riskLevel + randomInt(3, 10)) };
  });
}

export function spawnNewSilos(state: GameState, tick: number): Silo[] {
  // Grace period: no silos in first 2 ticks
  if (tick < 3) return [];

  const activeSiloCount = state.silos.filter((s) => !s.contained).length;
  if (activeSiloCount >= 8) return [];

  const deptCounts: Partial<Record<Department, number>> = {};
  for (const ds of state.datasets) {
    deptCounts[ds.department] = (deptCounts[ds.department] ?? 0) + 1;
  }

  const newSilos: Silo[] = [];

  for (const dept of DEPARTMENTS) {
    const count = deptCounts[dept] ?? 0;
    if (count < 2) continue;

    const activeSilosInDept = state.silos.filter(
      (s) => s.department === dept && !s.contained
    ).length;
    if (activeSilosInDept >= 2) continue;

    // Weak governance in this dept increases silo formation pressure
    const govRisks = deptGovernanceRisk(state.catalogue, state.datasets);
    const govMultiplier = (govRisks[dept] ?? 0) > 50 ? 1.4 : 1.0;
    const spawnChance = Math.min(0.50, (0.1 + (count - 1) * 0.05) * govMultiplier);
    if (Math.random() > spawnChance) continue;

    siloCounter += 1;
    const template = SILO_NAME_TEMPLATES[siloCounter % SILO_NAME_TEMPLATES.length];
    newSilos.push({
      id: `silo-${tick}-${siloCounter}`,
      name: template(dept.toLowerCase()),
      department: dept,
      riskLevel: randomInt(10, 30),
      importance: randomInt(20, 80),
      discovered: false,
      contained: false,
    });
  }

  return newSilos;
}

export function computeSiloTrustDelta(silos: Silo[]): number {
  let delta = 0;
  for (const silo of silos) {
    if (silo.contained) continue;
    if (silo.riskLevel > 90) delta -= 4;
    else if (silo.riskLevel > 70) delta -= 2;
  }
  return delta;
}
