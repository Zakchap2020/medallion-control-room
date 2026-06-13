import type { Dataset, Department } from "../models/types";

const DEPARTMENTS: Department[] = ["Finance", "Sales", "Marketing", "HR", "Operations"];

const DATASET_PREFIXES = [
  "raw", "ingest", "landing", "source", "feed",
  "extract", "dump", "intake", "capture", "load",
];

const DATASET_SUFFIXES = [
  "transactions", "records", "events", "logs", "entries",
  "submissions", "reports", "data", "export", "stream",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let counter = 0;

export function generateBronzeDatasets(tick: number): Dataset[] {
  const count = randomInt(1, 3);
  const datasets: Dataset[] = [];

  for (let i = 0; i < count; i++) {
    counter += 1;
    const dept = randomFrom(DEPARTMENTS);
    const prefix = randomFrom(DATASET_PREFIXES);
    const suffix = randomFrom(DATASET_SUFFIXES);

    datasets.push({
      id: `ds-${tick}-${counter}`,
      name: `${dept.toLowerCase()}_${prefix}_${suffix}`,
      department: dept,
      layer: "bronze",
      recordCount: randomInt(100, 5000),
      autoFixEnabled: true,
      // Raw Bronze data starts imperfect — reflects real ingestion reality
      quality: {
        accuracy:     randomInt(55, 82),
        completeness: randomInt(48, 78),
        consistency:  randomInt(42, 70),
        uniqueness:   randomInt(65, 90),
        timeliness:   randomInt(58, 86),
      },
    });
  }

  return datasets;
}
