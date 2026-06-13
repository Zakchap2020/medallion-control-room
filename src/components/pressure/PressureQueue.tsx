import { useState } from "react";
import type { BusinessPressure } from "../../models/types";
import { useGameStore } from "../../state/store";

const FONT = "'Courier New', Courier, monospace";

const URGENCY_COLOR: Record<string, string> = {
  critical: "#ff2222",
  high:     "#ff6600",
  medium:   "#ffd700",
};

const TYPE_LABELS: Record<string, string> = {
  governance_gap:        "Governance Gap",
  kpi_conflict:          "KPI Conflict",
  data_quality_failure:  "Quality Failure",
  compliance_risk:       "Compliance Risk",
  executive_escalation:  "Escalation",
  dependency_cascade:    "Dependency Failure",
  audit_demand:          "Audit Demand",
  stakeholder_frustration: "Stakeholder Pressure",
  shadow_data_risk:      "Shadow Data",
};

interface CardProps {
  pressure: BusinessPressure;
  capacity: number;
  onResolve: (pressureId: string, optionId: string) => void;
}

function PressureCard({ pressure, capacity, onResolve }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const uColor = URGENCY_COLOR[pressure.urgency] ?? "#ffd700";

  const stakeholders = useGameStore((s) => s.stakeholders);
  const source = pressure.sourceStakeholderId
    ? stakeholders.find((s) => s.id === pressure.sourceStakeholderId)
    : null;

  return (
    <div style={{
      background:    "#0d0d0d",
      border:        `1px solid ${uColor}22`,
      borderLeft:    `3px solid ${uColor}`,
      borderRadius:  "3px",
      marginBottom:  "8px",
      overflow:      "hidden",
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{ display: "flex", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px 12px", textAlign: "left", gap: "8px", alignItems: "flex-start" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span style={{ fontSize: "7px", color: uColor, background: uColor + "18", border: `1px solid ${uColor}44`, borderRadius: "2px", padding: "1px 5px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: FONT, flexShrink: 0 }}>
              {pressure.urgency}
            </span>
            <span style={{ fontSize: "7px", color: "#585858", fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {TYPE_LABELS[pressure.type] ?? pressure.type}
            </span>
            {source && (
              <span style={{ fontSize: "7px", color: "#484848", fontFamily: FONT, marginLeft: "auto" }}>
                via {source.name}
              </span>
            )}
          </div>
          <div style={{ fontSize: "10px", color: "#c0c0c0", fontFamily: FONT, lineHeight: 1.3 }}>
            {pressure.title}
          </div>
          <div style={{ fontSize: "9px", color: "#909090", fontFamily: FONT, lineHeight: 1.4, marginTop: "3px" }}>
            {pressure.description}
          </div>
        </div>
        <span style={{ fontSize: "9px", color: "#585858", fontFamily: FONT, flexShrink: 0, marginTop: "2px" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #141414", padding: "10px 12px" }}>
          {/* Cause chain */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "8px", color: "#585858", fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>
              Why this happened
            </div>
            {pressure.causeChain.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                <span style={{ fontSize: "8px", color: "#585858", fontFamily: FONT }}>{i + 1}.</span>
                <span style={{ fontSize: "8px", color: "#909090", fontFamily: FONT, lineHeight: 1.4 }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Consequence */}
          <div style={{ fontSize: "8px", color: "#6e6e6e", fontFamily: FONT, fontStyle: "italic", marginBottom: "10px", lineHeight: 1.4 }}>
            If ignored: {pressure.consequenceIfIgnored}
          </div>

          {/* Resolution options */}
          <div style={{ fontSize: "8px", color: "#585858", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FONT, marginBottom: "6px" }}>
            Resolution options
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {pressure.resolutionOptions.map((opt) => {
              const canAfford = capacity >= opt.capacityCost;
              return (
                <button
                  key={opt.id}
                  disabled={!canAfford}
                  onClick={() => onResolve(pressure.id, opt.id)}
                  style={{
                    background:    canAfford ? "#0a0a0a" : "#080808",
                    border:        `1px solid ${canAfford ? "#2a2a2a" : "#141414"}`,
                    borderRadius:  "2px",
                    padding:       "8px 10px",
                    cursor:        canAfford ? "pointer" : "not-allowed",
                    textAlign:     "left",
                    opacity:       canAfford ? 1 : 0.45,
                    width:         "100%",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                    <span style={{ fontSize: "9px", color: canAfford ? "#c0c0c0" : "#383838", fontFamily: FONT }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: "8px", color: canAfford ? "#ffd700" : "#252525", fontFamily: FONT, flexShrink: 0, marginLeft: "8px" }}>
                      {opt.capacityCost} cap
                    </span>
                  </div>
                  <div style={{ fontSize: "8px", color: "#6e6e6e", fontFamily: FONT, lineHeight: 1.4 }}>
                    {opt.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PressureQueue() {
  const pressures       = useGameStore((s) => s.pressures);
  const cycleCapacity   = useGameStore((s) => s.cycleCapacity);
  const resolvePressure = useGameStore((s) => s.resolvePressure);

  const open = pressures
    .filter((p) => p.status === "open")
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2 };
      return (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
    });

  const available = cycleCapacity.total - cycleCapacity.used;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
        fontSize:       "9px",
        color:          "#383838",
        textTransform:  "uppercase",
        letterSpacing:  "0.14em",
        padding:        "7px 10px",
        borderBottom:   "1px solid #141414",
        flexShrink:     0,
      }}>
        <span>Pressures{open.length > 0 ? ` — ${open.length} open` : ""}</span>
        <span style={{ color: available > 0 ? "#909090" : "#ff4444" }}>
          {available}/{cycleCapacity.total} cap remaining
        </span>
      </div>

      {/* Pressure list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
        {open.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: "9px", color: "#484848", fontFamily: FONT, marginBottom: "6px" }}>No active pressures.</div>
            <div style={{ fontSize: "8px", color: "#3a3a3a", fontFamily: FONT }}>Governance is holding. For now.</div>
          </div>
        ) : (
          open.map((p) => (
            <PressureCard key={p.id} pressure={p} capacity={available} onResolve={resolvePressure} />
          ))
        )}

        {/* Recently expired / resolved preview */}
        {pressures.filter((p) => p.status === "expired").length > 0 && (
          <div style={{ borderTop: "1px solid #0e0e0e", marginTop: "8px", paddingTop: "8px" }}>
            <div style={{ fontSize: "8px", color: "#484848", fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
              Expired (ignored)
            </div>
            {pressures
              .filter((p) => p.status === "expired")
              .slice(0, 3)
              .map((p) => (
                <div key={p.id} style={{ fontSize: "8px", color: "#3d3d3d", fontFamily: FONT, padding: "3px 0", borderBottom: "1px solid #0d0d0d" }}>
                  ✕ {p.title}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
