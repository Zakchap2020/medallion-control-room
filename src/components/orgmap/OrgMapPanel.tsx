import { useState } from "react";
import { useGameStore } from "../../state/store";
import type { Department, Incident, Dataset, Analyst } from "../../models/types";
import { departmentHealth } from "../../engine/orgMapEngine";
import { DepartmentZone } from "./DepartmentZone";
import { DepartmentDrillDown } from "./DepartmentDrillDown";
import { Avatar } from "../ui/Avatar";

const FONT = "'Courier New', Courier, monospace";

const DEPT_COLORS: Record<string, string> = {
  Finance: "#ffd700", Sales: "#00bfff", Marketing: "#ff69b4",
  HR: "#98fb98", Operations: "#ffa500",
};

function SkillRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: "3px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
        <span style={{ fontSize: "7px", color: "#252525", fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <span style={{ fontSize: "7px", color: "#333", fontFamily: FONT }}>{value}</span>
      </div>
      <div style={{ height: "2px", background: "#111", borderRadius: "1px" }}>
        <div style={{
          height: "100%", width: `${value}%`, background: color,
          borderRadius: "1px", opacity: 0.6, transition: "width 0.3s",
        }} />
      </div>
    </div>
  );
}

function BenchCard({
  analyst,
  onDragStart,
}: {
  analyst: Analyst;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const isDeployed = !!analyst.assignedDepartment;
  const deptColor  = isDeployed ? (DEPT_COLORS[analyst.assignedDepartment!] ?? "#555") : "#1e1e1e";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, analyst.id)}
      style={{
        flexShrink: 0,
        width: "118px",
        background: isDeployed ? "#0d0d0d" : "#0a0a0a",
        border: `1px solid ${isDeployed ? deptColor + "44" : "#1a1a1a"}`,
        borderLeft: `2px solid ${deptColor}`,
        borderRadius: "3px",
        padding: "7px 8px",
        cursor: "grab",
        userSelect: "none",
        opacity: analyst.active === false ? 0.35 : 1,
      }}
    >
      {/* Avatar + name row */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "7px" }}>
        {analyst.avatarIndex !== undefined
          ? <Avatar index={analyst.avatarIndex} size={26} />
          : <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1a1a1a" }} />
        }
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: "9px", color: "#c0c0c0", fontFamily: FONT,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {analyst.name.split(" ")[0]}
          </div>
          <div style={{
            fontSize: "8px", color: "#303030", fontFamily: FONT,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {analyst.name.split(" ")[1] ?? ""}
          </div>
        </div>
      </div>

      <SkillRow label="Analysis" value={analyst.skills.analysis} color="#00bfff" />
      <SkillRow label="Gov"      value={analyst.skills.governance} color="#00ff88" />

      {/* Deployment badge */}
      <div style={{
        marginTop: "5px", fontSize: "7px",
        color: isDeployed ? deptColor : "#1a1a1a",
        fontFamily: FONT, letterSpacing: "0.05em", textTransform: "uppercase",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {isDeployed ? `● ${analyst.assignedDepartment}` : "undeployed"}
      </div>
    </div>
  );
}

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

      {/* Analyst roster */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleBenchDrop}
        style={{
          flexShrink: 0,
          borderTop: "1px solid #141414",
          background: "#060606",
        }}
      >
        <div style={{
          fontSize: "8px", color: "#1e1e1e", textTransform: "uppercase",
          letterSpacing: "0.12em", fontFamily: FONT,
          padding: "5px 10px 4px",
          borderBottom: "1px solid #0e0e0e",
        }}>
          Analysts — drag to deploy
        </div>
        <div style={{
          display: "flex",
          gap: "6px",
          padding: "8px 10px",
          overflowX: "auto",
        }}>
          {analysts.map((analyst) => (
            <BenchCard key={analyst.id} analyst={analyst} onDragStart={handleDragStart} />
          ))}
        </div>
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
