import { useGameStore } from "../../state/store";
import type { PersonRoleType } from "../../models/types";

interface Props {
  selectedDatasetId: string | null;
}

function riskColor(risk: number) {
  if (risk > 70) return "#ff4444";
  if (risk > 40) return "#ffa500";
  return "#00ff88";
}

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

export function GovernancePanel({ selectedDatasetId }: Props) {
  const persons = useGameStore((s) => s.persons);
  const catalogue = useGameStore((s) => s.catalogue);
  const datasets = useGameStore((s) => s.datasets);
  const assignGovernanceRole = useGameStore((s) => s.assignGovernanceRole);
  const toggleAutoFix = useGameStore((s) => s.toggleAutoFix);

  if (!selectedDatasetId) {
    return (
      <div style={{ color: "#2a2a2a", fontSize: "11px", paddingTop: "8px", fontStyle: "italic" }}>
        Select a dataset to assign governance roles.
      </div>
    );
  }

  const entry = catalogue[selectedDatasetId];
  const dataset = datasets.find((d) => d.id === selectedDatasetId);
  if (!entry || !dataset) return null;

  const roleFields: { role: PersonRoleType; currentId?: string }[] = [
    { role: "owner",     currentId: entry.ownerId },
    { role: "steward",   currentId: entry.stewardId },
    { role: "custodian", currentId: entry.custodianId },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Dataset header */}
      <div style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: "3px",
        padding: "8px 10px",
      }}>
        <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#e0e0e0", marginBottom: "5px" }}>
          {entry.name}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
          <span style={{ fontSize: "10px", color: "#444" }}>Governance Risk</span>
          <span style={{ fontSize: "12px", fontWeight: "bold", color: riskColor(entry.governanceRisk) }}>
            {entry.governanceRisk}%
          </span>
        </div>
        <div style={{ height: "3px", background: "#1a1a1a", borderRadius: "2px" }}>
          <div style={{
            height: "100%",
            width: `${entry.governanceRisk}%`,
            background: riskColor(entry.governanceRisk),
            borderRadius: "2px",
            transition: "width 0.3s",
          }} />
        </div>
        <div style={{ marginTop: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "9px", color: "#333", textTransform: "uppercase" }}>
            Status: <span style={{ color: entry.status === "official" ? "#00ff88" : "#ffa500" }}>
              {entry.status}
            </span>
          </span>
          <button
            onClick={() => toggleAutoFix(selectedDatasetId)}
            style={{
              background: dataset.autoFixEnabled ? "#001a0d" : "transparent",
              border: `1px solid ${dataset.autoFixEnabled ? "#00ff88" : "#333"}`,
              color: dataset.autoFixEnabled ? "#00ff88" : "#444",
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

      {/* Role assignment rows */}
      {roleFields.map(({ role, currentId }) => {
        const eligible = persons.filter((p) => p.roleType === role);
        const current = persons.find((p) => p.id === currentId);
        return (
          <div key={role} style={{
            background: "#0f0f0f",
            border: `1px solid ${currentId ? "#1e3a1e" : "#2a1a1a"}`,
            borderLeft: `2px solid ${currentId ? "#00ff88" : "#ff4444"}`,
            borderRadius: "3px",
            padding: "8px 10px",
          }}>
            <div style={{ fontSize: "10px", color: "#555", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {ROLE_LABELS[role]}
            </div>
            <div style={{ fontSize: "9px", color: "#333", marginBottom: "6px" }}>
              {ROLE_DESC[role]}
            </div>
            {current && (
              <div style={{ fontSize: "10px", color: "#c0c0c0", marginBottom: "5px" }}>
                ✓ {current.name}
                <span style={{ color: "#333", marginLeft: "6px" }}>
                  gov:{current.skills.governance}
                </span>
              </div>
            )}
            <select
              value={currentId ?? ""}
              onChange={(e) =>
                assignGovernanceRole(selectedDatasetId, role, e.target.value || undefined)
              }
              style={{
                width: "100%",
                background: "#0a0a0a",
                color: "#c0c0c0",
                border: "1px solid #2a2a2a",
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
  );
}
