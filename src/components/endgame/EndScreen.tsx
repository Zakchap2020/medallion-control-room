import { useGameStore } from "../../state/store";
import { computeFinalScore, classifyEndgame, computeAchievements } from "../../engine/scoringEngine";
import type { EndgameArchetype, FinalScore, Achievement } from "../../models/types";

// ── Archetype metadata ────────────────────────────────────────────────────────

const ARCHETYPE_META: Record<
  EndgameArchetype,
  { label: string; color: string; description: string }
> = {
  mature_data_driven: {
    label: "Mature Data-Driven Organisation",
    color: "#00ff88",
    description:
      "Your data governance programme is thriving. Gold datasets flow consistently, executive demands are met, and stewardship structures hold.",
  },
  technically_stable_politically_fragile: {
    label: "Technically Stable, Politically Fragile",
    color: "#ffa500",
    description:
      "Data pipelines function well, but leadership confidence is low. Executive demands go unmet and trust in data leadership is eroding.",
  },
  operationally_chaotic: {
    label: "Operationally Chaotic But Functioning",
    color: "#ff9900",
    description:
      "Operations continue despite significant incidents and noise. Better incident management and governance would unlock stability.",
  },
  governance_failure: {
    label: "Governance Failure State",
    color: "#ff4444",
    description:
      "Critical governance gaps have left the organisation exposed. Data ownership is absent, silos multiply, and trust has collapsed.",
  },
  self_healing_illusion: {
    label: "Self-Healing Illusion",
    color: "#cc66ff",
    description:
      "Automation masks deep governance deficits. Systems appear healthy, but without proper stewardship the foundation is fragile and unsustainable.",
  },
};

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  const color =
    value >= 70 ? "#00ff88" :
    value >= 45 ? "#ffa500" : "#ff4444";

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
        <span style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
          <span style={{ color: "#333", marginLeft: "6px" }}>{weight}</span>
        </span>
        <span style={{ fontSize: "14px", fontWeight: "bold", color }}>{value}</span>
      </div>
      <div style={{ height: "4px", background: "#1a1a1a", borderRadius: "2px" }}>
        <div style={{
          height: "100%",
          width: `${value}%`,
          background: color,
          borderRadius: "2px",
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

// ── Achievement row ───────────────────────────────────────────────────────────

function AchievementRow({ a }: { a: Achievement }) {
  const isWarning = a.id === "silent_risk";
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
      padding: "5px 8px",
      background: a.unlocked ? (isWarning ? "#1a0a1a" : "#0a1a0a") : "#0d0d0d",
      border: `1px solid ${a.unlocked ? (isWarning ? "#6622aa" : "#1e3a1e") : "#111"}`,
      borderRadius: "3px",
      marginBottom: "4px",
    }}>
      <span style={{
        color: a.unlocked ? (isWarning ? "#cc66ff" : "#00ff88") : "#222",
        fontSize: "12px",
        flexShrink: 0,
        marginTop: "1px",
      }}>
        {a.unlocked ? (isWarning ? "⚠" : "✓") : "○"}
      </span>
      <div>
        <div style={{ fontSize: "11px", color: a.unlocked ? "#c0c0c0" : "#333" }}>
          {a.label}
        </div>
        {a.unlocked && (
          <div style={{ fontSize: "9px", color: isWarning ? "#8844aa" : "#2a5a2a", marginTop: "1px" }}>
            {a.description}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat grid cell ────────────────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: "#0d0d0d",
      border: "1px solid #1a1a1a",
      borderRadius: "3px",
      padding: "7px 10px",
    }}>
      <div style={{ fontSize: "8px", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>
        {label}
      </div>
      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#c0c0c0", fontFamily: "monospace" }}>
        {value}
      </div>
    </div>
  );
}

// ── Overall score ring ────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: FinalScore }) {
  const color =
    score.overallScore >= 72 ? "#00ff88" :
    score.overallScore >= 50 ? "#ffa500" : "#ff4444";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2px",
    }}>
      <div style={{
        width: "90px",
        height: "90px",
        borderRadius: "50%",
        border: `4px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 20px ${color}44`,
      }}>
        <span style={{ fontSize: "28px", fontWeight: "bold", color, fontFamily: "monospace" }}>
          {score.overallScore}
        </span>
        <span style={{ fontSize: "8px", color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Overall
        </span>
      </div>
    </div>
  );
}

// ── Main EndScreen ────────────────────────────────────────────────────────────

