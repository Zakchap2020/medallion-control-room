import { useGameStore } from "../../state/store";
import { INITIATIVE_DEFINITIONS } from "../../data/initiatives";

const FONT = "'Courier New', Courier, monospace";

export function InitiativesPanel() {
  const initiatives     = useGameStore((s) => s.initiatives);
  const cycleCapacity   = useGameStore((s) => s.cycleCapacity);
  const launchInitiative = useGameStore((s) => s.launchInitiative);

  const available = cycleCapacity.total - cycleCapacity.used;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ fontSize: "9px", color: "#6e6e6e", textTransform: "uppercase", letterSpacing: "0.14em", padding: "7px 10px", borderBottom: "1px solid #141414", flexShrink: 0 }}>
        Strategic Initiatives
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {INITIATIVE_DEFINITIONS.map((def) => {
          const active    = initiatives.find((i) => i.key === def.key && i.status === "active");
          const completed = initiatives.some((i) => i.key === def.key && i.status === "completed");
          const prereqMet = !def.prerequisites || def.prerequisites.every(
            (pk) => initiatives.some((i) => i.key === pk && i.status === "completed")
          );
          const canLaunch = !active && !completed && prereqMet && available >= def.launchCost;

          const statusColor = completed ? "#00ff88" : active ? "#ffd700" : prereqMet ? "#7a7a7a" : "#484848";
          const bgColor     = completed ? "#001a0d" : active ? "#1a1400" : "#0a0a0a";
          const borderColor = completed ? "#00ff8833" : active ? "#ffd70033" : "#141414";

          return (
            <div key={def.key} style={{
              background:   bgColor,
              border:       `1px solid ${borderColor}`,
              borderRadius: "3px",
              padding:      "10px 10px 8px",
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "9px", color: statusColor, fontFamily: FONT, letterSpacing: "0.04em", marginBottom: "2px" }}>
                    {completed ? "✓ " : active ? "⟳ " : ""}{def.shortName}
                    {def.domain && <span style={{ color: "#3d3d3d", fontSize: "8px" }}> — {def.domain}</span>}
                  </div>
                  <div style={{ fontSize: "8px", color: "#6e6e6e", fontFamily: FONT, lineHeight: 1.4 }}>
                    {def.description}
                  </div>
                </div>
              </div>

              {/* Progress bar (if active) */}
              {active && (
                <div style={{ marginBottom: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontSize: "7px", color: "#6e6e6e", fontFamily: FONT }}>Progress</span>
                    <span style={{ fontSize: "7px", color: "#ffd700", fontFamily: FONT }}>{active.progress}%</span>
                  </div>
                  <div style={{ height: "3px", background: "#0f0f0f", borderRadius: "1px" }}>
                    <div style={{ height: "100%", width: `${active.progress}%`, background: "#ffd700", opacity: 0.7, transition: "width 0.5s", borderRadius: "1px" }} />
                  </div>
                </div>
              )}

              {/* Metadata row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <span style={{ fontSize: "7px", color: "#585858", fontFamily: FONT }}>{def.cyclesRequired} cycle{def.cyclesRequired > 1 ? "s" : ""}</span>
                  <span style={{ fontSize: "7px", color: "#585858", fontFamily: FONT }}>Launch: {def.launchCost} cap · {def.capacityCostPerCycle} cap/cycle</span>
                </div>

                {!completed && !active && (
                  <button
                    disabled={!canLaunch}
                    onClick={() => launchInitiative(def.key)}
                    style={{
                      background:   canLaunch ? "#0d1a0d" : "transparent",
                      border:       `1px solid ${canLaunch ? "#00ff8855" : "#141414"}`,
                      color:        canLaunch ? "#00ff88" : "#1a1a1a",
                      fontFamily:   FONT,
                      fontSize:     "8px",
                      padding:      "4px 10px",
                      borderRadius: "2px",
                      cursor:       canLaunch ? "pointer" : "not-allowed",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {!prereqMet ? `Requires ${def.prerequisites?.join(", ") ?? ""}` : available < def.launchCost ? `${def.launchCost} cap needed` : "Launch"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
