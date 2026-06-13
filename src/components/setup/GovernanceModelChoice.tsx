import type { GovernanceModel } from "../../models/types";
import { useGameStore } from "../../state/store";

const FONT = "'Courier New', Courier, monospace";

interface ModelCard {
  model: GovernanceModel;
  label: string;
  capacity: string;
  tagline: string;
  traits: string[];
  color: string;
  warning: string;
}

const MODELS: ModelCard[] = [
  {
    model: "centralised",
    label: "Centralised",
    capacity: "4 capacity / cycle",
    tagline: "Central authority. Strong control. Slower delivery.",
    traits: ["Lower KPI conflict risk", "Bottleneck risk as org grows", "High consistency of definitions", "Slower stakeholder response"],
    color: "#00bfff",
    warning: "Stakeholders may grow impatient with slower turnaround.",
  },
  {
    model: "federated",
    label: "Federated",
    capacity: "6 capacity / cycle",
    tagline: "Distributed accountability. More action, more risk.",
    traits: ["Highest starting capacity", "Higher KPI conflict frequency", "Domains own their governance", "More silo risk over time"],
    color: "#00ff88",
    warning: "Without strong cross-domain coordination, definitions will diverge.",
  },
  {
    model: "platform_led",
    label: "Platform-Led",
    capacity: "3 → 8 capacity / cycle",
    tagline: "Engineering-first. Slow start. Highest ceiling.",
    traits: ["Lowest early capacity", "Capacity grows with initiatives", "Strongest long-term stability", "Requires upfront investment"],
    color: "#ffd700",
    warning: "The first few cycles will be difficult. Invest early in infrastructure.",
  },
];

export function GovernanceModelChoice() {
  const startGame = useGameStore((s) => s.startGame);

  return (
    <div style={{
      height: "100vh",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT,
      padding: "40px 20px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div style={{ fontSize: "11px", color: "#6e6e6e", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>
          Medallion Protocol
        </div>
        <div style={{ fontSize: "28px", color: "#c0c0c0", letterSpacing: "0.04em", marginBottom: "16px" }}>
          Choose Your Governance Model
        </div>
        <div style={{ fontSize: "12px", color: "#6e6e6e", maxWidth: "560px", lineHeight: 1.6 }}>
          You have just been hired as Chief Data Officer. The company's data is broken. Your governance model will
          define your capacity, your constraints, and the political landscape you will navigate.
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: "24px", maxWidth: "980px", width: "100%" }}>
        {MODELS.map((m) => (
          <div key={m.model} style={{
            flex: 1,
            background: "#0d0d0d",
            border: `1px solid ${m.color}22`,
            borderTop: `2px solid ${m.color}`,
            borderRadius: "4px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}>
            <div>
              <div style={{ fontSize: "14px", color: m.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>
                {m.label}
              </div>
              <div style={{ fontSize: "10px", color: m.color + "88", fontFamily: FONT, letterSpacing: "0.06em" }}>
                {m.capacity}
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#888", lineHeight: 1.5 }}>
              {m.tagline}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {m.traits.map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ color: m.color, fontSize: "8px", flexShrink: 0, marginTop: "2px" }}>▸</span>
                  <span style={{ fontSize: "10px", color: "#909090", lineHeight: 1.4 }}>{t}</span>
                </div>
              ))}
            </div>

            <div style={{
              fontSize: "9px",
              color: "#6e6e6e",
              borderTop: "1px solid #141414",
              paddingTop: "12px",
              lineHeight: 1.5,
              fontStyle: "italic",
            }}>
              {m.warning}
            </div>

            <button
              onClick={() => startGame(m.model)}
              style={{
                marginTop: "auto",
                background: m.color + "18",
                border: `1px solid ${m.color}44`,
                color: m.color,
                fontFamily: FONT,
                fontSize: "11px",
                padding: "10px 0",
                borderRadius: "3px",
                cursor: "pointer",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = m.color + "28"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = m.color + "18"; }}
            >
              Select — {m.label}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "32px", fontSize: "9px", color: "#484848", textAlign: "center", lineHeight: 1.8 }}>
        Capacity refreshes every 15 ticks · Each action costs capacity · Strategic initiatives consume capacity over multiple cycles
      </div>
    </div>
  );
}
