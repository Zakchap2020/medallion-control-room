import { useGameStore } from "../../state/store";
import type { Department } from "../../models/types";
import { departmentHealth, healthColor } from "../../engine/orgMapEngine";
import { compositeQuality } from "../../engine/medallionEngine";
import { Avatar } from "../ui/Avatar";
import { showToast } from "../ui/ToastStack";
import { playSound } from "../../engine/soundEngine";

const FONT = "'Courier New', Courier, monospace";
const LAYER_COLORS = { bronze: "#7a4a1e", silver: "#555", gold: "#c8a800" };

interface Props {
  department: Department;
  onClose: () => void;
}

export function DepartmentDrillDown({ department, onClose }: Props) {
  const state       = useGameStore((s) => s);
  const containSilo = useGameStore((s) => s.containSilo);

  const health   = departmentHealth(department, state);
  const color    = healthColor(health);
  const datasets = state.datasets.filter((d) => d.department === department);
  const deptIds  = new Set(datasets.map((d) => d.id));

  const incidents = state.incidents.filter(
    (i) =>
      (i.status === "open" || i.status === "in_progress") &&
      i.affectedDatasetIds.some((id) => deptIds.has(id))
  );

  const silos    = state.silos.filter(
    (s) => s.department === department && s.discovered && !s.contained
  );
  const analyst  = state.analysts.find((a) => a.assignedDepartment === department);

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "#080808",
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 14px",
        borderBottom: "1px solid #141414",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "3px", height: "18px", background: color, borderRadius: "1px" }} />
          <span style={{
            fontSize: "10px", color: "#c0c0c0", fontFamily: FONT,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            {department}
          </span>
          <span style={{ fontSize: "18px", fontWeight: "bold", color, fontFamily: FONT, lineHeight: 1 }}>
            {Math.round(health)}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", color: "#2a2a2a",
            cursor: "pointer", fontSize: "13px", fontFamily: FONT, lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Health bar */}
      <div style={{ height: "2px", background: "#0a0a0a", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${health}%`, background: color, opacity: 0.5, transition: "width 0.4s" }} />
      </div>

      <div style={{
        flex: 1, overflowY: "auto", padding: "10px 14px",
        display: "flex", flexDirection: "column", gap: "12px",
      }}>

        {/* Assigned analyst */}
        <Section label="Analyst">
          {analyst ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {analyst.avatarIndex !== undefined && <Avatar index={analyst.avatarIndex} size={28} />}
              <div>
                <div style={{ fontSize: "10px", color: "#c0c0c0", fontFamily: FONT }}>{analyst.name}</div>
                <div style={{ fontSize: "8px", color: "#333", marginTop: "2px", fontFamily: FONT }}>
                  Analysis {analyst.skills.analysis} · Gov {analyst.skills.governance}
                </div>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: "9px", color: "#1e1e1e", fontFamily: FONT }}>
              None — drag an analyst from the bench
            </span>
          )}
        </Section>

        {/* Datasets */}
        <Section label={`Datasets (${datasets.length})`}>
          {datasets.length === 0 ? (
            <span style={{ fontSize: "9px", color: "#1a1a1a", fontFamily: FONT }}>None yet</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {datasets.map((ds) => {
                const entry    = state.catalogue[ds.id];
                const cq       = Math.round(compositeQuality(ds.quality));
                const lColor   = LAYER_COLORS[ds.layer];
                const qColor   = cq >= 60 ? "#00ff88" : cq >= 40 ? "#ffa500" : "#ff4444";
                return (
                  <div key={ds.id} style={{
                    background: "#0c0c0c",
                    border: "1px solid #141414",
                    borderLeft: `2px solid ${lColor}`,
                    borderRadius: "2px",
                    padding: "5px 8px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{
                        fontSize: "9px", color: "#b0b0b0", fontFamily: FONT,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                      }}>
                        {ds.name}
                      </span>
                      <span style={{ fontSize: "8px", color: qColor, fontFamily: FONT, marginLeft: "8px" }}>
                        {cq}
                      </span>
                    </div>
                    <div style={{ height: "2px", background: "#0f0f0f", borderRadius: "1px", marginBottom: "4px" }}>
                      <div style={{
                        height: "100%", width: `${cq}%`, background: qColor,
                        borderRadius: "1px", opacity: 0.65, transition: "width 0.3s",
                      }} />
                    </div>
                    {entry && (
                      <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                        {(["O", "S", "C"] as const).map((lbl, i) => {
                          const filled = i === 0 ? !!entry.ownerId : i === 1 ? !!entry.stewardId : !!entry.custodianId;
                          return (
                            <span key={lbl} style={{
                              fontSize: "7px", fontFamily: FONT,
                              color: filled ? "#00ff88" : "#1a1a1a",
                              border: `1px solid ${filled ? "#00ff8833" : "#151515"}`,
                              borderRadius: "2px", padding: "0 3px",
                            }}>
                              {lbl}
                            </span>
                          );
                        })}
                        {entry.classification && (
                          <span style={{
                            fontSize: "7px", color: "#2a2a2a", fontFamily: FONT,
                            marginLeft: "auto", textTransform: "uppercase", letterSpacing: "0.04em",
                          }}>
                            {entry.classification}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Incidents */}
        {incidents.length > 0 && (
          <Section label={`Incidents (${incidents.length})`}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {incidents.map((inc) => {
                const sevColor =
                  inc.severity === "critical" ? "#ff2222" :
                  inc.severity === "high"     ? "#ff6600" : "#ffd700";
                return (
                  <div key={inc.id} style={{
                    background: "#0c0c0c",
                    border: `1px solid ${sevColor}22`,
                    borderLeft: `2px solid ${sevColor}`,
                    borderRadius: "2px",
                    padding: "5px 8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span style={{ fontSize: "9px", color: "#888", fontFamily: FONT }}>
                      {inc.type.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontSize: "8px", color: sevColor, fontFamily: FONT, letterSpacing: "0.04em" }}>
                      {inc.severity}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Silos */}
        {silos.length > 0 && (
          <Section label={`Silos (${silos.length})`}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {silos.map((silo) => {
                const siloColor =
                  silo.riskLevel > 75 ? "#ff2222" :
                  silo.riskLevel > 50 ? "#ff6600" : "#ffd700";
                return (
                  <div key={silo.id} style={{
                    background: "#0c0c0c",
                    border: `1px solid ${siloColor}22`,
                    borderLeft: `2px solid ${siloColor}`,
                    borderRadius: "2px",
                    padding: "5px 8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <span style={{ fontSize: "9px", color: "#888", fontFamily: FONT }}>{silo.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "8px", color: siloColor, fontFamily: FONT }}>{silo.riskLevel}%</span>
                      <button
                        onClick={() => {
                          containSilo(silo.id);
                          showToast(`Silo contained: ${silo.name}`, "success");
                          playSound("silo_contained");
                        }}
                        style={{
                          background: "transparent",
                          border: `1px solid ${siloColor}66`,
                          color: siloColor,
                          fontFamily: FONT,
                          fontSize: "7px",
                          padding: "2px 7px",
                          borderRadius: "2px",
                          cursor: "pointer",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Contain
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: "8px", color: "#252525", textTransform: "uppercase",
        letterSpacing: "0.1em", fontFamily: FONT, marginBottom: "6px",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
