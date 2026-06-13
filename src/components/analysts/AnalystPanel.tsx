import { useGameStore } from "../../state/store";
import type { Department } from "../../models/types";
import { Avatar } from "../ui/Avatar";

const DEPARTMENTS: Department[] = ["Finance", "Sales", "Marketing", "HR", "Operations"];

const DEPT_COLORS: Record<string, string> = {
  Finance:    "#ffd700",
  Sales:      "#00bfff",
  Marketing:  "#ff69b4",
  HR:         "#98fb98",
  Operations: "#ffa500",
};

export function AnalystPanel() {
  const analysts      = useGameStore((s) => s.analysts);
  const assignAnalyst = useGameStore((s) => s.assignAnalyst);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      {analysts.map((analyst) => {
        const deptColor = analyst.assignedDepartment
          ? DEPT_COLORS[analyst.assignedDepartment] ?? "#555"
          : "#1e1e1e";
        const isAssigned = !!analyst.assignedDepartment;

        return (
          <div
            key={analyst.id}
            style={{
              background: "#0c0c0c",
              border: `1px solid ${isAssigned ? deptColor + "22" : "#141414"}`,
              borderLeft: `2px solid ${isAssigned ? deptColor : "#1e1e1e"}`,
              borderRadius: "3px",
              padding: "7px 9px",
            }}
          >
            {/* Avatar + name + status */}
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
              {analyst.avatarIndex !== undefined && (
                <Avatar index={analyst.avatarIndex} size={30} />
              )}
              <span style={{ color: "#c0c0c0", fontSize: "11px", flex: 1 }}>{analyst.name}</span>
              {isAssigned && (
                <span style={{ fontSize: "8px", color: deptColor, letterSpacing: "0.05em" }}>
                  ● {analyst.assignedDepartment}
                </span>
              )}
            </div>

            {/* Skill bars */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
              <SkillPip label="Analysis" value={analyst.skills.analysis} color="#00bfff" />
              <SkillPip label="Gov" value={analyst.skills.governance} color="#00ff88" />
            </div>

            {/* Department selector */}
            <select
              value={analyst.assignedDepartment ?? ""}
              onChange={(e) =>
                assignAnalyst(analyst.id, (e.target.value as Department) || undefined)
              }
              style={{
                width: "100%",
                background: "#090909",
                color: isAssigned ? deptColor : "#333",
                border: "1px solid #1a1a1a",
                borderRadius: "2px",
                padding: "3px 6px",
                fontSize: "10px",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <option value="">— Unmonitored —</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}

function SkillPip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
        <span style={{ fontSize: "8px", color: "#2a2a2a", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ fontSize: "8px", color, fontFamily: "monospace" }}>{value}</span>
      </div>
      <div style={{ height: "2px", background: "#111", borderRadius: "1px" }}>
        <div style={{
          height: "100%",
          width: `${(value / 10) * 100}%`,
          background: color,
          borderRadius: "1px",
          opacity: 0.6,
        }} />
      </div>
    </div>
  );
}
