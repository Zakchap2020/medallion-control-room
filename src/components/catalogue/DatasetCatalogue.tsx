import { useState } from "react";
import { useGameStore } from "../../state/store";
import { compositeQuality } from "../../engine/medallionEngine";
import type { Dataset } from "../../models/types";

type CatalogueFilter = "all" | "at_risk" | "ungoverned" | "gold";

const DEPT_COLORS: Record<string, string> = {
  Finance:    "#ffd700",
  Sales:      "#00bfff",
  Marketing:  "#ff69b4",
  HR:         "#98fb98",
  Operations: "#ffa500",
};

const LAYER_STYLE: Record<string, { color: string; label: string }> = {
  bronze: { color: "#7a4a1e", label: "BRZ" },
  silver: { color: "#666",    label: "SLV" },
  gold:   { color: "#c8a800", label: "GLD" },
};

function qualityColor(q: number): string {
  if (q < 35) return "#ff4444";
  if (q < 60) return "#ffa500";
  return "#00ff88";
}

function rowTint(ds: Dataset, risk: number, isSelected: boolean, cq: number): string {
  if (ds.layer === "gold")   return isSelected ? "#1c1800" : "#14100000";
  if (cq < 35)               return isSelected ? "#1a0000" : "#ff444406";
  if (risk > 65)             return isSelected ? "#1a0800" : "#ff660405";
  if (isSelected)            return "#141414";
  return "#0e0e0e";
}

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function RoleDot({ filled, label }: { filled: boolean; label: string }) {
  return (
    <span
      title={`${label}: ${filled ? "assigned" : "unassigned"}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "14px",
        height: "14px",
        borderRadius: "2px",
        background: filled ? "#003818" : "transparent",
        border: `1px solid ${filled ? "#00ff8840" : "#1e1e1e"}`,
        fontSize: "7px",
        color: filled ? "#00ff88" : "#333",
        fontFamily: "'Courier New', monospace",
      }}
    >
      {label[0]}
    </span>
  );
}

function LayerBadge({ ds }: { ds: Dataset }) {
  const ls = LAYER_STYLE[ds.layer];
  return (
    <span style={{
      fontSize: "8px",
      color: ls.color,
      border: `1px solid ${ls.color}44`,
      borderRadius: "2px",
      padding: "1px 4px",
      letterSpacing: "0.04em",
      flexShrink: 0,
    }}>
      {ls.label}
    </span>
  );
}

const FILTER_LABELS: Record<CatalogueFilter, string> = {
  all: "All",
  at_risk: "At Risk",
  ungoverned: "Ungoverned",
  gold: "Gold",
};

export function DatasetCatalogue({ selectedId, onSelect }: Props) {
  const datasets  = useGameStore((s) => s.datasets);
  const catalogue = useGameStore((s) => s.catalogue);
  const [filter, setFilter] = useState<CatalogueFilter>("all");

  const bronze = datasets.filter((d) => d.layer === "bronze").length;
  const silver = datasets.filter((d) => d.layer === "silver").length;
  const gold   = datasets.filter((d) => d.layer === "gold").length;

  const filtered = [...datasets].filter((ds) => {
    const entry = catalogue[ds.id];
    const cq    = compositeQuality(ds.quality);
    const risk  = entry?.governanceRisk ?? 0;
    if (filter === "at_risk")    return cq < 60 || risk > 65;
    if (filter === "ungoverned") return !entry?.ownerId;
    if (filter === "gold")       return ds.layer === "gold";
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", height: "100%", overflow: "hidden" }}>
      {/* Summary line */}
      <div style={{
        display: "flex",
        gap: "8px",
        fontSize: "9px",
        color: "#2a2a2a",
        marginBottom: "3px",
        flexShrink: 0,
      }}>
        <span>{datasets.length} datasets</span>
        {gold   > 0 && <span style={{ color: "#a08800" }}>{gold}G</span>}
        {silver > 0 && <span style={{ color: "#555"   }}>{silver}S</span>}
        {bronze > 0 && <span style={{ color: "#4a2a0e" }}>{bronze}B</span>}
      </div>

      {/* Filter buttons */}
      <div style={{ display: "flex", gap: "2px", flexShrink: 0, marginBottom: "4px" }}>
        {(["all", "at_risk", "ungoverned", "gold"] as CatalogueFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1,
              background: filter === f ? "#1a1a1a" : "transparent",
              border: `1px solid ${filter === f ? "#2a2a2a" : "#141414"}`,
              color: filter === f
                ? (f === "at_risk" ? "#ff6600" : f === "ungoverned" ? "#ff4444" : f === "gold" ? "#c8a800" : "#c0c0c0")
                : "#2a2a2a",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "8px",
              padding: "3px 0",
              borderRadius: "2px",
              cursor: "pointer",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {datasets.length === 0 && (
        <div style={{ color: "#222", fontStyle: "italic", fontSize: "11px", paddingTop: "12px" }}>
          No datasets. Run a tick.
        </div>
      )}

      {filtered.length === 0 && datasets.length > 0 && (
        <div style={{ color: "#1e1e1e", fontSize: "10px", paddingTop: "8px", textAlign: "center" }}>
          No {FILTER_LABELS[filter].toLowerCase()} datasets
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
      {[...filtered].reverse().map((ds) => {
        const entry      = catalogue[ds.id];
        const isSelected = selectedId === ds.id;
        const risk       = entry?.governanceRisk ?? 0;
        const cq         = Math.round(compositeQuality(ds.quality));
        const isDrifting = ds.quality.consistency < 45;
        const bg         = rowTint(ds, risk, isSelected, cq);

        return (
          <div
            key={ds.id}
            onClick={() => onSelect(ds.id)}
            className="anim-row-appear"
            style={{
              background: bg,
              border: `1px solid ${isSelected ? "#2a2a2a" : "#141414"}`,
              borderLeft: `3px solid ${DEPT_COLORS[ds.department] ?? "#333"}`,
              borderRadius: "2px",
              padding: "5px 7px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {/* Row 1: name + layer badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
              <span style={{
                fontFamily: "monospace",
                color: "#c8c8c8",
                fontSize: "10px",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {ds.name}
              </span>
              <LayerBadge ds={ds} />
            </div>

            {/* Row 2: dept + quality score + warnings + role dots */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px" }}>
              <span style={{ color: DEPT_COLORS[ds.department], minWidth: "52px" }}>
                {ds.department}
              </span>

              <span style={{ color: qualityColor(cq), fontFamily: "monospace" }}>
                {cq}
              </span>

              {isDrifting && (
                <span style={{ color: "#cc6600" }} title="Schema drift">⚡</span>
              )}

              {ds.autoFixEnabled && (
                <span style={{ color: "#00ff8830", fontSize: "8px" }} title="Auto-Fix enabled">AF</span>
              )}

              {/* Role dots */}
              <div style={{ marginLeft: "auto", display: "flex", gap: "2px" }}>
                {entry && (
                  <>
                    <RoleDot filled={!!entry.ownerId}     label="Owner" />
                    <RoleDot filled={!!entry.stewardId}   label="Steward" />
                    <RoleDot filled={!!entry.custodianId} label="Custodian" />
                  </>
                )}
              </div>
            </div>

            {/* Row 3: quality mini-bar */}
            <div style={{
              height: "2px",
              background: "#111",
              borderRadius: "1px",
              marginTop: "4px",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${cq}%`,
                background: qualityColor(cq),
                borderRadius: "1px",
                transition: "width 0.4s ease",
                opacity: 0.7,
              }} />
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
