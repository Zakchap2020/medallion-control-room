import { useGameStore } from "../../state/store";
import type { Incident, IncidentSeverity } from "../../models/types";
import { showToast } from "../ui/ToastStack";

const SEV_COLORS: Record<IncidentSeverity, string> = {
  critical: "#ff2222",
  high:     "#ff6600",
  medium:   "#ffd700",
  low:      "#00ff88",
};

const TYPE_LABELS: Record<string, string> = {
  data_quality_failure:    "Data Quality Failure",
  kpi_mismatch:            "KPI Mismatch",
  silo_dependency_failure: "Silo Dependency",
  governance_failure:      "Governance Failure",
  pipeline_break:          "Pipeline Break",
};

const SOURCE_ICONS: Record<string, string> = {
  analyst:    "📡",
  system:     "⚙",
  silo:       "◈",
  governance: "⬡",
};

export function IncidentPanel() {
  const incidents               = useGameStore((s) => s.incidents);
  const resolveIncident         = useGameStore((s) => s.resolveIncident);
  const assignAnalystToIncident = useGameStore((s) => s.assignAnalystToIncident);

  const active = incidents
    .filter((i) => i.status === "open" || i.status === "in_progress")
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    });

  const failedCount   = incidents.filter((i) => i.status === "failed").length;
  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "7px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: "8px", fontSize: "9px" }}>
          {failedCount   > 0 && <span style={{ color: "#555" }}>{failedCount} failed</span>}
          {resolvedCount > 0 && <span style={{ color: "#1a4a1a" }}>{resolvedCount} resolved</span>}
          {active.length === 0 && failedCount === 0 && (
            <span style={{ color: "#1a1a1a" }}>No active incidents</span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "5px" }}>
        {active.map((inc) => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            onResolve={() => {
              resolveIncident(inc.id);
              showToast(`Incident resolved — ${TYPE_LABELS[inc.type]}`, "success");
            }}
            onAssign={() => {
              assignAnalystToIncident(inc.id);
              showToast("Analyst assigned to incident", "info");
            }}
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
  const color   = SEV_COLORS[incident.severity];
  const urgent  = incident.timeToResolve <= 2;
  const isCrit  = incident.severity === "critical";

  return (
    <div
      className={isCrit ? "anim-row-appear" : ""}
      style={{
        background: isCrit ? "#110000" : "#0d0d0d",
        border: `1px solid ${color}22`,
        borderLeft: `3px solid ${color}`,
        borderRadius: "3px",
        padding: "7px 9px",
        boxShadow: isCrit ? `0 0 10px ${color}14` : "none",
      }}
    >
      {/* Row 1: type + severity badge + countdown */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
        <span style={{ color: "#c8c8c8", fontSize: "11px" }}>
          {TYPE_LABELS[incident.type]}
        </span>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, marginLeft: "8px" }}>
          <span style={{
            color,
            fontSize: "8px",
            fontWeight: "bold",
            border: `1px solid ${color}44`,
            borderRadius: "2px",
            padding: "1px 5px",
            letterSpacing: "0.06em",
          }}>
            {incident.severity.toUpperCase()}
          </span>
          <span
            className={urgent ? "anim-urgent-blink" : ""}
            style={{
              color: urgent ? color : "#444",
              fontSize: "10px",
              fontWeight: "bold",
              fontFamily: "monospace",
              minWidth: "28px",
              textAlign: "right",
            }}
          >
            T-{incident.timeToResolve}
          </span>
        </div>
      </div>

      {/* Row 2: source + status + actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "6px", fontSize: "9px", color: "#2a2a2a", alignItems: "center" }}>
          <span>{SOURCE_ICONS[incident.source] ?? "?"}</span>
          <span style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>{incident.source}</span>
          <span style={{ color: incident.status === "in_progress" ? "#00bfff44" : "#222" }}>
            {incident.status === "in_progress" ? "◎ in progress" : "○ open"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {incident.status === "open" && (
            <ActionButton color="#00bfff" label="Assign" onClick={onAssign} />
          )}
          <ActionButton color={color} label="Resolve" onClick={onResolve} />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ color, label, onClick }: { color: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: `1px solid ${color}66`,
        color,
        borderRadius: "2px",
        padding: "2px 8px",
        fontSize: "9px",
        cursor: "pointer",
        fontFamily: "inherit",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = color + "18";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {label}
    </button>
  );
}
