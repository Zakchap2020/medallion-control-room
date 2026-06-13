import { useGameStore } from "../../state/store";
import type { Incident, IncidentSeverity } from "../../models/types";

const SEV_COLORS: Record<IncidentSeverity, string> = {
  critical: "#ff2222",
  high:     "#ff6600",
  medium:   "#ffd700",
  low:      "#00ff88",
};

const TYPE_LABELS: Record<string, string> = {
  data_quality_failure:     "Data Quality Failure",
  kpi_mismatch:             "KPI Mismatch",
  silo_dependency_failure:  "Silo Dependency",
  governance_failure:       "Governance Failure",
  pipeline_break:           "Pipeline Break",
};

function urgencyPulse(sev: IncidentSeverity, ttr: number) {
  if (sev === "critical" && ttr <= 2) return "#ff000033";
  if (sev === "high" && ttr <= 2)     return "#ff660022";
  return "transparent";
}

export function IncidentPanel() {
  const incidents               = useGameStore((s) => s.incidents);
  const resolveIncident         = useGameStore((s) => s.resolveIncident);
  const assignAnalystToIncident = useGameStore((s) => s.assignAnalystToIncident);

  const active = incidents
    .filter((i) => i.status === "open" || i.status === "in_progress")
    .sort((a, b) => {
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return sevOrder[a.severity] - sevOrder[b.severity];
    });

  const failedCount   = incidents.filter((i) => i.status === "failed").length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;

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
        <span>Incidents</span>
        <span>
          {active.length > 0 && <span style={{ color: "#ff4444", marginRight: "8px" }}>{active.length} active</span>}
          {failedCount > 0   && <span style={{ color: "#555",    marginRight: "8px" }}>{failedCount} failed</span>}
          {resolvedCount > 0 && <span style={{ color: "#00ff88" }}>{resolvedCount} resolved</span>}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        {active.length === 0 && (
          <div style={{ color: "#2a2a2a", fontSize: "11px", paddingTop: "6px" }}>
            No active incidents.
          </div>
        )}

        {active.map((inc) => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            onResolve={() => resolveIncident(inc.id)}
            onAssign={() => assignAnalystToIncident(inc.id)}
          />
        ))}
      </div>
    </div>
  );
}

function IncidentCard({
  incident,
  onResolve,
  onAssign,
}: {
  incident: Incident;
  onResolve: () => void;
  onAssign: () => void;
}) {
  const color  = SEV_COLORS[incident.severity];
  const urgent = incident.timeToResolve <= 2;

  return (
    <div style={{
      background: urgencyPulse(incident.severity, incident.timeToResolve) !== "transparent"
        ? urgencyPulse(incident.severity, incident.timeToResolve)
        : "#0f0f0f",
      border: `1px solid ${color}44`,
      borderLeft: `2px solid ${color}`,
      borderRadius: "2px",
      padding: "5px 8px",
      fontSize: "11px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ color: "#c0c0c0" }}>{TYPE_LABELS[incident.type]}</span>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{
            color,
            fontSize: "9px",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}>
            {incident.severity}
          </span>
          <span style={{
            color: urgent ? color : "#555",
            fontSize: "10px",
            fontWeight: urgent ? "bold" : "normal",
          }}>
            T-{incident.timeToResolve}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "9px", color: "#333", textTransform: "uppercase" }}>
          {incident.source} · {incident.status}
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          {incident.status === "open" && (
            <button onClick={onAssign} style={btnStyle("#00bfff")}>
              Assign
            </button>
          )}
          <button onClick={onResolve} style={btnStyle("#00ff88")}>
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(color: string) {
  return {
    background: "transparent",
    border: `1px solid ${color}`,
    color,
    borderRadius: "2px",
    padding: "2px 7px",
    fontSize: "9px",
    cursor: "pointer",
    fontFamily: "inherit",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  };
}