export function EndScreen() {
  const state           = useGameStore((s) => s);
  const continueSession = useGameStore((s) => s.continueSession);
  const resetGame       = useGameStore((s) => s.resetGame);

  const score       = computeFinalScore(state);
  const archetype   = classifyEndgame(state, score);
  const achievements = computeAchievements(state);
  const meta        = ARCHETYPE_META[archetype];

  const totalInc    = state.incidents.length;
  const failedInc   = state.incidents.filter((i) => i.status === "failed").length;
  const discovered  = state.silos.filter((s) => s.discovered).length;
  const contained   = state.silos.filter((s) => s.contained).length;
  const completed   = state.executivePressures.filter((p) => p.status === "completed").length;
  const totalPress  = state.executivePressures.length;
  const goldCount   = state.datasets.filter((d) => d.layer === "gold").length;
  const unlockedAch = achievements.filter((a) => a.unlocked).length;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.88)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      fontFamily: "'Courier New', Courier, monospace",
      backdropFilter: "blur(2px)",
    }}>
      <div style={{
        background: "#080808",
        border: "1px solid #1e1e1e",
        borderRadius: "4px",
        width: "680px",
        maxHeight: "90vh",
        overflowY: "auto",
        color: "#c0c0c0",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px 14px",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: "9px", color: "#333", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "3px" }}>
              Medallion Protocol — Assessment Report
            </div>
            <div style={{ fontSize: "13px", color: "#555", letterSpacing: "0.04em" }}>
              Tick {state.tick} &nbsp;|&nbsp; Peak Trust {state.peakTrustScore}
            </div>
          </div>
          <ScoreRing score={score} />
        </div>

        {/* Archetype classification */}
        <div style={{
          padding: "14px 24px",
          borderBottom: "1px solid #111",
          background: "#0a0a0a",
        }}>
          <div style={{ fontSize: "9px", color: "#333", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "5px" }}>
            Organisation Classification
          </div>
          <div style={{ fontSize: "15px", fontWeight: "bold", color: meta.color, marginBottom: "6px" }}>
            {meta.label}
          </div>
          <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.6" }}>
            {meta.description}
          </div>
        </div>

        {/* Score breakdown + session stats */}
        <div style={{ padding: "14px 24px", display: "flex", gap: "24px", borderBottom: "1px solid #111" }}>
          {/* Score bars */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "9px", color: "#333", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
              Score Breakdown
            </div>
            <ScoreBar label="Data Trust"             value={score.dataTrustScore}             weight="30%" />
            <ScoreBar label="Governance Maturity"    value={score.governanceMaturityScore}    weight="30%" />
            <ScoreBar label="Operational Stability"  value={score.operationalStabilityScore}  weight="25%" />
            <ScoreBar label="Executive Satisfaction" value={score.executiveSatisfactionScore} weight="15%" />
          </div>

          {/* Session stats */}
          <div style={{ width: "200px", flexShrink: 0 }}>
            <div style={{ fontSize: "9px", color: "#333", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
              Session Statistics
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <StatCell label="Ticks"        value={state.tick} />
              <StatCell label="Gold Datasets" value={goldCount} />
              <StatCell label="Incidents"    value={`${totalInc - failedInc}/${totalInc}`} />
              <StatCell label="Silos"        value={`${contained}/${discovered}`} />
              <StatCell label="Exec Fulfilled" value={`${completed}/${totalPress}`} />
              <StatCell label="Peak Trust"   value={state.peakTrustScore} />
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #111" }}>
          <div style={{ fontSize: "9px", color: "#333", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>
            Achievements &nbsp;
            <span style={{ color: "#1e3a1e" }}>
              {unlockedAch}/{achievements.length} unlocked
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
            {achievements.map((a) => (
              <AchievementRow key={a.id} a={a} />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{
          padding: "14px 24px",
          display: "flex",
          gap: "10px",
          justifyContent: "flex-end",
        }}>
          <button
            onClick={continueSession}
            style={{
              background: "transparent",
              border: "1px solid #1e1e1e",
              color: "#444",
              fontFamily: "inherit",
              fontSize: "11px",
              padding: "7px 18px",
              borderRadius: "2px",
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            Continue Monitoring
          </button>
          <button
            onClick={resetGame}
            style={{
              background: "#0a1a0a",
              border: "1px solid #00ff8866",
              color: "#00ff88",
              fontFamily: "inherit",
              fontSize: "11px",
              padding: "7px 18px",
              borderRadius: "2px",
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
