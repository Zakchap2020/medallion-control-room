import { useGameStore } from "../../state/store";

const SEVERITY_COLORS = {
  low: "#ffd700",
  medium: "#ffa500",
  high: "#ff4444",
};

const DEPT_COLORS: Record<string, string> = {
  Finance: "#ffd700",
  Sales: "#00bfff",
  Marketing: "#ff69b4",
  HR: "#98fb98",
  Operations: "#ffa500",
};

const TYPE_LABELS: Record<string, string> = {
  inconsistency_detected:    "Data Inconsistency",
  shadow_dataset_detected:   "Shadow Dataset",
  schema_drift:              "Schema Drift",
  duplicate_data_suspected:  "Duplicate Data",
  missing_owner:             "⚠ Missing Owner",
  governance_risk_escalating: "⚠ Governance Risk",
};

export function SignalFeed() {
  const signals = useGameStore((s) => s.signals);
  const investigateSignal = useGameStore((s) => s.investigateSignal);
  const resolveSignal = useGameStore((s) => s.resolveSignal);

  const unresolved = [...signals].filter((s) => !s.resolved).reverse().slice(0, 8);
  const unresolvedCount = signals.filter((s) => !s.resolved).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div
        style={{
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
        }}
      >
        <span>Signal Feed</span>
        {unresolvedCount > 0 && (
          <span style={{ color: "#ff4444" }}>{unresolvedCount} unresolved</span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
        {unresolved.length === 0 && (
          <div style={{ color: "#2a2a2a", fontSize: "11px", paddingTop: "6px" }}>
            No signals. Assign analysts to departments to begin monitoring.
          </div>
        )}

        {unresolved.map((signal) => (
          <div
            key={signal.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#0f0f0f",
              border: "1px solid #181818",
              borderLeft: `2px solid ${SEVERITY_COLORS[signal.severity]}`,
              borderRadius: "2px",
              padding: "5px 8px",
              fontSize: "11px",
            }}
          >
            <span
              style={{
                color: SEVERITY_COLORS[signal.severity],
                fontWeight: "bold",
                textTransform: "uppercase",
                fontSize: "9px",
                minWidth: "40px",
              }}
            >
              {signal.severity}
            </span>
            <span style={{ color: "#c0c0c0", flex: 1 }}>
              {TYPE_LABELS[signal.type]}
            </span>
            <span
              style={{
                color: DEPT_COLORS[signal.department] ?? "#555",
                minWidth: "76px",
                fontSize: "10px",
              }}
            >
              {signal.department}
            </span>
            <span style={{ color: "#333", fontSize: "9px", minWidth: "28px" }}>
              T{signal.tick}
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              {signal.relatedSiloId && (
                <button
                  onClick={() => investigateSignal(signal.id)}
                  style={{
                    background: "transparent",
                    border: "1px solid #ffa500",
                    color: "#ffa500",
                    borderRadius: "2px",
                    padding: "2px 8px",
                    fontSize: "9px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Investigate
                </button>
              )}
              <button
                onClick={() => resolveSignal(signal.id)}
                style={{
                  background: "transparent",
                  border: "1px solid #2a2a2a",
                  color: "#444",
                  borderRadius: "2px",
                  padding: "2px 8px",
                  fontSize: "9px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textTransform: "uppercase",
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
