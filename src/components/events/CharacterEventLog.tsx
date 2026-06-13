import { useGameStore } from "../../state/store";

export function CharacterEventLog() {
  const characterEvents = useGameStore((s) => s.characterEvents);
  const tick            = useGameStore((s) => s.tick);

  if (characterEvents.length === 0) {
    return (
      <div style={{ color: "#1a1a1a", fontSize: "11px", paddingTop: "6px" }}>
        No events yet. Assign governance roles to your team to start generating activity.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
        {characterEvents.map((event, i) => {
          // Rough age: newest first, so index 0 = current tick
          const age = i;
          const isRecent = age === 0;

          return (
            <div
              key={i}
              className={isRecent ? "anim-row-appear" : ""}
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
                padding: "5px 8px",
                background: isRecent ? "#0c0c10" : "transparent",
                border: isRecent ? "1px solid #1e1e2a" : "1px solid transparent",
                borderLeft: `2px solid ${isRecent ? "#6644aa" : "#1a1a22"}`,
                borderRadius: "2px",
                fontSize: "10px",
                lineHeight: "1.5",
              }}
            >
              <span style={{
                color: "#2a2a3a",
                fontFamily: "monospace",
                fontSize: "9px",
                flexShrink: 0,
                marginTop: "1px",
              }}>
                T{tick - age}
              </span>
              <span style={{ color: isRecent ? "#9988cc" : "#333", flex: 1 }}>
                {event}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
