import { useState, useRef, useEffect, useCallback } from "react";
import { useGameStore } from "../../state/store";
import { DatasetCatalogue } from "../catalogue/DatasetCatalogue";
import { DomainView } from "../domain/DomainView";
import { PressureQueue } from "../pressure/PressureQueue";
import { GovernancePanel } from "../governance/GovernancePanel";
import { InitiativesPanel } from "../initiatives/InitiativesPanel";
import { StoryFeed } from "../story/StoryFeed";
import { EndScreen } from "../endgame/EndScreen";
import { ToastStack } from "../ui/ToastStack";
import { setMuted, getMuted } from "../../engine/soundEngine";
import { MATURITY_LABELS, MATURITY_COLORS } from "../../engine/maturityEngine";
import { computeFinalScore } from "../../engine/scoringEngine";

const FONT = "'Courier New', Courier, monospace";

const styles = {
  root: { display: "flex", flexDirection: "column" as const, height: "100vh", background: "#0a0a0a", color: "#c0c0c0", fontFamily: FONT, fontSize: "13px", position: "relative" as const },
  topBar: { display: "flex", alignItems: "center", gap: "18px", padding: "0 18px", height: "44px", background: "#070707", borderBottom: "1px solid #161616", flexShrink: 0 },
  panels: { display: "flex", flex: 1, overflow: "hidden" },
  leftPanel: { width: "264px", flexShrink: 0, borderRight: "1px solid #161616", display: "flex", flexDirection: "column" as const, overflow: "hidden" },
  centreLeft: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" as const, minWidth: 0, borderRight: "1px solid #161616" },
  centreRight: { width: "280px", flexShrink: 0, borderRight: "1px solid #161616", display: "flex", flexDirection: "column" as const, overflow: "hidden" },
  rightPanel: { width: "260px", flexShrink: 0, display: "flex", flexDirection: "column" as const, overflow: "hidden" },
  bottomZone: { height: "176px", flexShrink: 0, borderTop: "1px solid #161616", background: "#080808", overflow: "hidden" },
  bottomBar: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 18px", background: "#070707", borderTop: "1px solid #161616", flexShrink: 0 },
  panelHeader: { fontSize: "9px", color: "#6e6e6e", textTransform: "uppercase" as const, letterSpacing: "0.14em", borderBottom: "1px solid #141414", padding: "7px 10px", flexShrink: 0 },
};

function StatBadge({ label, value, color, animKey }: { label: string; value: string | number; color: string; animKey?: string | number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontSize: "8px", color: "#6e6e6e", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      <span key={animKey} className={animKey !== undefined ? "anim-num-pop" : ""} style={{ fontSize: "16px", fontWeight: "bold", color, lineHeight: 1.2 }}>{value}</span>
    </div>
  );
}

function Sep() {
  return <div style={{ width: "1px", height: "24px", background: "#181818", flexShrink: 0 }} />;
}

