import { useState } from "react";
import { useGameStore } from "../../state/store";
import { IncidentPanel } from "../incidents/IncidentPanel";
import { SignalFeed } from "../signals/SignalFeed";
import { ExecutivePressurePanel } from "../executive/ExecutivePressurePanel";
import { PipelineActivity } from "../pipeline/PipelineActivity";

type Tab = "incidents" | "signals" | "executive" | "pipeline";

interface TabDef {
  id: Tab;
  label: string;
  icon: string;
  count?: number;
  urgentColor?: string;
}

export function BottomFeed() {
  const [active, setActive] = useState<Tab>("incidents");

  const incidents  = useGameStore((s) => s.incidents);
  const signals    = useGameStore((s) => s.signals);
  const pressures  = useGameStore((s) => s.executivePressures);

  const activeInc   = incidents.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const unresSig    = signals.filter((s) => !s.resolved).length;
  const activePress = pressures.filter((p) => p.status === "pending").length;

  const critInc   = incidents.some((i) => (i.status === "open" || i.status === "in_progress") && i.severity === "critical");
  const urgPress  = pressures.some((p) => p.status === "pending" && (p.urgency === "critical" || p.urgency === "high"));

  const tabs: TabDef[] = [
    {
      id: "incidents",
      icon: "●",
      label: "Incidents",
      count: activeInc,
      urgentColor: critInc ? "#ff4444" : activeInc > 0 ? "#ff6600" : undefined,
    },
    {
      id: "signals",
      icon: "◆",
      label: "Signals",
      count: unresSig,
      urgentColor: unresSig > 3 ? "#ffd700" : unresSig > 0 ? "#ffa50088" : undefined,
    },
    {
      id: "executive",
      icon: "▲",
      label: "Executive",
      count: activePress,
      urgentColor: urgPress ? "#ff6600" : activePress > 0 ? "#ff660055" : undefined,
    },
    {
      id: "pipeline",
      icon: "↺",
      label: "Pipeline",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Tab strip */}
      <div style={{
        display: "flex",
        alignItems: "stretch",
        borderBottom: "1px solid #1a1a1a",
        background: "#070707",
        flexShrink: 0,
        height: "34px",
      }}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const hasUrgent = !!tab.urgentColor;
          const uc = tab.urgentColor ?? "#444";

          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={hasUrgent && !isActive ? "anim-urgent-blink" : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "transparent",
                border: "none",
                borderBottom: isActive
                  ? `2px solid ${hasUrgent ? uc : "#555"}`
                  : "2px solid transparent",
                color: isActive
                  ? (hasUrgent ? uc : "#c0c0c0")
                  : (hasUrgent ? uc : "#333"),
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "10px",
                padding: "0 14px",
                cursor: "pointer",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                transition: "color 0.12s, border-color 0.12s",
              }}
            >
              <span style={{ fontSize: "7px" }}>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  background: hasUrgent ? uc : "#1e1e1e",
                  color: hasUrgent ? "#000" : "#666",
                  borderRadius: "8px",
                  fontSize: "9px",
                  fontWeight: "bold",
                  padding: "0px 5px",
                  lineHeight: "14px",
                  minWidth: "16px",
                  textAlign: "center",
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content pane */}
      <div style={{ flex: 1, overflow: "hidden", padding: "8px 12px" }}>
        {active === "incidents"  && <IncidentPanel />}
        {active === "signals"    && <SignalFeed />}
        {active === "executive"  && <ExecutivePressurePanel />}
        {active === "pipeline"   && <PipelineActivity />}
      </div>
    </div>
  );
}
