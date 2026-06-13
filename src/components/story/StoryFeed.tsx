import { useGameStore } from "../../state/store";
import type { NarrativeEvent } from "../../models/types";

const FONT = "'Courier New', Courier, monospace";

const TYPE_ICONS: Record<NarrativeEvent["type"], string> = {
  story:       "◈",
  pressure:    "⚑",
  resolution:  "✓",
  initiative:  "⬡",
  milestone:   "★",
  warning:     "⚠",
  audit:       "⊛",
};

const SEVERITY_COLORS: Record<NarrativeEvent["severity"], string> = {
  critical: "#ff2222",
  high:     "#ff6600",
  medium:   "#ffa500",
  info:     "#383838",
};

export function StoryFeed() {
  const log = useGameStore((s) => s.narrativeLog);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ fontSize: "9px", color: "#6e6e6e", textTransform: "uppercase", letterSpacing: "0.14em", padding: "5px 12px", borderBottom: "1px solid #141414", flexShrink: 0 }}>
        Event Log
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {log.length === 0 && (
          <div style={{ fontSize: "8px", color: "#141414", fontFamily: FONT, padding: "8px 0" }}>
            The organisation is quiet. That will not last.
          </div>
        )}
        {log.slice(0, 80).map((event) => {
          const sColor = SEVERITY_COLORS[event.severity];
          const icon   = TYPE_ICONS[event.type];
          return (
            <div key={event.id} className="anim-row-appear" style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "8px", color: sColor, flexShrink: 0, marginTop: "1px" }}>{icon}</span>
              <div>
                <span style={{ fontSize: "8px", color: "#585858", fontFamily: FONT, marginRight: "6px" }}>T{event.tick}</span>
                <span style={{ fontSize: "8px", color: sColor, fontFamily: FONT }}>{event.title}</span>
                {event.body && event.body !== event.title && (
                  <div style={{ fontSize: "7px", color: "#585858", fontFamily: FONT, marginTop: "1px", lineHeight: 1.4 }}>
                    {event.body}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
