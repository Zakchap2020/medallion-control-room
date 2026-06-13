import type { Analyst } from "../../models/types";
import { Avatar } from "../ui/Avatar";

const FONT = "'Courier New', Courier, monospace";

interface Props {
  analyst: Analyst;
  onDragStart: (e: React.DragEvent, analystId: string) => void;
}

export function AnalystToken({ analyst, onDragStart }: Props) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, analyst.id)}
      title={`${analyst.name} — drag to assign`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        background: "#0d0d0d",
        border: "1px solid #1e1e1e",
        borderRadius: "3px",
        padding: "3px 7px 3px 4px",
        cursor: "grab",
        userSelect: "none",
        opacity: analyst.active === false ? 0.35 : 1,
        flexShrink: 0,
      }}
    >
      {analyst.avatarIndex !== undefined && (
        <Avatar index={analyst.avatarIndex} size={22} />
      )}
      <span style={{ fontSize: "9px", color: "#888", fontFamily: FONT, whiteSpace: "nowrap" }}>
        {analyst.name.split(" ")[0]}
      </span>
    </div>
  );
}
