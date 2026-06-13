import { useState, useRef, useEffect, useCallback } from "react";
import { useGameStore } from "../../state/store";
import { DatasetCatalogue } from "../catalogue/DatasetCatalogue";
import { AnalystPanel } from "../analysts/AnalystPanel";
import { SiloPanel } from "../silos/SiloPanel";
import { GovernancePanel } from "../governance/GovernancePanel";
import { BottomFeed } from "../feed/BottomFeed";
import { EndScreen } from "../endgame/EndScreen";
import { ToastStack, showToast } from "../ui/ToastStack";
import { PriorityQueue } from "../ui/PriorityQueue";
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
  const incidents          = useGameStore((s) => s.incidents);
  const executivePressures = useGameStore((s) => s.executivePressures);
  const gamePhase          = useGameStore((s) => s.gamePhase);
  const characterEvents    = useGameStore((s) => s.characterEvents);
  const endSession         = useGameStore((s) => s.endSession);
  const storeRunTick       = useGameStore((s) => s.runTick);

  // Live overall score
  const fullState  = useGameStore((s) => s);
  const liveScore  = computeFinalScore(fullState).overallScore;

  // ── Real-time game loop ─────────────────────────────────────────────────────
  const [isRunning, setIsRunning]   = useState(false);
  const [speed, setSpeed]           = useState<1 | 2 | 3>(1);
  const SPEED_MS: Record<number, number> = { 1: 2200, 2: 1200, 3: 600 };

  const runTick = useCallback(() => {
    storeRunTick();
  }, [storeRunTick]);

  useEffect(() => {
    if (!isRunning || gamePhase === "ended") return;
    const id = setInterval(runTick, SPEED_MS[speed]);
    return () => clearInterval(id);
  }, [isRunning, speed, gamePhase, runTick]);

  // Auto-pause on game end
  useEffect(() => {
    if (gamePhase === "ended") setIsRunning(false);
  }, [gamePhase]);

  // ── Character event toasts ──────────────────────────────────────────────────
  const prevEventRef = useRef<string>("");
  useEffect(() => {
    const latest = characterEvents[0];
    if (latest && latest !== prevEventRef.current) {
      prevEventRef.current = latest;
      showToast(latest, "info");
    }
  }, [characterEvents]);

  // Reputation trend — compare across renders
  const prevRepRef   = useRef<number>(reputation);
  const [repTrend, setRepTrend] = useState<"up" | "down" | "flat">("flat");
  useEffect(() => {
    if (reputation > prevRepRef.current) setRepTrend("up");
    else if (reputation < prevRepRef.current) setRepTrend("down");
    prevRepRef.current = reputation;
  }, [reputation]);

  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  // Derived counts (only what the top bar still needs)
  const activeIncidents = incidents.filter((i) => i.status === "open" || i.status === "in_progress").length;
  const activePressures = executivePressures.filter((p) => p.status === "pending").length;

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
        <StatBadge label="Score"      value={liveScore}    color={scoreColor} />
        <Sep />
        <StatBadge label="Tick"       value={tick}         color="#555"      animKey={tick} />
        <StatBadge label="Trust"      value={trustScore}   color={trustColor} animKey={`t${tick}`} />
        <StatBadge label="Reputation" value={repDisplay}   color={repColor} />
        <Sep />
        <StatBadge label="Incidents"  value={activeIncidents} color={activeIncidents > 0 ? "#ff4444" : "#1e1e1e"} blink={criticalIncident} />
        <StatBadge label="Pressure"   value={activePressures} color={activePressures > 0 ? "#ff6600" : "#1e1e1e"} blink={urgentPressure} />
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

        {/* Center: Priority triage + Silo Monitor */}
        <div style={styles.centerPanel}>
          <PriorityQueue />
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

      {/* ── Bottom bar: game controls ── */}
      <div style={styles.bottomBar}>
        {/* Play / Pause */}
        <button
          onClick={() => setIsRunning((r) => !r)}
          className={isRunning ? "" : ""}
          style={{
            background: isRunning ? "#1a0808" : "#001a0d",
            border: `1px solid ${isRunning ? "#ff444455" : "#00ff8855"}`,
            color: isRunning ? "#ff4444" : "#00ff88",
            fontFamily: FONT,
            fontSize: "13px",
            fontWeight: "bold",
            padding: "6px 22px",
            borderRadius: "3px",
            cursor: "pointer",
            letterSpacing: "0.07em",
            minWidth: "110px",
          }}
        >
          {isRunning ? "⏸ PAUSE" : "▶ PLAY"}
        </button>

        {/* Speed selector */}
        <div style={{ display: "flex", gap: "2px" }}>
          {([1, 2, 3] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                background: speed === s ? "#1a1a0a" : "transparent",
                border: `1px solid ${speed === s ? "#ffd70055" : "#1e1e1e"}`,
                color: speed === s ? "#ffd700" : "#2a2a2a",
                fontFamily: FONT,
                fontSize: "10px",
                padding: "5px 10px",
                borderRadius: "2px",
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Manual step when paused */}
        {!isRunning && (
          <button
            onClick={runTick}
            style={{
              background: "transparent",
              border: "1px solid #2a2a2a",
              color: "#444",
              fontFamily: FONT,
              fontSize: "10px",
              padding: "5px 14px",
              borderRadius: "2px",
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}
          >
            +1 Tick
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Live score */}
        <span style={{ fontSize: "10px", color: scoreColor, fontFamily: FONT, letterSpacing: "0.06em" }}>
          Score {liveScore}
        </span>

        {/* End session */}
        <button
          onClick={endSession}
          style={{
            background: "transparent",
            border: "1px solid #1a1a1a",
            color: "#222",
            fontFamily: FONT,
            fontSize: "10px",
            padding: "5px 14px",
            borderRadius: "2px",
            cursor: "pointer",
            letterSpacing: "0.07em",
            textTransform: "uppercase" as const,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#444"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#222"; }}
        >
          End Session
        </button>
      </div>
    </div>
  );
}