export function DashboardLayout() {
  const tick               = useGameStore((s) => s.tick);
  const trustScore         = useGameStore((s) => s.trustScore);
  const maturityStage      = useGameStore((s) => s.maturityStage);
  const executiveSatis     = useGameStore((s) => s.executiveSatisfaction);
  const cycleCapacity      = useGameStore((s) => s.cycleCapacity);
  const gamePhase          = useGameStore((s) => s.gamePhase);
  const pressures          = useGameStore((s) => s.pressures);
  const fullState          = useGameStore((s) => s);
  const storeRunTick       = useGameStore((s) => s.runTick);
  const endSession         = useGameStore((s) => s.endSession);

  const liveScore      = computeFinalScore(fullState).overallScore;
  const mColor         = MATURITY_COLORS[maturityStage];
  const mLabel         = MATURITY_LABELS[maturityStage];
  const openPressures  = pressures.filter((p) => p.status === "open").length;
  const available      = cycleCapacity.total - cycleCapacity.used;
  const trustColor     = trustScore > 50 ? "#00ff88" : trustScore > 25 ? "#ffa500" : "#ff4444";
  const scoreColor     = liveScore >= 70 ? "#00ff88" : liveScore >= 50 ? "#ffa500" : "#ff4444";
  const capColor       = available > 0 ? "#c0c0c0" : "#ff4444";

  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);
  const [sfxOff, setSfxOff] = useState(getMuted());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const SPEED_MS: Record<number, number> = { 1: 2200, 2: 1200, 3: 600 };

  const runTick = useCallback(() => { storeRunTick(); }, [storeRunTick]);

  useEffect(() => {
    if (!isRunning || gamePhase === "ended") return;
    const id = setInterval(runTick, SPEED_MS[speed]);
    return () => clearInterval(id);
  }, [isRunning, speed, gamePhase, runTick]);

  useEffect(() => { if (gamePhase === "ended") setIsRunning(false); }, [gamePhase]);

  const prevPressureCount = useRef(0);
  useEffect(() => {
    const open = pressures.filter((p) => p.status === "open").length;
    prevPressureCount.current = open;
  }, [pressures]);

  return (
    <div style={styles.root}>
      {gamePhase === "ended" && <EndScreen />}
      <ToastStack />

      {/* ── Top bar ── */}
      <div style={styles.topBar}>
        <div style={{ fontSize: "11px", fontWeight: "bold", color: "#00ff88", letterSpacing: "0.1em", textTransform: "uppercase", flex: 1 }}>
          ⬡ Medallion Protocol
        </div>
        <StatBadge label="Score"    value={liveScore}      color={scoreColor} />
        <Sep />
        <StatBadge label="Tick"     value={tick}           color="#555" animKey={tick} />
        <StatBadge label="Trust"    value={trustScore}     color={trustColor} animKey={`t${tick}`} />
        <StatBadge label="Maturity" value={mLabel}         color={mColor} />
        <Sep />
        <StatBadge label="Exec Sat" value={executiveSatis} color={executiveSatis > 60 ? "#00ff88" : executiveSatis > 40 ? "#ffa500" : "#ff4444"} />
        <StatBadge label="Pressures" value={openPressures} color={openPressures > 0 ? "#ff4444" : "#1e1e1e"} />
        <Sep />
        <StatBadge label="Capacity" value={`${available}/${cycleCapacity.total}`} color={capColor} />
      </div>

      {/* ── Main panels ── */}
      <div style={styles.panels}>

        {/* Left: Domain overview + Catalogue */}
        <div style={styles.leftPanel}>
          <div style={{ flex: "0 0 auto", maxHeight: "55%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <DomainView selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div style={{ flex: 1, overflow: "hidden", borderTop: "1px solid #141414", display: "flex", flexDirection: "column" }}>
            <div style={styles.panelHeader}>Dataset Catalogue</div>
            <div style={{ flex: 1, overflow: "hidden", padding: "6px 8px" }}>
              <DatasetCatalogue selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </div>
        </div>

        {/* Centre-left: Pressure queue */}
        <div style={styles.centreLeft}>
          <PressureQueue />
        </div>

        {/* Centre-right: Initiatives */}
        <div style={styles.centreRight}>
          <InitiativesPanel />
        </div>

        {/* Right: Dataset inspector + governance */}
        <div style={styles.rightPanel}>
          <div style={{ ...styles.panelHeader, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{selectedId ? "Dataset Inspector" : "Governance"}</span>
            {selectedId && (
              <button onClick={() => setSelectedId(null)} style={{ background: "none", border: "none", color: "#585858", cursor: "pointer", fontSize: "9px", fontFamily: FONT }}>
                ✕
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <GovernancePanel selectedId={selectedId} />
          </div>
        </div>
      </div>

      {/* ── Bottom: Story feed ── */}
      <div style={styles.bottomZone}>
        <StoryFeed />
      </div>

      {/* ── Bottom bar: controls ── */}
      <div style={styles.bottomBar}>
        <button
          onClick={() => setIsRunning((r) => !r)}
          style={{
            background: isRunning ? "#1a0808" : "#001a0d",
            border: `1px solid ${isRunning ? "#ff444455" : "#00ff8855"}`,
            color: isRunning ? "#ff4444" : "#00ff88",
            fontFamily: FONT, fontSize: "13px", fontWeight: "bold",
            padding: "6px 22px", borderRadius: "3px", cursor: "pointer",
            letterSpacing: "0.07em", minWidth: "110px",
          }}
        >
          {isRunning ? "⏸ PAUSE" : "▶ PLAY"}
        </button>

        <div style={{ display: "flex", gap: "2px" }}>
          {([1, 2, 3] as const).map((s) => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              background: speed === s ? "#1a1a0a" : "transparent",
              border: `1px solid ${speed === s ? "#ffd70055" : "#1e1e1e"}`,
              color: speed === s ? "#ffd700" : "#2a2a2a",
              fontFamily: FONT, fontSize: "10px", padding: "5px 10px", borderRadius: "2px", cursor: "pointer",
            }}>{s}×</button>
          ))}
        </div>

        {!isRunning && (
          <button onClick={runTick} style={{
            background: "transparent", border: "1px solid #1e1e1e", color: "#333",
            fontFamily: FONT, fontSize: "10px", padding: "5px 14px", borderRadius: "2px", cursor: "pointer",
          }}>
            +1 Tick
          </button>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: "10px", color: scoreColor, fontFamily: FONT, letterSpacing: "0.06em" }}>Score {liveScore}</span>

        <button
          onClick={() => { const n = !sfxOff; setSfxOff(n); setMuted(n); }}
          style={{
            background: "transparent", border: "1px solid #1a1a1a",
            color: sfxOff ? "#1e1e1e" : "#2a2a2a",
            fontFamily: FONT, fontSize: "10px", padding: "5px 12px", borderRadius: "2px", cursor: "pointer",
          }}
        >
          {sfxOff ? "SFX OFF" : "SFX ON"}
        </button>

        <button
          onClick={endSession}
          style={{
            background: "transparent", border: "1px solid #1a1a1a", color: "#222",
            fontFamily: FONT, fontSize: "10px", padding: "5px 14px", borderRadius: "2px",
            cursor: "pointer", textTransform: "uppercase",
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
