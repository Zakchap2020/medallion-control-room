import { useGameStore } from "../../state/store";

const DEPT_COLORS: Record<string, string> = {
  Finance: "#ffd700",
  Sales: "#00bfff",
  Marketing: "#ff69b4",
  HR: "#98fb98",
  Operations: "#ffa500",
};

export function DatasetCatalogue() {
  const datasets = useGameStore((s) => s.datasets);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", flex: 1 }}>
      <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
        {datasets.length} dataset{datasets.length !== 1 ? "s" : ""} ingested
      </div>
      {datasets.length === 0 && (
        <div style={{ color: "#444", fontStyle: "italic", fontSize: "13px", marginTop: "12px" }}>
          No datasets yet. Run a tick to begin ingestion.
        </div>
      )}
      {[...datasets].reverse().map((ds) => (
        <div
          key={ds.id}
          style={{
            background: "#111",
            border: "1px solid #222",
            borderLeft: `3px solid ${DEPT_COLORS[ds.department] ?? "#555"}`,
            borderRadius: "3px",
            padding: "8px 10px",
            fontSize: "12px",
          }}
        >
          <div style={{ fontFamily: "monospace", color: "#e0e0e0", marginBottom: "3px" }}>
            {ds.name}
          </div>
          <div style={{ display: "flex", gap: "12px", color: "#666", fontSize: "11px" }}>
            <span style={{ color: DEPT_COLORS[ds.department] }}>{ds.department}</span>
            <span>BRONZE</span>
            <span>{ds.recordCount.toLocaleString()} rows</span>
          </div>
        </div>
      ))}
    </div>
  );
}
