import { useGameStore } from "../../state/store";

export function TickButton() {
  const runTick = useGameStore((s) => s.runTick);

  return (
    <button
      onClick={runTick}
      style={{
        padding: "10px 32px",
        fontSize: "16px",
        fontWeight: "bold",
        background: "#00ff88",
        color: "#0a0a0a",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        letterSpacing: "0.05em",
      }}
    >
      ▶ RUN TICK
    </button>
  );
}
