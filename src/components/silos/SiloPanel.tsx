import { useGameStore } from "../../state/store";
import { showToast } from "../ui/ToastStack";
import { compositeQuality } from "../../engine/medallionEngine";

const DEPT_COLORS: Record<string, string> = {
  Finance:    "#ffd700",
  Sales:      "#00bfff",
  Marketing:  "#ff69b4",
  HR:         "#98fb98",
  Operations: "#ffa500",
};

function riskColor(risk: number): string {
  if (risk > 75) return "#ff2222";
  if (risk > 50) return "#ff6600";
  if (risk > 30) return "#ffd700";
  return "#00ff88";
}

function riskLabel(risk: number): string {
  if (risk > 75) return "CRITICAL";
  if (risk > 50) return "HIGH";
  if (risk > 30) return "MEDIUM";
  return "LOW";
}

export function SiloPanel() {
  const silos      = useGameStore((s) => s.silos);
  const datasets   = useGameStore((s) => s.datasets);
  const catalogue  = useGameStore((s) => s.catalogue);
  const containSilo = useGameStore((s) => s.containSilo);

  const activeSilos    = silos.filter((s) => s.discovered && !s.contained);
  const hiddenCount    = silos.filter((s) => !s.discovered).length;
  const containedCount = silos.filter((s) => s.contained).length;
  const criticalCount  = activeSilos.filter((s) => s.riskLevel > 75).length;
  const highCount      = activeSilos.filter((s) => s.riskLevel > 50 && s.riskLevel <= 75).length;

  const handleContain = (siloId: string, name: string) => {
    containSilo(siloId);
    showToast(`Silo contained: ${name}`, "success");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        fontSize: "9px",
        color: "#383838",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        borderBottom: "1px solid #141414",
        padding: "7px 10px",
        flexShrink: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span>Silo Monitor</span>
        <div style={{ display: "flex", gap: "10px", fontSize: "9px" }}>
          {criticalCount > 0 && (
            <span className="anim-urgent-blink" style={{ color: "#ff2222" }}>
              {criticalCount} critical
            </span>
          )}
          {highCount > 0 && (
            <span style={{ color: "#ff6600" }}>{highCount} high</span>
          )}
          {hiddenCount > 0 && (
            <span style={{ color: "#2a2a2a" }}>{hiddenCount} hidden</span>
          )}
          {containedCount > 0 && (
            <span style={{ color: "#1a4a1a" }}>{containedCount} contained</span>
          )}
        </div>
      </div>

      {/* Silo list */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}>
        {activeSilos.length === 0 && (() => {
          if (silos.length === 0 && datasets.length === 0) {
            return (
              <div style={{ color: "#1e1e1e", textAlign: "center", paddingTop: "48px", fontSize: "11px" }}>
                No silos detected
              </div>
            );
          }
          const goldCount      = datasets.filter((d) => d.layer === "gold").length;
          const silverCount    = datasets.filter((d) => d.layer === "silver").length;
          const bronzeCount    = datasets.filter((d) => d.layer === "bronze").length;
          const avgQuality     = datasets.length > 0
            ? Math.round(datasets.reduce((sum, d) => sum + compositeQuality(d.quality), 0) / datasets.length)
            : 0;
          const ungoverned     = Object.values(catalogue).filter((e) => !e.ownerId).length;
          const qColor         = avgQuality >= 70 ? "#00ff88" : avgQuality >= 50 ? "#ffa500" : "#ff4444";
          return (
            <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9px", color: "#1a4a1a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>
                  ● All silos contained
                </div>
                <div style={{ fontSize: "8px", color: "#1a2a1a", letterSpacing: "0.08em" }}>
                  {containedCount > 0 ? `${containedCount} previously contained` : "No silos detected this session"}
                </div>
              </div>

              {/* Health grid */}
              {datasets.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { label: "Avg Quality", value: `${avgQuality}`, color: qColor },
                    { label: "Ungoverned", value: `${ungoverned}`, color: ungoverned > 3 ? "#ff4444" : ungoverned > 0 ? "#ffa500" : "#00ff88" },
                    { label: "Gold Layer", value: `${goldCount}`, color: goldCount > 0 ? "#c8a800" : "#1e1e1e" },
                    { label: "Pipeline", value: `${bronzeCount}B / ${silverCount}S / ${goldCount}G`, color: "#333" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: "#0c0c0c",
                      border: "1px solid #141414",
                      borderRadius: "3px",
                      padding: "7px 9px",
                    }}>
                      <div style={{ fontSize: "8px", color: "#252525", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "3px" }}>
                        {label}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color, fontFamily: "monospace" }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Sort: highest risk first */}
        {[...activeSilos]
          .sort((a, b) => b.riskLevel - a.riskLevel)
          .map((silo) => {
            const color   = riskColor(silo.riskLevel);
            const isCrit  = silo.riskLevel > 75;

            return (
              <div
                key={silo.id}
                className={isCrit ? "anim-row-appear" : ""}
                style={{
                  background: isCrit ? "#110000" : "#0e0e0e",
                  border: `1px solid ${color}22`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: "3px",
                  padding: "9px 11px",
                  boxShadow: isCrit ? `0 0 12px ${color}18` : "none",
                }}
              >
                {/* Name + risk % */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "monospace", color: "#d8d8d8", fontSize: "11px" }}>
                    {silo.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{
                      fontSize: "8px",
                      color,
                      border: `1px solid ${color}44`,
                      borderRadius: "2px",
                      padding: "1px 5px",
                      letterSpacing: "0.06em",
                      fontWeight: "bold",
                    }}>
                      {riskLabel(silo.riskLevel)}
                    </span>
                    <span style={{ color, fontWeight: "bold", fontSize: "13px", fontFamily: "monospace" }}>
                      {silo.riskLevel}%
                    </span>
                  </div>
                </div>

                {/* Risk bar */}
                <div style={{ height: "3px", background: "#111", borderRadius: "2px", marginBottom: "7px" }}>
                  <div style={{
                    height: "100%",
                    width: `${silo.riskLevel}%`,
                    background: color,
                    borderRadius: "2px",
                    transition: "width 0.35s",
                  }} />
                </div>

                {/* Footer: dept + importance + action */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "8px", fontSize: "9px" }}>
                    <span style={{ color: DEPT_COLORS[silo.department] ?? "#555" }}>
                      {silo.department}
                    </span>
                    <span style={{ color: "#2a2a2a" }}>importance: {silo.importance}</span>
                  </div>
                  <button
                    onClick={() => handleContain(silo.id, silo.name)}
                    style={{
                      background: isCrit ? "#1a0000" : "transparent",
                      border: `1px solid ${color}`,
                      color,
                      borderRadius: "2px",
                      padding: "3px 10px",
                      fontSize: "9px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Contain
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
