import { useState, useRef, useEffect } from "react";
import { useGameStore } from "../../state/store";
import { DatasetCatalogue } from "../catalogue/DatasetCatalogue";
import { TickButton } from "../controls/TickButton";
import { AnalystPanel } from "../analysts/AnalystPanel";
import { SiloPanel } from "../silos/SiloPanel";
import { GovernancePanel } from "../governance/GovernancePanel";
import { BottomFeed } from "../feed/BottomFeed";
import { EndScreen } from "../endgame/EndScreen";
import { ToastStack } from "../ui/ToastStack";
import { computeFinalScore } from "../../engine/scoringEngine";

// ── Shared visual tokens ─────────────────────────────────────────────────────

const FONT = "'Courier New', Courier, monospace";

const styles = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    background: "#0a0a0a",
    color: "#c0c0c0",
    fontFamily: FONT,
    fontSize: "13px",
    position: "relative" as const,
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "0 20px",
    height: "44px",
    background: "#070707",
    borderBottom: "1px solid #161616",
    flexShrink: 0,
  },
  title: {
    fontSize: "11px",
    fontWeight: "bold" as const,
    color: "#00ff88",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    flex: 1,
  },
  panels: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  leftPanel: {
    width: "280px",
    flexShrink: 0,
    borderRight: "1px solid #161616",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  centerPanel: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
    minWidth: 0,
  },
  rightPanel: {
    width: "264px",
    flexShrink: 0,
    borderLeft: "1px solid #161616",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  bottomZone: {
    height: "216px",
    flexShrink: 0,
    borderTop: "1px solid #161616",
    background: "#080808",
    overflow: "hidden",
  },
  bottomBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "8px 20px",
    background: "#070707",
    borderTop: "1px solid #161616",
    flexShrink: 0,
  },
  panelHeader: {
    fontSize: "9px",
    color: "#383838",
    textTransform: "uppercase" as const,
    letterSpacing: "0.14em",
    borderBottom: "1px solid #141414",
    padding: "7px 10px",
    flexShrink: 0,
  },
  divider: { borderTop: "1px solid #141414", flexShrink: 0 },
};

// ── Stat badge in top bar ────────────────────────────────────────────────────

