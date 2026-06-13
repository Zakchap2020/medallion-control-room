import { useGameStore } from "../../state/store";
import { showToast } from "../ui/ToastStack";

const SEVERITY_COLORS = {
  low:    "#ffd700",
  medium: "#ffa500",
  high:   "#ff4444",
};

const DEPT_COLORS: Record<string, string> = {
  Finance:    "#ffd700",
  Sales:      "#00bfff",
  Marketing:  "#ff69b4",
  HR:         "#98fb98",
  Operations: "#ffa500",
};

const TYPE_LABELS: Record<string, string> = {
  inconsistency_detected:     "Data Inconsistency",
  shadow_dataset_detected:    "Shadow Dataset",
  schema_drift:               "Schema Drift",
  duplicate_data_suspected:   "Duplicate Data",
  missing_owner:              "Missing Owner",
  governance_risk_escalating: "Governance Risk ↑",
};

const TYPE_ICONS: Record<string, string> = {
  inconsistency_detected:     "≠",
  shadow_dataset_detected:    "◈",
  schema_drift:               "⟳",
  duplicate_data_suspected:   "⊕",
  missing_owner:              "⚠",
  governance_risk_escalating: "⬡",
};

export function SignalFeed() {
  const signals           = useGameStore((s) => s.signals);
  const tick              = useGameStore((s) => s.tick);
  const investigateSignal = useGameStore((s) => s.investigateSignal);
  const resolveSignal     = useGameStore((s) => s.resolveSignal);

  const unresolved = [...signals]
    .filter((s) => !s.resolved)
    .sort((a, b) => {
      const sOrder = { high: 0, medium: 1, low: 2 };
      return sOrder[a.severity] - sOrder[b.severity];
    })
    .slice(0, 10);

  const unresolvedCount = signals.filter((s) => !s.resolved).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px", flexShrink: 0 }}>
        <div style={{ fontSize: "9px" }}>
          {unresolvedCount > 10 && (
            <span style={{ color: "#2a2a2a" }}>showing 10 of {unresolvedCount}</span>
          )}
          {unresolvedCount === 0 && (
            <span style={{ color: "#1a1a1a" }}>
              No active signals — assign analysts to departments to monitor
            </span>
          )}
        </div>
      </div>

      {/* Signal cards */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        {unresolved.map((signal) => {
          const color    = SEVERITY_COLORS[signal.severity];
          const age      = tick - signal.tick;
          const isStale  = age >= 3;

          return (
            <div
              key={signal.id}
              className="anim-row-appear"
              style={{
                background: isStale ? "#110a00" : "#0d0d0d",
                border: `1px solid ${color}18`,
                borderLeft: `3px solid ${color}`,
                borderRadius: "3px",
                padding: "6px 9px",
              }}
            >
              {/* Row 1: icon + type + severity badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ color, fontSize: "10px" }}>
                    {TYPE_ICONS[signal.type] ?? "●"}
                  </span>
                  <span style={{ color: "#c0c0c0", fontSize: "10px" }}>
                    {TYPE_LABELS[signal.type]}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{
                    fontSize: "8px",
                    color,
                    border: `1px solid ${color}33`,
                    borderRadius: "2px",
                    padding: "1px 5px",
                    letterSpacing: "0.05em",
                    fontWeight: "bold",
                  }}>
                    {signal.severity.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Row 2: dept chip + age + actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{
                    fontSize: "8px",
                    color: DEPT_COLORS[signal.department] ?? "#555",
                    border: "1px solid #1a1a1a",
                    borderRadius: "2px",
                    padding: "1px 5px",
                  }}>
                    {signal.department}
                  </span>
                  <span style={{
                    fontSize: "8px",
                    color: isStale ? "#cc4400" : "#222",
                    fontFamily: "monospace",
                  }}>
                    {age === 0 ? "just now" : `${age}T ago`}
                    {isStale && " ⚠"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "3px" }}>
                  {signal.relatedSiloId && (
                    <button
                      onClick={() => {
                        investigateSignal(signal.id);
                        showToast("Signal investigated — silo discovered", "warning");
                      }}
                      style={sigBtnStyle("#ffa500")}
                    >
                      Investigate
                    </button>
                  )}
                  <button
                    onClick={() => {
                      resolveSignal(signal.id);
                      showToast("Signal dismissed", "info");
                    }}
                    style={sigBtnStyle("#333")}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function sigBtnStyle(color: string) {
  return {
    background: "transparent",
    border: `1px solid ${color}55`,
    color,
    borderRadius: "2px",
    padding: "2px 7px",
    fontSize: "8px",
    cursor: "pointer",
    fontFamily: "inherit",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  };
}
