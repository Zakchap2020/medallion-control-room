import { useState } from "react";
import { useGameStore } from "../../state/store";

export function TickButton() {
  const runTick = useGameStore((s) => s.runTick);
  const [key, setKey] = useState(0);

  const handleClick = () => {
    runTick();
    setKey((k) => k + 1);
  };

  return (
    <button
      key={key}
      onClick={handleClick}
      className="anim-num-pop"
      style={{
        padding: "7px 28px",
        fontSize: "13px",
        fontWeight: "bold",
        background: "#001a0d",
        color: "#00ff88",
        border: "1px solid #00ff8855",
        borderRadius: "3px",
        cursor: "pointer",
        letterSpacing: "0.08em",
        fontFamily: "'Courier New', Courier, monospace",
        textTransform: "uppercase",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#002a14";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#00ff8888";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#001a0d";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#00ff8855";
      }}
    >
      ▶ Run Tick
    </button>
  );
}
