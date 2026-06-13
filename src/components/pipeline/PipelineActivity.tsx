import { useGameStore } from "../../state/store";
import type { HealingEvent } from "../../models/types";

const ACTION_LABELS: Record<string, string> = {
  clean_nulls:               "Null Cleanse",
  deduplicate:               "Deduplication",
  standardise_schema:        "Schema Std",
  aggregate:                 "Aggregation",
  validate_governance_rules: "Gov Validate",
  auto_promoted:             "▲ Promoted",
};

const LAYER_COLORS: Record<string, string> = {
  "Bronze → Silver": "#c0832a",
  "Silver → Gold":   "#c8a800",
};

function EventRow({ event }: { event: HealingEvent }) {
  const isPromotion = event.action === "auto_promoted";
  const noteColor   = LAYER_COLORS[event.note ?? ""] ?? (event.success ? "#00ff88" : "#ff4444");

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "3px 0",
      borderBottom: "1px solid #0d0d0d",
      fontSize: "9px",
    }}>
      {/* Status dot */}
      <span style={{
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        background: event.success ? "#00ff88" : "#ff4444",
        flexShrink: 0,
        display: "inline-block",
        opacity: 0.7,
      }} />

      {/* Action label */}
      <span style={{
        color: isPromotion ? noteColor : event.success ? "#444" : "#ff4444",
        fontWeight: isPromotion ? "bold" : "normal",
        minWidth: "100px",
        letterSpacing: "0.03em",
      }}>
        {ACTION_LABELS[event.action] ?? event.action}
      </span>

      {/* Dataset name */}
      <span style={{
        color: "#222",
        fontFamily: "monospace",
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {event.datasetName}
      </span>

      {/* Delta / note */}
      <span style={{ color: noteColor, flexShrink: 0, fontFamily: "monospace" }}>
        {event.note
          ? event.note
          : event.qualityDelta !== 0
          ? `${event.qualityDelta > 0 ? "+" : ""}${event.qualityDelta}`
          : "—"}
      </span>

      {/* Tick */}
      <span style={{ color: "#1a1a1a", fontFamily: "monospace", flexShrink: 0 }}>
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

  const promotions = healingEvents.filter((e) => e.action === "auto_promoted").length;
  const failures   = healingEvents.filter((e) => !e.success).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Layer summary */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "7px",
        flexShrink: 0,
        fontSize: "9px",
      }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <span style={{ color: "#4a2a0e" }}>B:{bronze}</span>
          <span style={{ color: "#444" }}>S:{silver}</span>
          <span style={{ color: gold > 0 ? "#a08800" : "#222" }}>G:{gold}</span>
        </div>
        <div style={{ display: "flex", gap: "10px", color: "#1e1e1e" }}>
          {promotions > 0 && <span style={{ color: "#c8a80066" }}>{promotions}↑</span>}
          {failures   > 0 && <span style={{ color: "#ff444444" }}>{failures}✗</span>}
        </div>
      </div>

      {/* Event feed */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {healingEvents.length === 0 && (
          <div style={{ color: "#1a1a1a", fontSize: "10px" }}>Auto-fix not yet active.</div>
        )}
        {healingEvents.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}
