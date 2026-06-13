export type Department = "Finance" | "Sales" | "Marketing" | "HR" | "Operations";

export interface Dataset {
  id: string;
  name: string;
  department: Department;
  layer: "bronze";
  recordCount: number;
}

export interface GameState {
  datasets: Dataset[];
  tick: number;
  trustScore: number;
}
