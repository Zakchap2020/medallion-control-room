import { useGameStore } from "../../state/store";

const DEPT_COLORS: Record<string, string> = {
  Finance: "#ffd700",
  Sales: "#00bfff",
  Marketing: "#ff69b4",
  HR: "#98fb98",
  Operations: "#ffa500",
};

function riskColor(risk: number): string {
  if (risk > 70) return "#ff4444";
  if (risk > 40) return "#ffa500";
  return "#00ff88";
}

export function SiloPanel() {
  const silos = useGameStore((s) => s.silos);
  const containSilo = useGameStore((s) => s.containSilo);

  const activeSilos = silos.filter((s) => s.discovered && !s.contained);
  const hiddenCount = silos.filter((s) => !s.discovered).length;
  const containedCount = silos.filter((s) => s.contained).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px", overflow: "hidden" }}>
      <div
        style={{
          fontSize: "10px",
          color: "#444",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "10px",
          borderBottom: "1px solid #1a1a1a",
          paddingBottom: "6px",
          display: "flex",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span>Silo Monitor</span>
        <span style={{ color: "#333", fontSize: "9px" }}>
          {hiddenCount > 0 && `${hiddenCount} hidden · `}
          {containedCount > 0 && `${containedCount} contained`}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
        {activeSilos.length === 0 && (
          <div
            style={{
              color: "#2a2a2a",
              textAlign: "center",
              paddingTop: "60px",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {silos.length === 0
              ? "No silos detected"
              : "No discovered silos — investigate signals"}
          </div>
        )}

        {activeSilos.map((silo) => (
          <div
            key={silo.id}
            style={{
              background: "#111",
              border: `1px solid ${riskColor(silo.riskLevel)}22`,
              borderLeft: `3px solid ${riskColor(silo.riskLevel)}`,
              borderRadius: "3px",
              padding: "10px 12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontFamily: "monospace", color: "#e0e0e0", fontSize: "12px" }}>
                {silo.name}
              </span>
              <span style={{ color: riskColor(silo.riskLevel), fontWeight: "bold", fontSize: "13px" }}>
                {silo.riskLevel}%
              </span>
            </div>

            {/* Risk bar */}
            <div style={{ height: "3px", background: "#1a1a1a", borderRadius: "2px", marginBottom: "8px" }}>
              <div
                style={{
                  height: "100%",
                  width: `${silo.riskLevel}%`,
                  background: riskColor(silo.riskLevel),
                  borderRadius: "2px",
                  transition: "width 0.3s",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: DEPT_COLORS[silo.department] ?? "#555" }}>
                {silo.department} · importance {silo.importance}
              </span>
              <button
                onClick={() => containSilo(silo.id)}
                style={{
                  background: "transparent",
                  border: `1px solid ${riskColor(silo.riskLevel)}`,
                  color: riskColor(silo.riskLevel),
                  borderRadius: "2px",
                  padding: "3px 10px",
                  fontSize: "10px",
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
        ))}
      </div>
    </div>
  );
}
