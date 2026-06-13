import { useState } from "react";
import { useGameStore } from "../../state/store";
import type { Department, Incident, Dataset } from "../../models/types";
import { departmentHealth } from "../../engine/orgMapEngine";
import { DepartmentZone } from "./DepartmentZone";
import { DepartmentDrillDown } from "./DepartmentDrillDown";
import { AnalystToken } from "./AnalystToken";

const FONT = "'Courier New', Courier, monospace";
const DEPARTMENTS: Department[] = ["Finance", "Sales", "Marketing", "HR", "Operations"];

function incidentCount(dept: Department, incidents: Incident[], datasets: Dataset[]): number {
  const ids = new Set(datasets.filter((d) => d.department === dept).map((d) => d.id));
  return incidents.filter(
    (i) =>
      (i.status === "open" || i.status === "in_progress") &&
      i.affectedDatasetIds.some((id) => ids.has(id))
  ).length;
}

export function OrgMapPanel() {
  const state         = useGameStore((s) => s);
  const analysts      = useGameStore((s) => s.analysts);
  const datasets      = useGameStore((s) => s.datasets);
  const incidents     = useGameStore((s) => s.incidents);
  const assignAnalyst = useGameStore((s) => s.assignAnalyst);

  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const handleDragStart = (e: React.DragEvent, analystId: string) => {
    e.dataTransfer.setData("analystId", analystId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleZoneDrop = (analystId: string, dept: Department) => {
    assignAnalyst(analystId, dept);
  };

  const handleBenchDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const analystId = e.dataTransfer.getData("analystId");
    if (analystId) assignAnalyst(analystId, undefined);
  };

  const toggleDept = (dept: Department) =>
    setSelectedDept((prev) => (prev === dept ? null : dept));

  const unassigned = analysts.filter((a) => !a.assignedDepartment);

  // Zone grid: 2 columns — Finance/Sales, Marketing/HR, Operations (full width)
  const zoneGrid: Array<{ dept: Department; span?: boolean }> = [
    { dept: "Finance" },
    { dept: "Sales" },
    { dept: "Marketing" },
    { dept: "HR" },
    { dept: "Operations", span: true },
  ];

  return (
    <div style={{
      flex: 1,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      position: "relative",
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
        <span>Organisation Map</span>
        {selectedDept && (
          <span style={{ color: "#252525", fontSize: "8px", letterSpacing: "0.08em" }}>
            {selectedDept} — click zone or ✕ to close
          </span>
        )}
      </div>

      {/* Department grid */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridAutoRows: "1fr",
        gap: "8px",
        padding: "10px 10px 6px",
        overflow: "hidden",
      }}>
        {zoneGrid.map(({ dept, span }) => (
          <div key={dept} style={span ? { gridColumn: "1 / -1" } : {}}>
            <DepartmentZone
              department={dept}
              health={departmentHealth(dept, state)}
              datasetCount={datasets.filter((d) => d.department === dept).length}
              openIncidents={incidentCount(dept, incidents, datasets)}
              assignedAnalysts={analysts.filter((a) => a.assignedDepartment === dept)}
              onDrop={handleZoneDrop}
              onDragStart={handleDragStart}
              onClick={() => toggleDept(dept)}
              isSelected={selectedDept === dept}
            />
          </div>
        ))}
      </div>

      {/* Analyst bench */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleBenchDrop}
        style={{
          flexShrink: 0,
          borderTop: "1px solid #141414",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minHeight: "46px",
          background: "#060606",
        }}
      >
        <span style={{
          fontSize: "8px", color: "#1e1e1e", textTransform: "uppercase",
          letterSpacing: "0.1em", fontFamily: FONT, flexShrink: 0,
        }}>
          Bench
        </span>
        {unassigned.length === 0 ? (
          <span style={{ fontSize: "8px", color: "#141414", fontFamily: FONT }}>
            all analysts deployed
          </span>
        ) : (
          unassigned.map((a) => (
            <AnalystToken key={a.id} analyst={a} onDragStart={handleDragStart} />
          ))
        )}
        <span style={{
          marginLeft: "auto", fontSize: "8px", color: "#151515", fontFamily: FONT,
        }}>
          drag to zone · drag here to unassign
        </span>
      </div>

      {/* Drill-down overlay */}
      {selectedDept && (
        <DepartmentDrillDown
          department={selectedDept}
          onClose={() => setSelectedDept(null)}
        />
      )}
    </div>
  );
}
