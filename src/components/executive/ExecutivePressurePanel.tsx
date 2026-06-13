import { useGameStore } from "../../state/store";
import type { ExecutivePressure } from "../../models/types";
import { showToast } from "../ui/ToastStack";

const URGENCY_COLORS = {
  critical: "#ff2222",
  high:     "#ff6600",
  medium:   "#ffd700",
  low:      "#00bfff",
};

const TYPE_LABELS: Record<string, string> = {
  board_request:      "Board Request",
  finance_pressure:   "Finance Pressure",
  compliance_audit:   "Compliance Audit",
  ceo_escalation:     "CEO Escalation",
  operational_review: "Ops Review",
};

const TYPE_ICONS: Record<string, string> = {
  board_request:      "◈",
  finance_pressure:   "₿",
  compliance_audit:   "⬡",
  ceo_escalation:     "▲",
  operational_review: "⚙",
};

export function ExecutivePressurePanel() {
  const pressures            = useGameStore((s) => s.executivePressures);
  const completeExecPressure = useGameStore((s) => s.completeExecutivePressure);

  const active = pressures.filter((p) => p.status === "pending");
  const failed = pressures.filter((p) => p.status === "failed").length;
  const completed = pressures.filter((p) => p.status === "completed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Summary */}
      {(failed > 0 || completed > 0) && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "7px", fontSize: "9px", flexShrink: 0 }}>
          {failed    > 0 && <span style={{ color: "#4a1a1a" }}>{failed} failed</span>}
          {completed > 0 && <span style={{ color: "#1a4a1a" }}>{completed} delivered</span>}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
        {active.length === 0 && (
          <div style={{ color: "#1a1a1a", fontSize: "11px", paddingTop: "6px" }}>
            No active leadership demands.
          </div>
        )}
        {active.map((p) => (
          <PressureCard
            key={p.id}
            pressure={p}
            onComplete={() => {
              completeExecPressure(p.id);
              showToast(`Delivered: ${TYPE_LABELS[p.type]}`, "success");
            }}
          />
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
  const urgent = pressure.timeLimit <= 3;
  const isCrit = pressure.urgency === "critical" || pressure.urgency === "high";

  return (
    <div style={{
      background: isCrit ? "#110800" : "#0d0d0d",
      border: `1px solid ${color}22`,
      borderLeft: `3px solid ${color}`,
      borderRadius: "3px",
      padding: "8px 10px",
      boxShadow: isCrit ? `0 0 12px ${color}10` : "none",
    }}>
      {/* Type + countdown */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ color, fontSize: "11px" }}>{TYPE_ICONS[pressure.type] ?? "▶"}</span>
          <span style={{
            fontSize: "9px",
            color,
            textTransform: "uppercase",
            fontWeight: "bold",
            letterSpacing: "0.06em",
          }}>
            {TYPE_LABELS[pressure.type]}
          </span>
        </div>
        <span
          className={urgent ? "anim-urgent-blink" : ""}
          style={{
            fontSize: "10px",
            color: urgent ? color : "#444",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        >
          {pressure.timeLimit}T
        </span>
      </div>

      {/* Demand text */}
      <div style={{ fontSize: "11px", color: "#888", marginBottom: "7px", lineHeight: "1.45" }}>
        {pressure.demand}
      </div>

      {/* Domains + action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
          {pressure.requiredDatasetDomains.map((d) => (
            <span key={d} style={{
              fontSize: "8px",
              color: "#333",
              border: "1px solid #1e1e1e",
              borderRadius: "2px",
              padding: "1px 5px",
              letterSpacing: "0.03em",
            }}>
              {d}
            </span>
          ))}
        </div>
        <button
          onClick={onComplete}
          style={{
            background: isCrit ? `${color}18` : "transparent",
            border: `1px solid ${color}66`,
            color,
            borderRadius: "2px",
            padding: "3px 10px",
            fontSize: "9px",
            cursor: "pointer",
            fontFamily: "inherit",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = color + "28";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = isCrit ? color + "18" : "transparent";
          }}
        >
          Deliver
        </button>
      </div>
    </div>
  );
}
