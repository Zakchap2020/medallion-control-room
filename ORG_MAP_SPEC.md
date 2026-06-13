# Org Map Department View — Feature Spec

## Overview

Replace the Silo Monitor centre panel with a spatial org map showing all 5 departments as interactive, colour-coded health zones. Analysts are draggable tokens dropped onto zones to assign them. Clicking a zone opens a drill-down with datasets, incidents, silos, and governance detail for that department.

## Layout

```
┌─────────────────────────────────────────┐
│  [ Finance ]          [ Sales ]         │
│                                         │
│           [ Operations ]                │
│                                         │
│  [ Marketing ]        [ HR ]            │
│                                         │
│  ── Analyst Bench ─────────────────── │
│  [ Ana M. ] [ Ben O. ] [ Priya S. ]    │
└─────────────────────────────────────────┘
```

Each zone shows: department name, health score (0–100), dataset count, active incident badge. Analysts on the bench are unassigned; drag one onto a zone to assign.

## Health Score Formula

```typescript
// src/engine/orgMapEngine.ts
function departmentHealth(dept: Department, state: GameState): number {
  const deptDatasets   = state.datasets.filter(d => d.department === dept);
  const deptCatalogue  = deptDatasets.map(d => state.catalogue[d.id]).filter(Boolean);
  const avgQuality     = deptDatasets.length > 0
    ? deptDatasets.reduce((s, d) => s + compositeQuality(d.quality), 0) / deptDatasets.length
    : 50;
  const ungovernedPct  = deptCatalogue.length > 0
    ? deptCatalogue.filter(e => !e.ownerId).length / deptCatalogue.length
    : 0;
  const openIncidents  = state.incidents.filter(
    i => i.affectedDatasetIds.some(id => deptDatasets.find(d => d.id === id))
      && (i.status === "open" || i.status === "in_progress")
  ).length;
  return Math.max(0, Math.min(100,
    avgQuality * 0.5 - ungovernedPct * 30 - openIncidents * 8
  ));
}

function healthColor(score: number): string {
  if (score >= 70) return "#00ff88";
  if (score >= 45) return "#ffa500";
  if (score >= 25) return "#ff6600";
  return "#ff2222";
}
```

## Drag-and-Drop

Use native HTML5 API — no library needed for 5 zones + 3 tokens.

- `draggable` on analyst token divs
- `onDragStart`: `e.dataTransfer.setData("analystId", analyst.id)`
- `onDragOver`: `e.preventDefault()` to allow drop
- `onDrop`: read analystId, call `assignAnalyst(analystId, department)`
- `onDragEnter` / `onDragLeave`: highlight zone border
- Watch for `onDragLeave` firing on child elements — compare `e.currentTarget` vs `e.relatedTarget`
- Dropping an analyst already assigned to a different zone reassigns them (store handles this)
- To unassign: drag analyst back to the bench area (a drop zone with `department = undefined`)

## Files to Create

| File | Purpose |
|---|---|
| `src/components/orgmap/OrgMapPanel.tsx` | Root centre panel — zone grid + analyst bench |
| `src/components/orgmap/DepartmentZone.tsx` | Single zone — health colour, drop target, click handler |
| `src/components/orgmap/AnalystToken.tsx` | Draggable analyst chip — avatar + name + current dept |
| `src/components/orgmap/DepartmentDrillDown.tsx` | Slide-in detail panel — datasets, incidents, silos scoped to dept |
| `src/engine/orgMapEngine.ts` | Pure `departmentHealth()` and `healthColor()` functions |

## Files to Modify

| File | Change |
|---|---|
| `src/components/layout/DashboardLayout.tsx` | Swap `<SiloPanel />` for `<OrgMapPanel />` in centre panel |
| `src/components/analysts/AnalystPanel.tsx` | Hide or collapse — analysts now live on the map bench |

## Drill-Down Panel

Clicking a department zone shows a slide-in panel (right side, replaces or overlays the governance panel) with:
- Department name + health score + colour bar
- Assigned analyst (with avatar) or "No analyst assigned"
- Dataset list scoped to this department (name, layer badge, composite quality bar, role dots)
- Active incidents affecting this department
- Active silos in this department (with Contain button)
- Ungoverned dataset count + quick-assign prompt

Click outside or press Escape to close.

## Zone Colour Scheme

```
Zone background:  healthColor(score) + "12"   (very faint fill)
Zone border:      healthColor(score) + "55"
Zone border-left: healthColor(score)           (3px solid accent)
On drag hover:    healthColor(score) + "33"    (slightly stronger fill)
```

## Additive Constraint

SiloPanel must NOT be deleted — move it inside DepartmentDrillDown so silos remain accessible per-department. AnalystPanel may be hidden via CSS rather than removed.
