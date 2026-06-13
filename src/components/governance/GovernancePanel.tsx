import { useState } from "react";
import { useGameStore } from "../../state/store";
import type { PersonRoleType, DatasetQuality, DataClassification, PersonTrait } from "../../models/types";
import { showToast } from "../ui/ToastStack";
import { compositeQuality } from "../../engine/medallionEngine";
import { playSound } from "../../engine/soundEngine";
import { Avatar } from "../ui/Avatar";

const TRAIT_COLORS: Record<PersonTrait, string> = {
  methodical: "#00bfff",
  ambitious:  "#ffa500",
  veteran:    "#c8a800",
  reliable:   "#00ff88",
  transient:  "#ff6644",
};

interface Props {
  selectedDatasetId: string | null;
}

// ── colour helpers ────────────────────────────────────────────────────────────

function riskColor(risk: number) {
  if (risk > 70) return "#ff4444";
  if (risk > 40) return "#ffa500";
  return "#00ff88";
}

function qColor(v: number) {
  if (v < 35) return "#ff4444";
  if (v < 60) return "#ffa500";
  return "#00ff88";
}

// ── Quality dimension bar ─────────────────────────────────────────────────────

const DIMS: { key: keyof DatasetQuality; label: string }[] = [
  { key: "accuracy",     label: "Accuracy" },
  { key: "completeness", label: "Completeness" },
  { key: "consistency",  label: "Consistency" },
  { key: "uniqueness",   label: "Uniqueness" },
  { key: "timeliness",   label: "Timeliness" },
];