function StatBadge({
  label, value, color, blink = false, animKey,
}: {
  label: string;
  value: string | number;
  color: string;
  blink?: boolean;
  animKey?: string | number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{
        fontSize: "8px",
        color: "#383838",
        textTransform: "uppercase" as const,
        letterSpacing: "0.12em",
      }}>
        {label}
      </span>
      <span
        key={animKey}
        className={[
          blink ? "anim-urgent-blink" : "",
          animKey !== undefined ? "anim-num-pop" : "",
        ].join(" ").trim()}
        style={{ fontSize: "16px", fontWeight: "bold", color, lineHeight: 1.2 }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Separator ────────────────────────────────────────────────────────────────

function Sep() {
  return (
    <div style={{ width: "1px", height: "24px", background: "#181818", flexShrink: 0 }} />
  );
}

// ── Main layout ──────────────────────────────────────────────────────────────

export function DashboardLayout() {
  const tick               = useGameStore((s) => s.tick);
  const trustScore         = useGameStore((s) => s.trustScore);
  const reputation         = useGameStore((s) => s.reputation);
  const silos              = useGameStore((s) => s.silos);
  const signals            = useGameStore((s) => s.signals);
  const catalogue          = useGameStore((s) => s.catalogue);
  const incidents          = useGameStore((s) => s.incidents);
  const executivePressures = useGameStore((s) => s.executivePressures);
  const datasets           = useGameStore((s) => s.datasets);
  const gamePhase          = useGameStore((s) => s.gamePhase);
  const endSession         = useGameStore((s) => s.endSession);

  // Live overall score
  const fullState  = useGameStore((s) => s);
  const liveScore  = computeFinalScore(fullState).overallScore;

  // Reputation trend — compare across renders
  const prevRepRef   = useRef<number>(reputation);
  const [repTrend, setRepTrend] = useState<"up" | "down" | "flat">("flat");
  useEffect(() => {
    if (reputation > prevRepRef.current) setRepTrend("up");
    else if (reputation < prevRepRef.current) setRepTrend("down");
    prevRepRef.current = reputation;
  }, [reputation]);

  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  // Derived counts
  const activeSiloCount   = silos.filter((s) => s.discovered && !s.contained).length;
  const unresolvedSignals = signals.filter((s) => !s.resolved).length;
  const ungoverned        = Object.values(catalogue).filter((e) => !e.ownerId).length;
  const activeIncidents   = incidents.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const activePressures   = executivePressures.filter((p) => p.status === "pending").length;
  const goldCount         = datasets.filter((d) => d.layer === "gold").length;

  const criticalIncident = incidents.some(
    (i) => (i.status === "open" || i.status === "in_progress") && i.severity === "critical"
  );
  const urgentPressure = executivePressures.some(
    (p) => p.status === "pending" && (p.urgency === "critical" || p.urgency === "high")
  );

  // Colour helpers
  const trustColor =
    trustScore > 40 ? "#00ff88" : trustScore > 10 ? "#ffa500" : "#ff4444";
  const repColor =
    Math.round(reputation) > 50 ? "#00bfff" :
    Math.round(reputation) > 25 ? "#ffa500" : "#ff4444";
  const scoreColor =
    liveScore >= 72 ? "#00ff88" : liveScore >= 50 ? "#ffa500" : "#ff4444";
  const repDisplay = `${Math.round(reputation)}${repTrend === "up" ? " ↑" : repTrend === "down" ? " ↓" : ""}`;

  // Very subtle screen glow when there are urgent executive demands
  const glowStyle = urgentPressure
    ? { boxShadow: "inset 0 0 80px rgba(255, 102, 0, 0.035)" }
    : {};

  return (
    <div style={{ ...styles.root, ...glowStyle }}>
      {gamePhase === "ended" && <EndScreen />}
      <ToastStack />

      {/* ── Top Bar ── */}
      <div style={styles.topBar}>
        <div style={styles.title}>⬡ Medallion Control Room</div>

        <StatBadge label="Score"      value={liveScore}              color={scoreColor} />
        <Sep />
        <StatBadge label="Tick"       value={tick}                   color="#666"      animKey={tick} />
        <StatBadge label="Trust"      value={trustScore}             color={trustColor} animKey={`t${tick}`} />
        <StatBadge label="Reputation" value={repDisplay}             color={repColor} />
        <Sep />
        <StatBadge label="Incidents"  value={activeIncidents}  color={activeIncidents  > 0 ? "#ff4444" : "#1e1e1e"} blink={criticalIncident} />
        <StatBadge label="Pressure"   value={activePressures}  color={activePressures  > 0 ? "#ff6600" : "#1e1e1e"} blink={urgentPressure} />
        <StatBadge label="Silos"      value={activeSiloCount}  color={activeSiloCount  > 0 ? "#ff4444" : "#1e1e1e"} />
        <StatBadge label="Signals"    value={unresolvedSignals} color={unresolvedSignals > 0 ? "#ffd700" : "#1e1e1e"} />
        <Sep />
        <StatBadge label="Ungoverned" value={ungoverned}  color={ungoverned > 3 ? "#ff4444" : ungoverned > 0 ? "#ffa500" : "#1e1e1e"} />
        <StatBadge label="Gold"       value={goldCount}   color={goldCount > 0 ? "#c8a800" : "#1e1e1e"} />
      </div>

      {/* ── Main panels ── */}
      <div style={styles.panels}>
        {/* Left: Catalogue */}
        <div style={styles.leftPanel}>
          <div style={styles.panelHeader}>Dataset Catalogue</div>
          <div style={{ flex: 1, overflow: "hidden", padding: "6px 8px" }}>
            <DatasetCatalogue selectedId={selectedDatasetId} onSelect={setSelectedDatasetId} />
          </div>
        </div>

        {/* Center: Silo Monitor */}
        <div style={styles.centerPanel}>
          <SiloPanel />
        </div>

        {/* Right: Monitoring + Dataset Inspector */}
        <div style={styles.rightPanel}>
          {/* Analyst monitoring */}
          <div style={styles.panelHeader}>
            📡 Analyst Monitoring
          </div>
          <div style={{ padding: "8px", flexShrink: 0 }}>
            <AnalystPanel />
          </div>

          <div style={styles.divider} />

          {/* Dataset inspector (governance + quality) */}
          <div style={{
            ...styles.panelHeader,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span>
              {selectedDatasetId ? "👥 Dataset Inspector" : "👥 Governance"}
            </span>
            {selectedDatasetId && (
              <button
                onClick={() => setSelectedDatasetId(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2a2a2a",
                  cursor: "pointer",
                  fontSize: "9px",
                  fontFamily: FONT,
                  padding: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            <GovernancePanel selectedDatasetId={selectedDatasetId} />
          </div>
        </div>
      </div>

      {/* ── Bottom feed (tabbed) ── */}
      <div style={styles.bottomZone}>
        <BottomFeed />
      </div>

      {/* ── Bottom bar ── */}
      <div style={styles.bottomBar}>
        <TickButton />
        <button
          onClick={endSession}
          style={{
            background: "transparent",
            border: "1px solid #1e1e1e",
            color: "#2a2a2a",
            fontFamily: FONT,
            fontSize: "10px",
            padding: "6px 16px",
            borderRadius: "2px",
            cursor: "pointer",
            letterSpacing: "0.07em",
            textTransform: "uppercase" as const,
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#555";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#333";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#2a2a2a";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e1e1e";
          }}
        >
          End Session
        </button>
      </div>
    </div>
  );
}
