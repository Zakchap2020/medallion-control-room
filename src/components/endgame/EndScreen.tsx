import { useGameStore } from "../../state/store";
import { computeFinalScore } from "../../engine/scoringEngine";
import { MATURITY_LABELS, MATURITY_COLORS } from "../../engine/maturityEngine";

const FONT = "'Courier New', Courier, monospace";

export function EndScreen() {
  const state     = useGameStore((s) => s);
  const resetGame = useGameStore((s) => s.resetGame);
  const result    = computeFinalScore(state);

  const mColor = MATURITY_COLORS[state.maturityStage];
  const eColor =
    result.endState === "data_driven"          ? "#00ff88"
    : result.endState === "over_governed"      ? "#ffd700"
    : result.endState === "technically_stable" ? "#00bfff"
    : result.endState === "politically_fractured" ? "#ff6600"
    : "#ff2222";

  const scoreColor = result.overallScore >= 70 ? "#00ff88" : result.overallScore >= 50 ? "#ffa500" : "#ff4444";
  const avgPatience = state.stakeholders.length > 0
    ? Math.round(state.stakeholders.reduce((s, k) => s + k.patience, 0) / state.stakeholders.length)
    : 0;
  const completedInits = state.initiatives.filter((i) => i.status === "completed").length;
  const resolved = state.pressures.filter((p) => p.status === "resolved").length;
  const expired  = state.pressures.filter((p) => p.status === "expired").length;

  const rows = [
    { label: "Trust score",            value: `${state.trustScore}`,   color: undefined,  sub: `${result.breakdown.trust} pts` },
    { label: "Maturity",               value: MATURITY_LABELS[state.maturityStage], color: mColor, sub: `${result.breakdown.maturity} pts` },
    { label: "Governance",             value: `—`,                     color: undefined,  sub: `${result.breakdown.governance} pts` },
    { label: "Pressures",              value: `${resolved}R / ${expired}X`, color: undefined, sub: `${result.breakdown.pressureHandling} pts` },
    { label: "Executive satisfaction", value: `${avgPatience}/100`,    color: undefined,  sub: `${result.breakdown.stakeholders} pts` },
    { label: "Initiatives",            value: `${completedInits}/8`,   color: undefined,  sub: `${result.breakdown.initiatives} pts` },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, zIndex: 100, overflowY: "auto" }}>
      <div style={{ maxWidth: "680px", width: "100%", padding: "40px 24px" }}>

        {/* Score */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "10px", color: "#585858", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>
            Medallion Protocol — Tick {state.tick}
          </div>
          <div style={{ fontSize: "72px", fontWeight: "bold", color: scoreColor, lineHeight: 1, marginBottom: "6px" }}>
            {result.overallScore}
          </div>
          <div style={{ fontSize: "10px", color: "#585858", marginBottom: "20px" }}>Overall Score</div>
          <div style={{ fontSize: "20px", color: eColor, letterSpacing: "0.06em", marginBottom: "10px" }}>
            {result.endStateLabel}
          </div>
          <div style={{ fontSize: "11px", color: "#909090", lineHeight: 1.6, maxWidth: "520px", margin: "0 auto" }}>
            {result.endStateDescription}
          </div>
        </div>

        {/* Verdict */}
        <div style={{ background: "#0a0a0a", border: `1px solid ${eColor}22`, borderLeft: `3px solid ${eColor}`, borderRadius: "3px", padding: "16px", marginBottom: "24px" }}>
          <div style={{ fontSize: "9px", color: "#585858", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>Verdict</div>
          <div style={{ fontSize: "10px", color: "#888", lineHeight: 1.7 }}>{result.verdict}</div>
        </div>

        {/* Breakdown */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "9px", color: "#585858", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Score Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
            {rows.map((r) => (
              <div key={r.label} style={{ background: "#0a0a0a", border: "1px solid #141414", borderRadius: "2px", padding: "10px" }}>
                <div style={{ fontSize: "8px", color: "#585858", marginBottom: "4px" }}>{r.label}</div>
                <div style={{ fontSize: "12px", color: r.color ?? "#c0c0c0" }}>{r.value}</div>
                <div style={{ fontSize: "7px", color: "#484848", marginTop: "2px" }}>{r.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stakeholder patience */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "9px", color: "#585858", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Executive Patience at Session End</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}>
            {state.stakeholders.map((s) => {
              const pColor = s.patience >= 60 ? "#00ff88" : s.patience >= 40 ? "#ffa500" : "#ff4444";
              return (
                <div key={s.id} style={{ background: "#0a0a0a", border: "1px solid #141414", borderRadius: "2px", padding: "7px 8px" }}>
                  <div style={{ fontSize: "8px", color: "#909090", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ fontSize: "7px", color: "#585858", marginBottom: "4px" }}>{s.role}</div>
                  <div style={{ height: "2px", background: "#0f0f0f", borderRadius: "1px" }}>
                    <div style={{ height: "100%", width: `${s.patience}%`, background: pColor, opacity: 0.7 }} />
                  </div>
                  <div style={{ fontSize: "9px", color: pColor, textAlign: "right", marginTop: "2px" }}>{Math.round(s.patience)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        <div style={{ textAlign: "center" }}>
          <button onClick={resetGame} style={{
            background: "#001a0d", border: "1px solid #00ff8844", color: "#00ff88",
            fontFamily: FONT, fontSize: "11px", padding: "10px 36px", borderRadius: "3px",
            cursor: "pointer", letterSpacing: "0.1em",
          }}>
            New Session
          </button>
        </div>
      </div>
    </div>
  );
}
