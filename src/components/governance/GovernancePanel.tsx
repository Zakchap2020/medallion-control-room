import { useGameStore } from "../../state/store";
import type { PersonRoleType, DatasetQuality } from "../../models/types";
import { showToast } from "../ui/ToastStack";

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
  owner:     "Accountable for meaning & correctness",
  steward:   "Responsible for quality & consistency",
  custodian: "Manages technical implementation",
};

const ROLE_TOAST: Record<PersonRoleType, string> = {
  owner:     "Data Owner assigned",
  steward:   "Data Steward assigned",
  custodian: "Data Custodian assigned",
};

// ── Main panel ────────────────────────────────────────────────────────────────

export function GovernancePanel({ selectedDatasetId }: Props) {
  const persons            = useGameStore((s) => s.persons);
  const catalogue          = useGameStore((s) => s.catalogue);
  const datasets           = useGameStore((s) => s.datasets);
  const assignGovernanceRole = useGameStore((s) => s.assignGovernanceRole);
  const toggleAutoFix       = useGameStore((s) => s.toggleAutoFix);

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

  const handleAssign = (role: PersonRoleType, personId: string | undefined) => {
    assignGovernanceRole(selectedDatasetId, role, personId);
    if (personId) showToast(ROLE_TOAST[role]);
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

      {/* Pipeline position */}
      <div style={{
        background: "#0c0c0c",
        border: "1px solid #1a1a1a",
        borderRadius: "3px",
        padding: "8px 10px",
      }}>
        <div style={{ fontSize: "9px", color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
          Pipeline Position
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
            return (
              <div
                key={role}
                style={{
                  borderLeft: `2px solid ${currentId ? "#00ff8833" : "#ff444433"}`,
                  paddingLeft: "7px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "9px", color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {ROLE_LABELS[role]}
                  </span>
                  {current && (
                    <span style={{ fontSize: "9px", color: "#00ff88" }}>✓ {current.name}</span>
                  )}
                </div>
                <div style={{ fontSize: "8px", color: "#222", marginBottom: "4px" }}>{ROLE_DESC[role]}</div>
                <select
                  value={currentId ?? ""}
                  onChange={(e) => handleAssign(role, e.target.value || undefined)}
                  style={{
                    width: "100%",
                    background: "#090909",
                    color: "#888",
                    border: "1px solid #1e1e1e",
                    borderRadius: "2px",
                    padding: "3px 5px",
                    fontSize: "10px",
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <option value="">— Unassigned —</option>
                  {eligible.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (gov:{p.skills.governance})
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
