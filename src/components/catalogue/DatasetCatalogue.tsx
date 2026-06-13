import { useGameStore } from "../../state/store";
import { compositeQuality } from "../../engine/medallionEngine";
import type { Dataset } from "../../models/types";

const DEPT_COLORS: Record<string, string> = {
  Finance: "#ffd700",
  Sales: "#00bfff",
  Marketing: "#ff69b4",
  HR: "#98fb98",
  Operations: "#ffa500",
};

const LAYER_STYLE: Record<string, { color: string; label: string }> = {
  bronze: { color: "#7a4a1e", label: "BRZ" },
  silver: { color: "#888",   label: "SLV" },
  gold:   { color: "#c8a800", label: "GLD" },
};

function riskColor(risk: number): string {
  if (risk > 70) return "#ff4444";
  if (risk > 40) return "#ffa500";
  return "#444";
}

function qualityColor(q: number): string {
  if (q < 40) return "#ff4444";
  if (q < 65) return "#ffa500";
  return "#00ff88";
}

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function RoleDot({ filled }: { filled: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      width: "5px", height: "5px",
      borderRadius: "50%",
      background: filled ? "#00ff88" : "#2a2a2a",
      marginRight: "2px",
    }} />
  );
}

function LayerBadge({ ds }: { ds: Dataset }) {
  const ls = LAYER_STYLE[ds.layer];
  return (
    <span style={{
      fontSize: "8px",
      color: ls.color,
      border: `1px solid ${ls.color}55`,
      borderRadius: "2px",
      padding: "1px 4px",
      letterSpacing: "0.04em",
    }}>
      {ls.label}
    </span>
  );
}

export function DatasetCatalogue({ selectedId, onSelect }: Props) {
  const datasets  = useGameStore((s) => s.datasets);
  const catalogue = useGameStore((s) => s.catalogue);

  const bronze = datasets.filter((d) => d.layer === "bronze").length;
  const silver = datasets.filter((d) => d.layer === "silver").length;
  const gold   = datasets.filter((d) => d.layer === "gold").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto", flex: 1 }}>
      <div style={{ fontSize: "10px", color: "#444", marginBottom: "4px", display: "flex", gap: "8px" }}>
        <span>{datasets.length} datasets</span>
        {gold > 0   && <span style={{ color: "#c8a800" }}>▲{gold}G</span>}
        {silver > 0 && <span style={{ color: "#666"   }}>▲{silver}S</span>}
        <span style={{ color: "#555" }}>▲{bronze}B</span>
      </div>

      {datasets.length === 0 && (
        <div style={{ color: "#333", fontStyle: "italic", fontSize: "12px", marginTop: "8px" }}>
          No datasets. Run a tick to begin.
        </div>
      )}

      {[...datasets].reverse().map((ds) => {
        const entry      = catalogue[ds.id];
        const isSelected = selectedId === ds.id;
        const risk       = entry?.governanceRisk ?? 0;
        const cq         = Math.round(compositeQuality(ds.quality));
        const isDrifting = ds.quality.consistency < 45;

        return (
          <div
            key={ds.id}
            onClick={() => onSelect(ds.id)}
            style={{
              background: isSelected ? "#161616" : "#0e0e0e",
              border: `1px solid ${isSelected ? "#2a2a2a" : "#161616"}`,
              borderLeft: `3px solid ${DEPT_COLORS[ds.department] ?? "#555"}`,
              borderRadius: "2px",
              padding: "6px 8px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {/* Row 1: name + layer badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "3px",
            }}>
              <span style={{ fontFamily: "monospace", color: "#d0d0d0", fontSize: "10px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ds.name}
              </span>
              <LayerBadge ds={ds} />
            </div>

            {/* Row 2: dept + quality + governance dots + risk */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "9px" }}>
              <span style={{ color: DEPT_COLORS[ds.department], minWidth: "52px" }}>
                {ds.department}
              </span>

              {/* Composite quality */}
              <span style={{ color: qualityColor(cq), fontWeight: cq < 40 ? "bold" : "normal" }}>
                Q:{cq}
              </span>

              {/* Drift warning */}
              {isDrifting && (
                <span style={{ color: "#ffa500" }} title="Schema drift detected">⚡</span>
              )}

              {/* Auto-fix indicator */}
              <span style={{ color: ds.autoFixEnabled ? "#00ff8844" : "#333" }} title="Auto-Fix">
                {ds.autoFixEnabled ? "AF" : "—"}
              </span>

              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
                {entry && (
                  <>
                    <span style={{ color: "#2a2a2a" }}>O</span>
                    <RoleDot filled={!!entry.ownerId} />
                    <span style={{ color: "#2a2a2a" }}>S</span>
                    <RoleDot filled={!!entry.stewardId} />
                    <span style={{ color: "#2a2a2a" }}>C</span>
                    <RoleDot filled={!!entry.custodianId} />
                    {risk > 30 && (
                      <span style={{ color: riskColor(risk), marginLeft: "3px" }}>{risk}%</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