function QualityDimBar({ label, value }: { label: string; value: number }) {
  const color = qColor(value);
  return (
    <div style={{ marginBottom: "5px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
        <span style={{ fontSize: "9px", color: "#444", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ fontSize: "9px", color, fontFamily: "monospace" }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: "3px", background: "#111", borderRadius: "1px" }}>
        <div style={{
          height: "100%",
          width: `${value}%`,
          background: color,
          borderRadius: "1px",
          transition: "width 0.35s ease",
          opacity: 0.8,
        }} />
      </div>
    </div>
  );
}

// ── Pipeline position indicator ───────────────────────────────────────────────

type DataLayer = "bronze" | "silver" | "gold";

const PIPELINE_STEPS: { layer: DataLayer; label: string; color: string }[] = [
  { layer: "bronze", label: "Bronze", color: "#7a4a1e" },
  { layer: "silver", label: "Silver", color: "#666" },
  { layer: "gold",   label: "Gold",   color: "#c8a800" },
];

function PipelinePosition({ current }: { current: DataLayer }) {
  const currentIdx = PIPELINE_STEPS.findIndex((s) => s.layer === current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
      {PIPELINE_STEPS.map((step, i) => {
        const isActive = step.layer === current;
        const isDone   = i < currentIdx;
        return (
          <div key={step.layer} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              flex: 1,
            }}>
              <div style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: isActive ? step.color : isDone ? step.color + "66" : "#1a1a1a",
                border: `2px solid ${isActive ? step.color : isDone ? step.color + "44" : "#222"}`,
                boxShadow: isActive ? `0 0 6px ${step.color}66` : "none",
              }} />
              <span style={{
                fontSize: "8px",
                color: isActive ? step.color : isDone ? "#333" : "#1e1e1e",
                letterSpacing: "0.04em",
              }}>
                {step.label}
              </span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div style={{
                height: "2px",
                width: "12px",
                background: i < currentIdx ? "#2a2a2a" : "#141414",
                flexShrink: 0,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Role assignment row ───────────────────────────────────────────────────────

const ROLE_LABELS: Record<PersonRoleType, string> = {
  owner:     "Data Owner",
  steward:   "Data Steward",
  custodian: "Data Custodian",
};

const ROLE_DESC: Record<PersonRoleType, string> = {
  owner:
    "Accountable for business definition, policy compliance, and correct usage. Without an owner, accuracy decays and governance risk climbs unchecked each tick.",
  steward:
    "Enforces quality standards and business rules. Active stewards slow consistency decay and improve auto-fix outcomes. Required for Silver-layer data trust.",
  custodian:
    "Manages technical pipelines, schema, and access controls. Required for Bronze→Silver promotion. Without one, completeness decays and pipeline breaks go unpatched.",
};

const ROLE_TOAST: Record<PersonRoleType, string> = {
  owner:     "Data Owner assigned",
  steward:   "Data Steward assigned",
  custodian: "Data Custodian assigned",
};

// ── Main panel ────────────────────────────────────────────────────────────────

export function GovernancePanel({ selectedDatasetId }: Props) {
  const persons              = useGameStore((s) => s.persons);
  const catalogue            = useGameStore((s) => s.catalogue);
  const datasets             = useGameStore((s) => s.datasets);
  const tick                 = useGameStore((s) => s.tick);
  const assignGovernanceRole = useGameStore((s) => s.assignGovernanceRole);
  const toggleAutoFix        = useGameStore((s) => s.toggleAutoFix);
  const promoteDataset       = useGameStore((s) => s.promoteDataset);
  const setClassification    = useGameStore((s) => s.setClassification);
  const [expandedDesc, setExpandedDesc] = useState<PersonRoleType | null>(null);

  if (!selectedDatasetId) {
    return (
      <div style={{ color: "#1e1e1e", fontSize: "11px", paddingTop: "8px" }}>
        Select a dataset from the catalogue to inspect and assign governance.
      </div>
    );
  }

  const entry   = catalogue[selectedDatasetId];
  const dataset = datasets.find((d) => d.id === selectedDatasetId);
  if (!entry || !dataset) return null;

  const roleFields: { role: PersonRoleType; currentId?: string }[] = [
    { role: "owner",     currentId: entry.ownerId },
    { role: "steward",   currentId: entry.stewardId },
    { role: "custodian", currentId: entry.custodianId },
  ];

  // Build occupied-person map per role (persons already assigned to OTHER datasets)
  const getOccupied = (role: PersonRoleType): Map<string, string> => {
    const field = role === "owner" ? "ownerId" : role === "steward" ? "stewardId" : "custodianId";
    const map = new Map<string, string>();
    Object.values(catalogue).forEach((e) => {
      if (e.datasetId === selectedDatasetId) return;
      const pid = e[field];
      if (pid) map.set(pid, e.name);
    });
    return map;
  };

  const handleAssign = (role: PersonRoleType, personId: string | undefined) => {
    if (personId) {
      const occupied = getOccupied(role);
      if (occupied.has(personId)) {
        const fromDs = occupied.get(personId)!;
        showToast(`Reassigned from ${fromDs}`, "warning");
      } else {
        showToast(ROLE_TOAST[role]);
      }
    }
    assignGovernanceRole(selectedDatasetId, role, personId);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Dataset header */}
      <div style={{
        background: "#0c0c0c",
        border: "1px solid #1a1a1a",
        borderRadius: "3px",
        padding: "8px 10px",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "5px",
        }}>
          <span style={{ fontSize: "11px", color: "#d8d8d8", fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.name}
          </span>
          <span style={{
            fontSize: "8px",
            color: entry.status === "official" ? "#00ff88" : "#ffa500",
            border: `1px solid ${entry.status === "official" ? "#00ff8833" : "#ffa50033"}`,
            borderRadius: "2px",
            padding: "1px 5px",
            marginLeft: "6px",
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}>
            {entry.status}
          </span>
        </div>

        {/* Risk bar */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
          <span style={{ fontSize: "9px", color: "#333" }}>Governance Risk</span>
          <span style={{ fontSize: "10px", fontWeight: "bold", color: riskColor(entry.governanceRisk) }}>
            {entry.governanceRisk}%
          </span>
        </div>
        <div style={{ height: "3px", background: "#111", borderRadius: "2px", marginBottom: "6px" }}>
          <div style={{
            height: "100%",
            width: `${entry.governanceRisk}%`,
            background: riskColor(entry.governanceRisk),
            borderRadius: "2px",
            transition: "width 0.3s",
          }} />
        </div>

        {/* Auto-Fix toggle */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => toggleAutoFix(selectedDatasetId)}
            style={{
              background: dataset.autoFixEnabled ? "#001a0d" : "transparent",
              border: `1px solid ${dataset.autoFixEnabled ? "#00ff8844" : "#222"}`,
              color: dataset.autoFixEnabled ? "#00ff88" : "#333",
              borderRadius: "2px",
              padding: "2px 8px",
              fontSize: "9px",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.04em",
            }}
          >
            Auto-Fix {dataset.autoFixEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Data Classification */}
      {(() => {
        const cls = entry.classification;
        const CLASSIFICATIONS: { value: DataClassification; label: string; color: string; desc: string }[] = [
          { value: "public",       label: "Public",       color: "#00bfff", desc: "Freely shareable, no restrictions" },
          { value: "internal",     label: "Internal",     color: "#00ff88", desc: "Internal use only" },
          { value: "confidential", label: "Confidential", color: "#ffa500", desc: "Restricted access, breach risk if exposed" },
          { value: "restricted",   label: "Restricted",   color: "#ff4444", desc: "Highest protection required, custodian mandatory" },
        ];
        const isUnclassified = !cls;
        const createdAt = entry.createdAtTick ?? 0;
        const staleness = tick - createdAt;
        return (
          <div style={{
            background: "#0c0c0c",
            border: `1px solid ${isUnclassified && staleness > 5 ? "#ff444433" : "#1a1a1a"}`,
            borderRadius: "3px",
            padding: "8px 10px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
              <div style={{ fontSize: "9px", color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Data Classification
              </div>
              {isUnclassified && staleness > 5 && (
                <span style={{ fontSize: "8px", color: "#ff444488", letterSpacing: "0.04em" }}>
                  ⚠ unclassified
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "3px" }}>
              {CLASSIFICATIONS.map((c) => (
                <button
                  key={c.value}
                  title={c.desc}
                  onClick={() => {
                    setClassification(dataset.id, cls === c.value ? undefined : c.value);
                    showToast(`${entry.name} classified as ${c.label}`, "info");
                  }}
                  style={{
                    flex: 1,
                    background: cls === c.value ? "#0f0f0f" : "transparent",
                    border: `1px solid ${cls === c.value ? c.color + "88" : "#1a1a1a"}`,
                    color: cls === c.value ? c.color : "#252525",
                    fontFamily: "inherit",
                    fontSize: "7px",
                    padding: "3px 2px",
                    borderRadius: "2px",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Pipeline position + Promote */}
      <div style={{
        background: "#0c0c0c",
        border: "1px solid #1a1a1a",
        borderRadius: "3px",
        padding: "8px 10px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ fontSize: "9px", color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Pipeline Position
          </div>
          {(() => {
            const cq = compositeQuality(dataset.quality);
            const canPromote =
              (dataset.layer === "bronze" && cq > 65 && !!entry.custodianId) ||
              (dataset.layer === "silver" && cq > 80 && !!entry.ownerId && !!entry.stewardId);
            const isGold = dataset.layer === "gold";
            if (isGold) return (
              <span style={{ fontSize: "8px", color: "#a08800", letterSpacing: "0.04em" }}>● Gold</span>
            );
            const reason = dataset.layer === "bronze"
              ? !entry.custodianId ? "needs custodian" : "quality < 65"
              : !entry.ownerId || !entry.stewardId ? "needs owner + steward" : "quality < 80";
            return (
              <button
                onClick={() => {
                  if (!canPromote) return;
                  promoteDataset(dataset.id);
                  const toLayer = dataset.layer === "bronze" ? "Silver" : "Gold";
                  showToast(`${entry.name} promoted to ${toLayer}`, "success");
                  playSound(dataset.layer === "bronze" ? "promotion_silver" : "promotion_gold");
                }}
                title={canPromote ? `Promote to ${dataset.layer === "bronze" ? "Silver" : "Gold"}` : reason}
                style={{
                  background: canPromote ? "#001a0d" : "transparent",
                  border: `1px solid ${canPromote ? "#00ff8855" : "#1a1a1a"}`,
                  color: canPromote ? "#00ff88" : "#222",
                  fontFamily: "inherit",
                  fontSize: "8px",
                  padding: "2px 8px",
                  borderRadius: "2px",
                  cursor: canPromote ? "pointer" : "default",
                  letterSpacing: "0.05em",
                }}
              >
                {canPromote ? `Promote →` : `Promote (${reason})`}
              </button>
            );
          })()}
        </div>
        <PipelinePosition current={dataset.layer} />
      </div>

      {/* Quality dimensions */}
      <div style={{
        background: "#0c0c0c",
        border: "1px solid #1a1a1a",
        borderRadius: "3px",
        padding: "8px 10px",
      }}>
        <div style={{ fontSize: "9px", color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "7px" }}>
          Quality Dimensions
        </div>
        {DIMS.map((d) => (
          <QualityDimBar key={d.key} label={d.label} value={dataset.quality[d.key]} />
        ))}
      </div>

      {/* Governance role assignment */}
      <div style={{
        background: "#0c0c0c",
        border: "1px solid #1a1a1a",
        borderRadius: "3px",
        padding: "8px 10px",
      }}>
        <div style={{ fontSize: "9px", color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "7px" }}>
          Role Assignment
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {roleFields.map(({ role, currentId }) => {
            const eligible = persons.filter((p) => p.roleType === role);
            const current  = persons.find((p) => p.id === currentId);
            const occupied = getOccupied(role);
            return (
              <div
                key={role}
                style={{
                  borderLeft: `2px solid ${currentId ? "#00ff8833" : "#ff444433"}`,
                  paddingLeft: "7px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "9px", color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {ROLE_LABELS[role]}
                    </span>
                    <button
                      onClick={() => setExpandedDesc(expandedDesc === role ? null : role)}
                      title="What does this role do?"
                      style={{
                        background: "none",
                        border: "none",
                        color: expandedDesc === role ? "#555" : "#252525",
                        cursor: "pointer",
                        fontSize: "9px",
                        padding: "0",
                        lineHeight: 1,
                        fontFamily: "inherit",
                      }}
                    >
                      ⓘ
                    </button>
                  </div>
                  {current && (
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      {current.avatarIndex !== undefined && (
                        <Avatar index={current.avatarIndex} size={22} />
                      )}
                      <span style={{ fontSize: "9px", color: "#00ff88" }}>✓ {current.name}</span>
                      {current.trait && (
                        <span style={{
                          fontSize: "7px",
                          color: TRAIT_COLORS[current.trait],
                          border: `1px solid ${TRAIT_COLORS[current.trait]}44`,
                          borderRadius: "2px",
                          padding: "1px 4px",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}>
                          {current.trait}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {expandedDesc === role && (
                  <div style={{ fontSize: "8px", color: "#383838", marginBottom: "5px", lineHeight: "1.5" }}>
                    {ROLE_DESC[role]}
                  </div>
                )}
                <select
                  value={currentId ?? ""}
                  onChange={(e) => handleAssign(role, e.target.value || undefined)}
                  style={{
                    width: "100%",
                    background: "#090909",
                    color: "#777",
                    border: "1px solid #1e1e1e",
                    borderRadius: "2px",
                    padding: "3px 5px",
                    fontSize: "10px",
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <option value="">— Unassigned —</option>
                  {eligible.map((p) => {
                    const onDataset   = occupied.get(p.id);
                    const isInactive  = p.active === false;
                    const isDeparting = !!p.departsAtTick;
                    const ticksLeft   = isDeparting ? (p.departsAtTick! - tick) : null;
                    const traitTag    = p.trait ? ` [${p.trait}]` : "";
                    const suffix      = isInactive
                      ? " [on leave]"
                      : isDeparting
                      ? ` ⚠ leaving in ${ticksLeft}T`
                      : onDataset
                      ? ` — on: ${onDataset}`
                      : "";
                    return (
                      <option key={p.id} value={p.id} disabled={isInactive}>
                        {p.name}{traitTag} (gov:{p.skills.governance}){suffix}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
