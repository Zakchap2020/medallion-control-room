import { useState } from "react";
import { useGameStore } from "../../state/store";
import { DatasetCatalogue } from "../catalogue/DatasetCatalogue";
import { TickButton } from "../controls/TickButton";
import { AnalystPanel } from "../analysts/AnalystPanel";
import { SiloPanel } from "../silos/SiloPanel";
import { SignalFeed } from "../signals/SignalFeed";
import { GovernancePanel } from "../governance/GovernancePanel";
import { IncidentPanel } from "../incidents/IncidentPanel";
import { ExecutivePressurePanel } from "../executive/ExecutivePressurePanel";

const styles = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    background: "#0a0a0a",
    color: "#c0c0c0",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "13px",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    padding: "8px 20px",
    background: "#0d0d0d",
    borderBottom: "1px solid #1e1e1e",
    flexShrink: 0,
  },
  title: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#00ff88",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    flex: 1,
  },
  stat: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center" as const,
  },
  statLabel: {
    fontSize: "8px",
    color: "#555",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
  statValue: {
    fontSize: "17px",
    fontWeight: "bold",
  },
  panels: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  leftPanel: {
    width: "290px",
    flexShrink: 0,
    borderRight: "1px solid #1e1e1e",
    padding: "10px",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  panelHeader: {
    fontSize: "9px",
    color: "#444",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    marginBottom: "7px",
    borderBottom: "1px solid #1a1a1a",
    paddingBottom: "5px",
    flexShrink: 0,
  },
  centerPanel: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
    minWidth: 0,
  },
  rightPanel: {
    width: "260px",
    flexShrink: 0,
    borderLeft: "1px solid #1e1e1e",
    padding: "10px",
    display: "flex",
    flexDirection: "column" as const,
    overflowY: "auto" as const,
  },
  divider: {
    borderTop: "1px solid #1a1a1a",
    margin: "10px 0",
    flexShrink: 0,
  },
  bottomZone: {
    height: "200px",
    flexShrink: 0,
    borderTop: "1px solid #1e1e1e",
    display: "flex",
    background: "#080808",
  },
  bottomBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 20px",
    background: "#0d0d0d",
    borderTop: "1px solid #1e1e1e",
    flexShrink: 0,
  },
};

function StatBadge({
  label, value, color,
}: {
  label: string; value: number | string; color: string;
}) {
  return (
    <div style={styles.stat}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color }}>{value}</span>
    </div>
  );
}

export function DashboardLayout() {
  const tick               = useGameStore((s) => s.tick);
  const trustScore         = useGameStore((s) => s.trustScore);
  const reputation         = useGameStore((s) => s.reputation);
  const silos              = useGameStore((s) => s.silos);
  const signals            = useGameStore((s) => s.signals);
  const catalogue          = useGameStore((s) => s.catalogue);
  const incidents          = useGameStore((s) => s.incidents);
  const executivePressures = useGameStore((s) => s.executivePressures);

  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  const activeSiloCount    = silos.filter((s) => s.discovered && !s.contained).length;
  const unresolvedSignals  = signals.filter((s) => !s.resolved).length;
  const ungoverned         = Object.values(catalogue).filter((e) => !e.ownerId).length;
  const activeIncidents    = incidents.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const activePressures    = executivePressures.filter((p) => p.status === "pending").length;

  const trustColor =
    trustScore > 40 ? "#00ff88" :
    trustScore > 15 ? "#ffa500" : "#ff4444";

  const repColor =
    Math.round(reputation) > 40 ? "#00bfff" :
    Math.round(reputation) > 15 ? "#ffa500" : "#ff4444";

  return (
    <div style={styles.root}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.title}>Medallion Control Room</div>
        <StatBadge label="Tick"        value={tick}                   color="#c0c0c0" />
        <StatBadge label="Trust"       value={trustScore}             color={trustColor} />
        <StatBadge label="Reputation"  value={Math.round(reputation)} color={repColor} />
        <StatBadge label="Incidents"   value={activeIncidents}   color={activeIncidents   > 0 ? "#ff4444" : "#2a2a2a"} />
        <StatBadge label="Pressure"    value={activePressures}   color={activePressures   > 0 ? "#ff6600" : "#2a2a2a"} />
        <StatBadge label="Silos"       value={activeSiloCount}   color={activeSiloCount   > 0 ? "#ff4444" : "#2a2a2a"} />
        <StatBadge label="Signals"     value={unresolvedSignals} color={unresolvedSignals > 0 ? "#ffa500" : "#2a2a2a"} />
        <StatBadge label="Ungoverned"  value={ungoverned}        color={ungoverned > 3 ? "#ff4444" : ungoverned > 0 ? "#ffa500" : "#2a2a2a"} />
      </div>

      {/* Main Panels */}
      <div style={styles.panels}>
        {/* Left: Dataset Catalogue */}
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>Dataset Catalogue</div>
          <DatasetCatalogue selectedId={selectedDatasetId} onSelect={setSelectedDatasetId} />
        </div>

        {/* Center: Silo Monitor + Executive Pressure */}
        <div style={styles.centerPanel}>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <SiloPanel />
          </div>
          <div style={{
            height: "190px",
            flexShrink: 0,
            borderTop: "1px solid #1e1e1e",
            padding: "10px 12px",
            background: "#090909",
          }}>
            <ExecutivePressurePanel />
          </div>
        </div>

        {/* Right: Analysts + Governance */}
        <div style={styles.rightPanel}>
          <div style={styles.panelHeader}>Analyst Control</div>
          <AnalystPanel />
          <div style={styles.divider} />
          <div style={{ ...styles.panelHeader, marginBottom: "8px" }}>
            Governance
            {selectedDatasetId && (
              <button
                onClick={() => setSelectedDatasetId(null)}
                style={{
                  float: "right",
                  background: "none",
                  border: "none",
                  color: "#444",
                  cursor: "pointer",
                  fontSize: "9px",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                ✕ clear
              </button>
            )}
          </div>
          <GovernancePanel selectedDatasetId={selectedDatasetId} />
        </div>
      </div>

      {/* Bottom Zone: Signal Feed | Incident Panel */}
      <div style={styles.bottomZone}>
        <div style={{ flex: 3, padding: "10px 14px", borderRight: "1px solid #1e1e1e" }}>
          <SignalFeed />
        </div>
        <div style={{ flex: 2, padding: "10px 14px" }}>
          <IncidentPanel />
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={styles.bottomBar}>
        <TickButton />
      </div>
    </div>
  );
}
