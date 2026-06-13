import { useGameStore } from "../../state/store";

interface PriorityItem {
  id: string;
  color: string;
  icon: string;
  label: string;
  detail: string;
  urgencyScore: number;
  actionLabel?: string;
  onAction?: () => void;
}

const FONT = "'Courier New', Courier, monospace";

export function PriorityQueue() {
  const incidents          = useGameStore((s) => s.incidents);
  const executivePressures = useGameStore((s) => s.executivePressures);
  const silos              = useGameStore((s) => s.silos);
  const resolveIncident    = useGameStore((s) => s.resolveIncident);
  const completeExecPress  = useGameStore((s) => s.completeExecutivePressure);
  const containSilo        = useGameStore((s) => s.containSilo);

  const items: PriorityItem[] = [];

  // ── Incidents ────────────────────────────────────────────────────────────────
  const TYPE_LABELS: Record<string, string> = {
    data_quality_failure:        "Data Quality Failure",
    kpi_mismatch:                "KPI Mismatch",
    silo_dependency_failure:     "Silo Dependency",
    governance_failure:          "Governance Failure",
    pipeline_break:              "Pipeline Break",
    data_breach:                 "Data Breach",
    unclassified_sensitive_data: "Unclassified Data",
    compliance_audit_failed:     "Audit Failed",
  };
  const SEV_COLORS: Record<string, string> = {
    critical: "#ff2222", high: "#ff6600", medium: "#ffd700", low: "#00ff88",
  };

  incidents
    .filter((i) => i.status === "open" || i.status === "in_progress")
    .forEach((inc) => {
      const color = SEV_COLORS[inc.severity] ?? "#ff4444";
      const baseScore =
        inc.severity === "critical" ? 90 :
        inc.severity === "high"     ? 70 :
        inc.severity === "medium"   ? 50 : 30;
      const ttrBonus = inc.timeToResolve <= 2 ? 10 : inc.timeToResolve <= 4 ? 5 : 0;
      items.push({
        id: inc.id,
        color,
        icon: "●",
        label: TYPE_LABELS[inc.type] ?? inc.type,
        detail: `T-${inc.timeToResolve}`,
        urgencyScore: baseScore + ttrBonus,
        actionLabel: "Resolve",
        onAction: () => resolveIncident(inc.id),
      });
    });

  // ── Executive pressures ───────────────────────────────────────────────────────
  const PRESS_LABELS: Record<string, string> = {
    board_request: "Board Request", finance_pressure: "Finance Pressure",
    compliance_audit: "Compliance Audit", ceo_escalation: "CEO Escalation",
    operational_review: "Ops Review",
  };
  const URGENCY_COLORS: Record<string, string> = {
    critical: "#ff2222", high: "#ff6600", medium: "#ffd700", low: "#00bfff",
  };

  executivePressures
    .filter((p) => p.status === "pending")
    .forEach((p) => {
      const color = URGENCY_COLORS[p.urgency] ?? "#ff6600";
      const baseScore =
        p.urgency === "critical" ? 88 :
        p.urgency === "high"     ? 68 :
        p.urgency === "medium"   ? 45 : 25;
      const tlBonus = p.timeLimit <= 2 ? 12 : p.timeLimit <= 4 ? 5 : 0;
      items.push({
        id: p.id,
        color,
        icon: "▲",
        label: PRESS_LABELS[p.type] ?? p.type,
        detail: `${p.timeLimit}T left`,
        urgencyScore: baseScore + tlBonus,
        actionLabel: "Deliver",
        onAction: () => completeExecPress(p.id),
      });
    });

  // ── Silos ────────────────────────────────────────────────────────────────────
  silos
    .filter((s) => s.discovered && !s.contained && s.riskLevel > 50)
    .forEach((s) => {
      const color = s.riskLevel > 75 ? "#ff2222" : "#ff6600";
      items.push({
        id: s.id,
        color,
        icon: "◈",
        label: s.name,
        detail: `${s.riskLevel}% risk`,
        urgencyScore: s.riskLevel > 75 ? 65 : 40,
        actionLabel: "Contain",
        onAction: () => containSilo(s.id),
      });
    });

  // Sort by urgency, take top 3
  const top = items.sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, 3);

  return (
    <div style={{
      borderBottom: "1px solid #141414",
      flexShrink: 0,
      background: "#070707",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 10px 4px",
        borderBottom: "1px solid #0e0e0e",
      }}>
        <span style={{
          fontSize: "8px",
          color: top.length > 0 ? "#4a2222" : "#1a2a1a",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontFamily: FONT,
        }}>
          {top.length > 0 ? `⚠ ${top.length} item${top.length > 1 ? "s" : ""} need attention` : "● All systems nominal"}
        </span>
        {top.length > 0 && (
          <span style={{ fontSize: "8px", color: "#2a2a2a", fontFamily: FONT }}>
            {items.length} total
          </span>
        )}
      </div>

      {/* Item rows */}
      {top.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 10px",
            borderLeft: `2px solid ${item.color}`,
            borderBottom: "1px solid #0d0d0d",
          }}
        >
          {/* Icon */}
          <span style={{ color: item.color, fontSize: "9px", flexShrink: 0 }}>
            {item.icon}
          </span>

          {/* Label */}
          <span style={{
            color: "#999",
            fontSize: "10px",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: FONT,
          }}>
            {item.label}
          </span>

          {/* Detail (time / risk) */}
          <span style={{
            color: item.urgencyScore >= 80 ? item.color : "#444",
            fontSize: "9px",
            fontFamily: FONT,
            flexShrink: 0,
            minWidth: "42px",
            textAlign: "right",
          }}
            className={item.urgencyScore >= 90 ? "anim-urgent-blink" : ""}
          >
            {item.detail}
          </span>

          {/* Action */}
          {item.actionLabel && item.onAction && (
            <button
              onClick={item.onAction}
              style={{
                background: "transparent",
                border: `1px solid ${item.color}55`,
                color: item.color,
                fontFamily: FONT,
                fontSize: "8px",
                padding: "2px 8px",
                borderRadius: "2px",
                cursor: "pointer",
                letterSpacing: "0.05em",
                flexShrink: 0,
              }}
            >
              {item.actionLabel}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
