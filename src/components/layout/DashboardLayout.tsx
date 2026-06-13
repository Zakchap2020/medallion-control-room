import { useGameStore } from "../../state/store";
import { DatasetCatalogue } from "../catalogue/DatasetCatalogue";
import { TickButton } from "../controls/TickButton";

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
    gap: "32px",
    padding: "10px 20px",
    background: "#0d0d0d",
    borderBottom: "1px solid #1e1e1e",
    flexShrink: 0,
  },
  title: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#00ff88",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
  stat: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center" as const,
  },
  statLabel: {
    fontSize: "9px",
    color: "#555",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#00ff88",
  },
  panels: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  leftPanel: {
    width: "320px",
    flexShrink: 0,
    borderRight: "1px solid #1e1e1e",
    padding: "12px",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  panelHeader: {
    fontSize: "10px",
    color: "#444",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    marginBottom: "10px",
    borderBottom: "1px solid #1a1a1a",
    paddingBottom: "6px",
  },
  centerPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2a2a2a",
    fontSize: "14px",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  },
  rightPanel: {
    width: "260px",
    flexShrink: 0,
    borderLeft: "1px solid #1e1e1e",
    padding: "12px",
  },
  bottomBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 20px",
    background: "#0d0d0d",
    borderTop: "1px solid #1e1e1e",
    flexShrink: 0,
  },
};

export function DashboardLayout() {
  const tick = useGameStore((s) => s.tick);
  const trustScore = useGameStore((s) => s.trustScore);

  return (
    <div style={styles.root}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.title}>Medallion Control Room</div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Tick</span>
          <span style={styles.statValue}>{tick}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statLabel}>Trust Score</span>
          <span style={{ ...styles.statValue, color: "#00bfff" }}>{trustScore}</span>
        </div>
      </div>

      {/* Main Panels */}
      <div style={styles.panels}>
        {/* Left: Dataset Catalogue */}
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>Dataset Catalogue</div>
          <DatasetCatalogue />
        </div>

        {/* Center: Active View */}
        <div style={styles.centerPanel}>
          Control Room Active View
        </div>

        {/* Right: Reserved */}
        <div style={styles.rightPanel}>
          <div style={styles.panelHeader}>Details</div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={styles.bottomBar}>
        <TickButton />
      </div>
    </div>
  );
}
