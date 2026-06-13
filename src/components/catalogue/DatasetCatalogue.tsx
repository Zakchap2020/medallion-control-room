import { useState } from "react";
import { useGameStore } from "../../state/store";
import { FIXED_DATASETS, DATASET_BY_ID } from "../../data/datasets";
import { compositeQuality, qualityColor, layerForState } from "../../engine/qualityUtils";

const FONT = "'Courier New', Courier, monospace";

type Filter = "all" | "at_risk" | "ungoverned" | "gold" | "critical";

const DOMAIN_COLORS: Record<string, string> = {
  Finance: "#ffd700", Sales: "#00bfff", Marketing: "#ff69b4",
  HR: "#98fb98", Operations: "#ffa500",
};

const LAYER_COLORS: Record<string, string> = {
  bronze: "#7a4a1e", silver: "#888", gold: "#ffd700",
};

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DatasetCatalogue({ selectedId, onSelect }: Props) {
  const datasets = useGameStore((s) => s.datasets);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = FIXED_DATASETS.filter((fd) => {
    const ds = datasets[fd.id];
    if (!ds) return false;
    const cq = compositeQuality(ds.quality);
    const layer = layerForState(ds);
    switch (filter) {
      case "at_risk":    return cq < 55;
      case "ungoverned": return !ds.ownerId && !ds.stewardId;
      case "gold":       return layer === "gold";
      case "critical":   return fd.criticality >= 4;
      default:           return true;
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginBottom: "8px", flexShrink: 0 }}>
        {(["all", "critical", "at_risk", "ungoverned", "gold"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background:    filter === f ? "#1a1a1a" : "transparent",
            border:        `1px solid ${filter === f ? "#2a2a2a" : "#141414"}`,
            color:         filter === f ? "#c0c0c0" : "#6e6e6e",
            fontFamily:    FONT,
            fontSize:      "8px",
            padding:       "3px 7px",
            borderRadius:  "2px",
            cursor:        "pointer",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            {f === "at_risk" ? "At Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
        {filtered.map((fd) => {
          const ds = datasets[fd.id];
          if (!ds) return null;
          const cq = compositeQuality(ds.quality);
          const qColor = qualityColor(cq);
          const layer = layerForState(ds);
          const isSelected = fd.id === selectedId;
          const dColor = DOMAIN_COLORS[fd.domain] ?? "#555";
          const critColor = fd.criticality >= 5 ? "#ff4444" : fd.criticality >= 4 ? "#ff6600" : "#585858";

          return (
            <button key={fd.id} onClick={() => onSelect(fd.id)} style={{
              background:    isSelected ? "#121212" : "#0a0a0a",
              border:        `1px solid ${isSelected ? "#404040" : "#1a1a1a"}`,
              borderLeft:    `2px solid ${dColor}`,
              borderRadius:  "2px",
              padding:       "7px 8px",
              cursor:        "pointer",
              textAlign:     "left",
              width:         "100%",
            }}>
              {/* Name + layer + score */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "9px", color: isSelected ? "#c0c0c0" : "#888", fontFamily: FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "6px" }}>
                  {fd.name}
                </span>
                <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "7px", color: LAYER_COLORS[layer], fontFamily: FONT, textTransform: "uppercase" }}>
                    {layer}
                  </span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", color: qColor, fontFamily: FONT }}>{cq}</span>
                </div>
              </div>

              {/* Quality bar */}
              <div style={{ height: "2px", background: "#0f0f0f", borderRadius: "1px", marginBottom: "5px" }}>
                <div style={{ height: "100%", width: `${cq}%`, background: qColor, opacity: 0.65, borderRadius: "1px", transition: "width 0.3s" }} />
              </div>

              {/* Domain + role badges */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "7px", color: "#585858", fontFamily: FONT }}>
                  {fd.domain} · {fd.usageCount} users
                </span>
                <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                  {(["O", "S", "T"] as const).map((lbl, i) => {
                    const filled = i === 0 ? !!ds.ownerId : i === 1 ? !!ds.stewardId : !!(ds.custodianId || ds.engineerId);
                    return (
                      <span key={lbl} style={{
                        fontSize: "7px", fontFamily: FONT,
                        color: filled ? "#00ff88" : "#3d3d3d",
                        border: `1px solid ${filled ? "#00ff8833" : "#111"}`,
                        borderRadius: "2px", padding: "0 2px",
                      }}>
                        {lbl}
                      </span>
                    );
                  })}
                  <span style={{ fontSize: "7px", color: critColor, fontFamily: FONT, marginLeft: "2px" }}>
                    {"★".repeat(fd.criticality)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ fontSize: "9px", color: "#484848", fontFamily: FONT, textAlign: "center", padding: "24px 0" }}>
            No datasets match this filter.
          </div>
        )}
      </div>
    </div>
  );
}

// re-export so import paths that used the old type still get something useful
export { DATASET_BY_ID };
