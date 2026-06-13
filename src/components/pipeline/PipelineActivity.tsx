import { useGameStore } from "../../state/store";
import type { HealingEvent } from "../../models/types";

const ACTION_LABELS: Record<string, string> = {
  clean_nulls:               "Null Cleanse",
  deduplicate:               "Deduplication",
  standardise_schema:        "Schema Standardise",
  aggregate:                 "Aggregation",
  validate_governance_rules: "Governance Validate",
  auto_promoted:             "▲ Layer Promoted",
};

const LAYER_COLORS: Record<string, string> = {
  "Bronze → Silver": "#c0832a",
  "Silver → Gold":   "#ffd700",
};

function EventRow({ event }: { event: HealingEvent }) {
  const isPromotion = event.action === "auto_promoted";
  const noteColor = LAYER_COLORS[event.note ?? ""] ?? (event.success ? "#00ff88" : "#ff4444");

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "3px 0",
      borderBottom: "1px solid #111",
      fontSize: "10px",
    }}>
      {/* Success indicator */}
      <span style={{
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        background: event.success ? "#00ff88" : "#ff4444",
        flexShrink: 0,
      }} />

      {/* Action label */}
      <span style={{
        color: isPromotion ? noteColor : event.success ? "#666" : "#ff4444",
        fontWeight: isPromotion ? "bold" : "normal",
        minWidth: "128px",
      }}>
        {ACTION_LABELS[event.action] ?? event.action}
      </span>

      {/* Dataset name */}
      <span style={{
        color: "#333",
        fontFamily: "monospace",
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {event.datasetName}
      </span>

      {/* Note / quality delta */}
      <span style={{ color: noteColor, flexShrink: 0 }}>
        {event.note
          ? event.note
          : event.qualityDelta !== 0
          ? `${event.qualityDelta > 0 ? "+" : ""}${event.qualityDelta}`
          : "—"}
      </span>

      {/* Tick */}
      <span style={{ color: "#1e1e1e", fontSize: "9px", flexShrink: 0 }}>
        T{event.tick}
      </span>
    </div>
  );
}

export function PipelineActivity() {
  const healingEvents = useGameStore((s) => s.healingEvents);
  const datasets      = useGameStore((s) => s.datasets);

  const bronze = datasets.filter((d) => d.layer === "bronze").length;
  const silver = datasets.filter((d) => d.layer === "silver").length;
  const gold   = datasets.filter((d) => d.layer === "gold").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header with pipeline counts */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "9px",
        color: "#444",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: "6px",
        borderBottom: "1px solid #1a1a1a",
        paddingBottom: "5px",
        flexShrink: 0,
      }}>
        <span>Pipeline Activity</span>
        <div style={{ display: "flex", gap: "10px" }}>
          <span style={{ color: "#7a4a1e" }}>B:{bronze}</span>
          <span style={{ color: "#666" }}>S:{silver}</span>
          <span style={{ color: "#a08800" }}>G:{gold}</span>
        </div>
      </div>

      {/* Event feed */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {healingEvents.length === 0 && (
          <div style={{ color: "#1e1e1e", fontSize: "10px", paddingTop: "4px" }}>
            Auto-fix initialising…
          </div>
        )}
        {healingEvents.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}
