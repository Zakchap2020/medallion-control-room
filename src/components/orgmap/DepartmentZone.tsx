import { useState } from "react";
import type { Analyst, Department } from "../../models/types";
import { healthColor } from "../../engine/orgMapEngine";
import { AnalystToken } from "./AnalystToken";

const FONT = "'Courier New', Courier, monospace";

const DEPT_ICONS: Record<Department, string> = {
  Finance: "₿", Sales: "◈", Marketing: "◉", HR: "◎", Operations: "⬡",
};

interface Props {
  department: Department;
  health: number;
  datasetCount: number;
  openIncidents: number;
  assignedAnalysts: Analyst[];
  onDrop: (analystId: string, dept: Department) => void;
  onDragStart: (e: React.DragEvent, analystId: string) => void;
  onClick: () => void;
  isSelected: boolean;
}

export function DepartmentZone({
  department, health, datasetCount, openIncidents,
  assignedAnalysts, onDrop, onDragStart, onClick, isSelected,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const color = healthColor(health);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const analystId = e.dataTransfer.getData("analystId");
    if (analystId) onDrop(analystId, department);
  };

  return (
    <div
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        background: dragOver
          ? color + "28"
          : isSelected
          ? color + "14"
          : color + "08",
        border: `1px solid ${isSelected ? color + "88" : dragOver ? color + "66" : color + "28"}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: "4px",
        padding: "10px 12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        transition: "background 0.12s, border-color 0.12s",
        overflow: "hidden",
        boxShadow: isSelected ? `0 0 16px ${color}18` : "none",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color, opacity: 0.6 }}>{DEPT_ICONS[department]}</span>
          <span style={{
            fontSize: "9px", color: "#999", fontFamily: FONT,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            {department}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {openIncidents > 0 && (
            <span style={{
              fontSize: "8px", fontFamily: FONT,
              color: openIncidents >= 3 ? "#ff2222" : "#ff6600",
              background: openIncidents >= 3 ? "#ff222218" : "#ff660018",
              border: `1px solid ${openIncidents >= 3 ? "#ff222244" : "#ff660044"}`,
              borderRadius: "2px", padding: "1px 5px",
            }}>
              {openIncidents} inc
            </span>
          )}
          <span style={{ fontSize: "15px", fontWeight: "bold", color, fontFamily: FONT, lineHeight: 1 }}>
            {Math.round(health)}
          </span>
        </div>
      </div>

      {/* Health bar */}
      <div style={{ height: "2px", background: "#0f0f0f", borderRadius: "1px" }}>
        <div style={{
          height: "100%",
          width: `${health}%`,
          background: color,
          borderRadius: "1px",
          opacity: 0.65,
          transition: "width 0.4s ease",
        }} />
      </div>

      {/* Dataset count */}
      <span style={{ fontSize: "8px", color: "#252525", fontFamily: FONT }}>
        {datasetCount} dataset{datasetCount !== 1 ? "s" : ""}
      </span>

      {/* Assigned analyst tokens */}
      {assignedAnalysts.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "2px" }}>
          {assignedAnalysts.map((a) => (
            <AnalystToken key={a.id} analyst={a} onDragStart={onDragStart} />
          ))}
        </div>
      )}

      {/* Drop hint */}
      {dragOver && (
        <div style={{
          fontSize: "8px", color, fontFamily: FONT,
          textAlign: "center", opacity: 0.7, letterSpacing: "0.06em",
        }}>
          drop to assign
        </div>
      )}
    </div>
  );
}
