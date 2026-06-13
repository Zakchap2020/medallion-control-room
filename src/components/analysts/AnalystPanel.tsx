import { useGameStore } from "../../state/store";
import type { Department } from "../../models/types";

const DEPARTMENTS: Department[] = ["Finance", "Sales", "Marketing", "HR", "Operations"];

export function AnalystPanel() {
  const analysts = useGameStore((s) => s.analysts);
  const assignAnalyst = useGameStore((s) => s.assignAnalyst);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", flex: 1 }}>
      {analysts.map((analyst) => (
        <div
          key={analyst.id}
          style={{
            background: "#111",
            border: "1px solid #1e1e1e",
            borderRadius: "3px",
            padding: "10px",
          }}
        >
          <div style={{ color: "#e0e0e0", fontWeight: "bold", fontSize: "12px", marginBottom: "5px" }}>
            {analyst.name}
          </div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "8px", fontSize: "10px" }}>
            <span style={{ color: "#555" }}>
              Analysis <span style={{ color: "#00bfff" }}>{analyst.skills.analysis}</span>
            </span>
            <span style={{ color: "#555" }}>
              Gov <span style={{ color: "#00ff88" }}>{analyst.skills.governance}</span>
            </span>
          </div>
          <select
            value={analyst.assignedDepartment ?? ""}
            onChange={(e) =>
              assignAnalyst(analyst.id, (e.target.value as Department) || undefined)
            }
            style={{
              width: "100%",
              background: "#0a0a0a",
              color: "#c0c0c0",
              border: "1px solid #2a2a2a",
              borderRadius: "2px",
              padding: "4px 6px",
              fontSize: "11px",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="">— Unassigned —</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
