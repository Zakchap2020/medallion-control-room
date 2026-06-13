import type { StaffRole } from "../../models/types";
import { useGameStore } from "../../state/store";
import { DATASET_BY_ID } from "../../data/datasets";
import { compositeQuality, qualityColor, layerForState } from "../../engine/qualityUtils";
import { Avatar } from "../ui/Avatar";

const FONT = "'Courier New', Courier, monospace";

const LAYER_COLORS: Record<string, string>  = { bronze: "#7a4a1e", silver: "#888", gold: "#ffd700" };
const CLASSIF_COLORS: Record<string, string> = { public: "#00ff88", internal: "#00bfff", confidential: "#ffa500", restricted: "#ff4444" };

interface RoleSectionProps {
  role:      StaffRole;
  label:     string;
  hint:      string;
  currentId: string | undefined;
  onAssign:  (staffId: string | undefined) => void;
  available: number;
}

function RoleSection({ role, label, hint, currentId, onAssign, available }: RoleSectionProps) {
  const staff      = useGameStore((s) => s.staff);
  const candidates = staff.filter((m) => m.role === role && m.active);
  const current    = candidates.find((m) => m.id === currentId);

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "8px", color: "#6e6e6e", fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {label}
        </span>
        {currentId && available > 0 && (
          <button onClick={() => onAssign(undefined)} style={{ background: "none", border: "none", color: "#484848", cursor: "pointer", fontSize: "8px", fontFamily: FONT }}>
            clear
          </button>
        )}
      </div>

      {current ? (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 6px", background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: "2px" }}>
          <Avatar index={current.avatarIndex} size={22} />
          <div>
            <div style={{ fontSize: "9px", color: "#c0c0c0", fontFamily: FONT }}>{current.name}</div>
            <div style={{ fontSize: "7px", color: "#585858", fontFamily: FONT }}>{current.title}</div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "8px", color: "#484848", fontFamily: FONT, fontStyle: "italic", marginBottom: "4px" }}>{hint}</div>
      )}

      {!currentId && (
        <select
          disabled={available === 0}
          value=""
          onChange={(e) => { if (e.target.value) onAssign(e.target.value); }}
          style={{
            background: "#0a0a0a", border: "1px solid #1e1e1e",
            color: available > 0 ? "#909090" : "#484848",
            fontFamily: FONT, fontSize: "8px", padding: "4px 6px", borderRadius: "2px",
            width: "100%", cursor: available > 0 ? "pointer" : "not-allowed", marginTop: "4px",
          }}
        >
          <option value="" disabled>{available === 0 ? "No capacity" : `Assign ${label} (1 cap)…`}</option>
          {candidates.map((m) => (
            <option key={m.id} value={m.id}>{m.name} — {m.title}</option>
          ))}
        </select>
      )}
    </div>
  );
}

interface Props { selectedId: string | null; }

