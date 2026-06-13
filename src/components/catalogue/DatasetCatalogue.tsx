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
  return "#444";
}

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function RoleDot({ filled }: { filled: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: filled ? "#00ff88" : "#2a2a2a",
      marginRight: "2px",
    }} />
  );
}

export function DatasetCatalogue({ selectedId, onSelect }: Props) {
  const datasets = useGameStore((s) => s.datasets);
  const catalogue = useGameStore((s) => s.catalogue);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px", overflowY: "auto", flex: 1 }}>
      <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
        {datasets.length} dataset{datasets.length !== 1 ? "s" : ""} ingested
      </div>
      {datasets.length === 0 && (
        <div style={{ color: "#444", fontStyle: "italic", fontSize: "13px", marginTop: "12px" }}>
          No datasets yet. Run a tick to begin ingestion.
        </div>
      )}
      {[...datasets].reverse().map((ds) => {
        const entry = catalogue[ds.id];
        const isSelected = selectedId === ds.id;
        const risk = entry?.governanceRisk ?? 0;

        return (
          <div
            key={ds.id}
            onClick={() => onSelect(ds.id)}
            style={{
              background: isSelected ? "#161616" : "#111",
              border: `1px solid ${isSelected ? "#333" : "#1e1e1e"}`,
              borderLeft: `3px solid ${DEPT_COLORS[ds.department] ?? "#555"}`,
              borderRadius: "3px",
              padding: "7px 9px",
              fontSize: "12px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div style={{ fontFamily: "monospace", color: "#e0e0e0", marginBottom: "4px", fontSize: "11px" }}>
              {ds.name}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "8px", color: "#666", fontSize: "10px", alignItems: "center" }}>
                <span style={{ color: DEPT_COLORS[ds.department] }}>{ds.department}</span>
                <span>{ds.recordCount.toLocaleString()}r</span>
              </div>
              {entry && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {/* O = owner, S = steward, C = custodian dots */}
                  <span style={{ fontSize: "9px", color: "#333" }}>O</span>
                  <RoleDot filled={!!entry.ownerId} />
                  <span style={{ fontSize: "9px", color: "#333" }}>S</span>
                  <RoleDot filled={!!entry.stewardId} />
                  <span style={{ fontSize: "9px", color: "#333" }}>C</span>
                  <RoleDot filled={!!entry.custodianId} />
                  {risk > 30 && (
                    <span style={{ fontSize: "9px", color: riskColor(risk), marginLeft: "4px" }}>
                      {risk}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
