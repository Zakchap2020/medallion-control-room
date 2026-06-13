import { useGameStore } from "../state/store";
import { GovernanceModelChoice } from "../components/setup/GovernanceModelChoice";
import { DashboardLayout } from "../components/layout/DashboardLayout";

export function App() {
  const phase = useGameStore((s) => s.gamePhase);
  if (phase === "setup") return <GovernanceModelChoice />;
  return <DashboardLayout />;
}
