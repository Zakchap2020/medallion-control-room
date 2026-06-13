import type { DataDomain } from "../../models/types";
import { useGameStore } from "../../state/store";
import { FIXED_DATASETS } from "../../data/datasets";
import { compositeQuality, qualityColor, layerForState } from "../../engine/qualityUtils";

const FONT = "'Courier New', Courier, monospace";

const DOMAINS: DataDomain[] = ["Finance", "Sales", "Marketing", "HR", "Operations"];

const DOMAIN_COLORS: Record<DataDomain, string> = {
  Finance: "#ffd700", Sales: "#00bfff", Marketing: "#ff69b4",
  HR: "#98fb98", Operations: "#ffa500",
};

function domainHealth(domain: DataDomain, state: ReturnType<typeof useGameStore.getState>): number {
  const dss = FIXED_DATASETS.filter((d) => d.domain === domain).map((d) => state.datasets[d.id]).filter(Boolean);
  if (dss.length === 0) return 0;
  const avgQ = dss.reduce((s, ds) => s + compositeQuality(ds!.quality), 0) / dss.length;
  const ownedPct  = dss.filter((ds) => ds!.ownerId).length   / dss.length;
  const stewPct   = dss.filter((ds) => ds!.stewardId).length / dss.length;
  const openPressures = state.pressures.filter(
    (p) => p.status === "open" && FIXED_DATASETS.filter((fd) => fd.domain === domain).some((fd) => p.affectedDatasets.includes(fd.id))
  ).length;
  return Math.max(0, Math.min(100, Math.round(avgQ * 0.5 + ownedPct * 25 + stewPct * 25 - openPressures * 8)));
}

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DomainView({ selectedId, onSelect }: Props) {
  const state = useGameStore((s) => s);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ fontSize: "9px", color: "#6e6e6e", textTransform: "uppercase", letterSpacing: "0.14em", padding: "7px 10px", borderBottom: "1px solid #141414", flexShrink: 0 }}>
        Domain Overview
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 0 }}>
        {DOMAINS.map((domain) => {
          const dColor = DOMAIN_COLORS[domain];
          const health = domainHealth(domain, state);
          const hColor = qualityColor(health);
          const domainDatasets = FIXED_DATASETS.filter((fd) => fd.domain === domain);
          const openPressures = state.pressures.filter(
            (p) => p.status === "open" && domainDatasets.some((fd) => p.affectedDatasets.includes(fd.id))
          ).length;

          return (
            <div key={domain} style={{ borderBottom: "1px solid #0e0e0e", flexShrink: 0 }}>
              {/* Domain header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px 4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "2px", height: "12px", background: dColor, borderRadius: "1px" }} />
                  <span style={{ fontSize: "9px", color: "#888", fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.08em" }}>{domain}</span>
                  {openPressures > 0 && (
                    <span style={{ fontSize: "7px", color: "#ff4444", background: "#ff444418", border: "1px solid #ff444444", borderRadius: "2px", padding: "0 4px" }}>
                      {openPressures} issue{openPressures > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: hColor, fontFamily: FONT }}>{health}</span>
              </div>

              {/* Health bar */}
              <div style={{ height: "1px", background: "#0a0a0a", margin: "0 10px" }}>
                <div style={{ height: "100%", width: `${health}%`, background: hColor, opacity: 0.5 }} />
              </div>

              {/* Datasets */}
              <div style={{ padding: "4px 8px 6px" }}>
                {domainDatasets.map((fd) => {
                  const ds = state.datasets[fd.id];
                  if (!ds) return null;
                  const cq = compositeQuality(ds.quality);
                  const qColor = qualityColor(cq);
                  const layer = layerForState(ds);
                  const isSelected = fd.id === selectedId;
                  const LAYER_COLORS: Record<string, string> = { bronze: "#7a4a1e", silver: "#909090", gold: "#c8a800" };

                  return (
                    <button key={fd.id} onClick={() => onSelect(fd.id)} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      background: isSelected ? "#121212" : "transparent",
                      border: `1px solid ${isSelected ? "#1e1e1e" : "transparent"}`,
                      borderRadius: "2px",
                      padding: "3px 4px",
                      cursor: "pointer",
                      gap: "6px",
                      marginBottom: "1px",
                    }}>
                      {/* Name */}
                      <span style={{ fontSize: "8px", color: isSelected ? "#c0c0c0" : "#909090", fontFamily: FONT, flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {fd.name}
                      </span>

                      {/* Quality mini-bar */}
                      <div style={{ width: "32px", height: "2px", background: "#0d0d0d", borderRadius: "1px", flexShrink: 0 }}>
                        <div style={{ height: "100%", width: `${cq}%`, background: qColor, opacity: 0.7 }} />
                      </div>

                      {/* Role dots */}
                      <div style={{ display: "flex", gap: "1px" }}>
                        {[ds.ownerId, ds.stewardId, ds.custodianId || ds.engineerId].map((filled, i) => (
                          <div key={i} style={{
                            width: "4px", height: "4px", borderRadius: "50%",
                            background: filled ? "#00ff88" : "#141414",
                          }} />
                        ))}
                      </div>

                      {/* Layer badge */}
                      <span style={{ fontSize: "7px", color: LAYER_COLORS[layer], fontFamily: FONT, width: "14px", textAlign: "right" }}>
                        {layer === "gold" ? "G" : layer === "silver" ? "S" : "B"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