export function GovernancePanel({ selectedId }: Props) {
  const datasets      = useGameStore((s) => s.datasets);
  const assignRole    = useGameStore((s) => s.assignRole);
  const cycleCapacity = useGameStore((s) => s.cycleCapacity);
  const available     = cycleCapacity.total - cycleCapacity.used;

  if (!selectedId) {
    return (
      <div style={{ padding: "16px 12px", fontSize: "9px", color: "#484848", fontFamily: FONT, lineHeight: 1.8 }}>
        Select a dataset from the catalogue or domain map to inspect it and assign governance roles.
      </div>
    );
  }

  const ds = datasets[selectedId];
  const fd = DATASET_BY_ID[selectedId];
  if (!ds || !fd) return null;

  const cq     = compositeQuality(ds.quality);
  const qColor = qualityColor(cq);
  const layer  = layerForState(ds);
  const assign = (role: StaffRole) => (id: string | undefined) => assignRole(selectedId, role, id);

  const dims = [
    { key: "completeness" as const, label: "Completeness" },
    { key: "accuracy"     as const, label: "Accuracy" },
    { key: "consistency"  as const, label: "Consistency" },
    { key: "timeliness"   as const, label: "Timeliness" },
    { key: "validity"     as const, label: "Validity" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #141414" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "11px", color: "#c0c0c0", fontFamily: FONT, marginBottom: "2px" }}>{fd.name}</div>
            <div style={{ fontSize: "8px", color: "#585858", fontFamily: FONT }}>{fd.domain} · {fd.usageCount} users · importance {fd.stakeholderImportance}/10</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0, marginLeft: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: "bold", color: qColor, fontFamily: FONT, lineHeight: 1 }}>{cq}</span>
            <span style={{ fontSize: "8px", color: LAYER_COLORS[layer], fontFamily: FONT, textTransform: "uppercase" }}>{layer}</span>
          </div>
        </div>
        <div style={{ height: "2px", background: "#0a0a0a", borderRadius: "1px", marginBottom: "6px" }}>
          <div style={{ height: "100%", width: `${cq}%`, background: qColor, opacity: 0.65, transition: "width 0.3s" }} />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <span style={{ fontSize: "7px", color: CLASSIF_COLORS[fd.classification], background: CLASSIF_COLORS[fd.classification] + "18", border: `1px solid ${CLASSIF_COLORS[fd.classification]}44`, borderRadius: "2px", padding: "1px 5px", fontFamily: FONT, textTransform: "uppercase" }}>
            {fd.classification}
          </span>
          <span style={{ fontSize: "7px", color: ds.governanceRisk > 70 ? "#ff4444" : "#6e6e6e", fontFamily: FONT }}>risk {Math.round(ds.governanceRisk)}</span>
          <span style={{ fontSize: "7px", color: "#585858", fontFamily: FONT }}>{"★".repeat(fd.criticality)}</span>
        </div>
      </div>

      {/* Political charge */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #0e0e0e", background: "#080808" }}>
        <div style={{ fontSize: "8px", color: "#585858", fontFamily: FONT, fontStyle: "italic", lineHeight: 1.5 }}>"{fd.politicalCharge}"</div>
      </div>

      {/* Quality dims */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #141414" }}>
        <div style={{ fontSize: "8px", color: "#585858", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FONT, marginBottom: "7px" }}>Quality Dimensions</div>
        {dims.map(({ key, label }) => {
          const val = Math.round(ds.quality[key]);
          const c = qualityColor(val);
          return (
            <div key={key} style={{ marginBottom: "5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span style={{ fontSize: "8px", color: "#6e6e6e", fontFamily: FONT }}>{label}</span>
                <span style={{ fontSize: "8px", color: c, fontFamily: FONT }}>{val}</span>
              </div>
              <div style={{ height: "2px", background: "#0f0f0f", borderRadius: "1px" }}>
                <div style={{ height: "100%", width: `${val}%`, background: c, opacity: 0.6, transition: "width 0.3s" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Governance roles */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: "8px", color: "#585858", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: FONT, marginBottom: "8px" }}>
          Governance · {available} cap available this cycle
        </div>
        <RoleSection role="DataOwner"    label="Data Owner"    hint="No owner — accountability is undefined."         currentId={ds.ownerId}     onAssign={assign("DataOwner")}    available={available} />
        <RoleSection role="DataSteward"  label="Data Steward"  hint="No steward — quality definitions will drift."    currentId={ds.stewardId}   onAssign={assign("DataSteward")}  available={available} />
        <RoleSection role="DataCustodian" label="Data Custodian" hint="No custodian — access is uncontrolled."        currentId={ds.custodianId} onAssign={assign("DataCustodian")} available={available} />
        <RoleSection role="DataEngineer" label="Data Engineer"  hint="No engineer — pipeline drift will compound."    currentId={ds.engineerId}  onAssign={assign("DataEngineer")} available={available} />
      </div>

      {/* Upstream */}
      {fd.upstreamIds.length > 0 && (
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ fontSize: "8px", color: "#484848", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: FONT, marginBottom: "5px" }}>Upstream</div>
          {fd.upstreamIds.map((upId) => {
            const upFd = DATASET_BY_ID[upId];
            const upDs = datasets[upId];
            if (!upFd || !upDs) return null;
            const upQ = compositeQuality(upDs.quality);
            return (
              <div key={upId} style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#585858", fontFamily: FONT, padding: "2px 0" }}>
                <span>{upFd.name}</span>
                <span style={{ color: qualityColor(upQ) }}>{upQ}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
