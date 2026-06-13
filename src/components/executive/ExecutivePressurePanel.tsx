import { useGameStore } from "../../state/store";
import type { ExecutivePressure } from "../../models/types";

const URGENCY_COLORS = {
  critical: "#ff2222",
  high:     "#ff6600",
  medium:   "#ffd700",
  low:      "#00bfff",
};

const TYPE_LABELS: Record<string, string> = {
  board_request:       "Board Request",
  finance_pressure:    "Finance Pressure",
  compliance_audit:    "Compliance Audit",
  ceo_escalation:      "CEO Escalation",
  operational_review:  "Ops Review",
};

export function ExecutivePressurePanel() {
  const pressures              = useGameStore((s) => s.executivePressures);
  const completeExecPressure   = useGameStore((s) => s.completeExecutivePressure);

  const active = pressures.filter((p) => p.status === "pending");
  const failed = pressures.filter((p) => p.status === "failed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{
        fontSize: "10px",
        color: "#444",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: "6px",
        borderBottom: "1px solid #1a1a1a",
        paddingBottom: "5px",
        display: "flex",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span>Executive Pressure</span>
        {failed > 0 && <span style={{ color: "#ff4444" }}>{failed} failed</span>}
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
        {active.length === 0 && (
          <div style={{ color: "#2a2a2a", fontSize: "11px", paddingTop: "6px" }}>
            No active demands from leadership.
          </div>
        )}
        {active.map((p) => (
          <PressureCard key={p.id} pressure={p} onComplete={() => completeExecPressure(p.id)} />
        ))}
      </div>
    </div>
  );
}

function PressureCard({
  pressure,
  onComplete,
}: {
  pressure: ExecutivePressure;
  onComplete: () => void;
}) {
  const color  = URGENCY_COLORS[pressure.urgency];
  const urgent = pressure.timeLimit <= 2;

  return (
    <div style={{
      background: "#0f0f0f",
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: "3px",
      padding: "8px 10px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{
          fontSize: "9px",
          color,
          textTransform: "uppercase",
          fontWeight: "bold",
          letterSpacing: "0.06em",
        }}>
          {TYPE_LABELS[pressure.type]}
        </span>
        <span style={{
          fontSize: "10px",
          color: urgent ? color : "#555",
          fontWeight: urgent ? "bold" : "normal",
        }}>
          {pressure.timeLimit}T remaining
        </span>
      </div>

      <div style={{ fontSize: "11px", color: "#c0c0c0", marginBottom: "7px", lineHeight: "1.4" }}>
        {pressure.demand}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {pressure.requiredDatasetDomains.map((d) => (
            <span key={d} style={{
              fontSize: "9px",
              color: "#444",
              border: "1px solid #2a2a2a",
              borderRadius: "2px",
              padding: "1px 5px",
            }}>
              {d}
            </span>
          ))}
        </div>
        <button
          onClick={onComplete}
          style={{
            background: "transparent",
            border: `1px solid ${color}`,
            color,
            borderRadius: "2px",
            padding: "3px 10px",
            fontSize: "9px",
            cursor: "pointer",
            fontFamily: "inherit",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Deliver
        </button>
      </div>
    </div>
  );
}
