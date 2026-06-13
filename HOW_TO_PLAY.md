# Medallion Data Governance Control Room Simulator
## How to Play

---

## What Is This?

You are the Head of Data Governance at a mid-sized enterprise. Your job is to transform a chaotic landscape of ungoverned, siloed, low-quality data assets into a trusted, well-governed data platform — before the organisation loses confidence in its data entirely.

The game is built around **DMBOK** (the Data Management Body of Knowledge), the industry standard framework for data governance. Every mechanic in the game reflects a real concept from that framework.

---

## The Goal

Keep your **Trust Score** above **-20** while building governance maturity over time.

Your session is scored across four dimensions when you click **End Session**:

| Dimension | Weight | What it measures |
|---|---|---|
| Data Trust | 30% | Your trust score trajectory and peak |
| Governance Maturity | 30% | How well your datasets are owned, stewarded, and classified |
| Operational Stability | 25% | Incident rate and resolution speed |
| Executive Satisfaction | 15% | Executive pressures completed vs. failed |

Scores above 72 are excellent. Below 50 is a governance failure.

---

## The Game Loop

**Ticks** are the unit of time. Each tick, the game engine runs: datasets drift, incidents spawn, pressures escalate, silos grow.

Use the controls at the bottom of the screen:

- **▶ PLAY** — starts the real-time loop
- **⏸ PAUSE** — pauses it
- **1× / 2× / 3×** — controls tick speed (slow = more time to react, fast = higher pressure)
- **+1 Tick** — available when paused; manually advance one tick at a time
- **End Session** — triggers scoring and shows your final results

The game ends automatically if your Trust Score drops below **-20**.

---

## The Medallion Pipeline

All data moves through three tiers. Promotion is the primary way to gain trust.

```
Bronze  →  Silver  →  Gold
(raw)     (refined)   (trusted)
```

### Bronze
- All new datasets start here
- High governance risk, quality is unstable
- Eligible for promotion to Silver when: **composite quality > 65** AND a **Custodian** is assigned

### Silver
- Refined data with active stewardship
- Eligible for promotion to Gold when: **composite quality > 80** AND both an **Owner** AND **Steward** are assigned

### Gold
- Fully trusted, governed datasets
- Passive trust boost each tick
- Required to pass Compliance Audits

You can **manually promote** a dataset using the **Promote →** button in the Dataset Inspector (right panel). The button shows why promotion is blocked when conditions aren't met.

---

## Data Quality Dimensions

Every dataset has five quality dimensions, drawn from DMBOK:

| Dimension | What decays when... |
|---|---|
| **Accuracy** | No Data Owner assigned |
| **Completeness** | No Custodian assigned; pipeline breaks |
| **Consistency** | Schema drift; no Steward managing rules |
| **Uniqueness** | Duplicate data signals go unresolved |
| **Timeliness** | Datasets sit unattended for many ticks |

**Composite Quality** is the average of all five. It's shown on every dataset card in the catalogue.

Enable **Auto-Fix** on a dataset to allow the system to attempt automatic repairs each tick — but Auto-Fix is less effective than resolving the root cause.

---

## Governance Roles

Three roles can be assigned to each dataset. Each person can only hold a given role on **one dataset at a time** — this is scarcity, and it forces real prioritisation decisions.

### Data Owner
> *Accountable for business definition, policy compliance, and correct usage.*

- Without one: accuracy decays, governance risk climbs each tick
- Required for Silver → Gold promotion

### Data Steward
> *Enforces quality standards and business rules.*

- Without one: consistency decays, auto-fix is less effective
- Required for Silver → Gold promotion

### Data Custodian
> *Manages technical pipelines, schema, and access controls.*

- Without one: completeness decays, pipeline breaks go unpatched
- Required for Bronze → Silver promotion

### Scarcity
You have **2 Owners, 2 Stewards, 2 Custodians** — six people total. Assigning someone to a new dataset unassigns them from their previous one. When someone is reassigned, you'll see a warning toast.

### Key Person Departures
Occasionally (~4% chance per tick), a governance person will announce they are leaving in **3 ticks**. Their upcoming departure is flagged in the dropdown with `⚠ leaving in NT`. When they leave:
- All their dataset assignments are **automatically cleared**
- They go on leave for **10 ticks** then return
- You must reassign their datasets manually before the 3 ticks expire or face governance risk spikes

---

## Data Classification

Every dataset should be classified. Select a classification in the Dataset Inspector:

| Classification | Meaning | Risk if mismanaged |
|---|---|---|
| **Public** | Freely shareable | Low — no restrictions |
| **Internal** | Internal use only | Medium — exposure risk |
| **Confidential** | Restricted access | High — breach risk |
| **Restricted** | Highest protection | Critical — breach is automatic if ungoverned |

**Unclassified datasets older than 5 ticks** will periodically generate **Unclassified Sensitive Data** incidents (medium severity).

**Confidential or Restricted datasets** with governance risk above 75% and no Custodian assigned will trigger a **Data Breach** — a critical incident with significant trust damage.

> DMBOK principle: classification is not optional. Every dataset that touches business-critical or personal data must be classified and protected.

---

## Analysts

Analysts are assigned to **departments** (Finance, Sales, Marketing, HR, Operations). They:
- Detect data quality signals in their assigned department
- Discover hidden data silos
- Accelerate incident resolution

Assign analysts from the right panel. An analyst without a department assignment is idle.

---

## Data Silos

Silos are undiscovered datasets living outside the governed catalogue — often in spreadsheets, shadow systems, or departmental databases.

- Analysts discover silos over time (based on their assigned department)
- Discovered silos appear in the **Silo Monitor** (centre panel)
- Silos have a **Risk Level** (0–100%). High-risk silos drain your Trust Score each tick
- Click **Contain** to eliminate a silo's risk and gain a trust bonus
- Uncontained critical silos (>75% risk) blink and apply ongoing trust damage

---

## Incidents

Incidents are data failures that require resolution. They auto-spawn based on game conditions.

| Type | Trigger |
|---|---|
| Data Quality Failure | Dataset quality drops critically low |
| KPI Mismatch | Conflicting metrics across departments |
| Silo Dependency Failure | A silo is blocking data flow |
| Governance Failure | Dataset has no owner for too long |
| Pipeline Break | Medallion promotion pipeline disrupted |
| Unclassified Sensitive Data | Dataset unclassified for >5 ticks |
| Data Breach | Confidential/Restricted + high risk + no custodian |
| Compliance Audit Failed | Audit conditions not met at audit tick |

### Severity
- **Critical** — urgent, large trust penalty per tick unresolved
- **High** — significant impact
- **Medium** — moderate drain
- **Low** — minor but accumulates

Resolve incidents from the **Incidents** tab in the bottom feed, or click **Resolve** directly from the **Priority Queue** widget at the top of the centre panel.

---

## Executive Pressures

The executive team periodically issues demands. These appear in the **Executive** tab.

- Each pressure has a **time limit** — if it expires unmet, you lose reputation
- Completing pressures gives Reputation +5 and Trust +10
- Failing pressures drains both

Pressure types: Board Requests, Finance Pressures, Compliance Audits, CEO Escalations, Operational Reviews.

---

## Compliance Audits

Every ~25–30 ticks, a formal compliance audit is scheduled.

**8 ticks before the audit**, a warning pressure card appears showing the pass criteria:
- ≥ 1 Gold dataset
- ≤ 3 open incidents
- ≤ 30% of datasets ungoverned (no Owner)
- Average dataset quality ≥ 55

**On audit day:**
- **Pass**: Trust +15, Reputation +8. Next audit in 25 ticks.
- **Fail**: Trust -15, a critical `Compliance Audit Failed` incident is raised. Next audit in 20 ticks.

Results appear in the **Events** feed immediately.

---

## The Priority Queue

The **"What Needs Attention Now?"** widget sits at the top of the centre panel. It scores every open incident, executive pressure, and high-risk silo by urgency and surfaces the top 3.

Each row shows a quick-action button (Resolve / Deliver / Contain) so you can act without navigating away.

Items with very high urgency scores blink. When the queue is empty, all systems are nominal.

---

## The Bottom Feed

Five tabs surface operational detail:

| Tab | Shows |
|---|---|
| **Incidents** | All open and in-progress incidents |
| **Signals** | Analyst-detected data anomalies |
| **Executive** | Active executive pressure demands |
| **Pipeline** | Auto-fix and promotion activity log |
| **Events** | Character events — real-time narrative from your team |

Tabs with active items show count badges. Urgent tabs blink.

---

## The Dataset Catalogue

The left panel lists all datasets. Filter using the four buttons:

- **All** — every dataset
- **At Risk** — composite quality < 60 or governance risk > 65%
- **Ungoverned** — no Data Owner assigned
- **Gold** — Gold-tier datasets only

Click any dataset to open the **Dataset Inspector** in the right panel, where you can:
- Assign governance roles
- Set data classification
- View quality dimensions
- Enable/disable Auto-Fix
- Manually trigger promotion

---

## Endgame Archetypes

When your session ends (by choice or by Trust Score collapse), you are classified into one of five archetypes:

| Archetype | What it means |
|---|---|
| **Mature, Data-Driven** | High scores across all dimensions. A genuine DMBOK success. |
| **Technically Stable, Politically Fragile** | Great quality, but executives weren't satisfied. |
| **Operationally Chaotic** | Too many incidents, not enough resolution bandwidth. |
| **Governance Failure** | Data was ungoverned or unclassified at scale. |
| **Self-Healing Illusion** | Auto-Fix masked the real problems. Quality was artificial. |

---

## Achievements

Six achievements can be unlocked during a session:

- **Data Sovereign** — All datasets have an Owner assigned simultaneously
- **Gold Standard** — Promote 3 datasets to Gold
- **Incident Commander** — Resolve 10 incidents in a single session
- **Silo Buster** — Contain 5 data silos
- **Board Favourite** — Complete 5 executive pressures without a single failure
- **Silent Risk Warning** — End the session with a Data Breach incident that was never resolved

---

## Strategy Tips

**Early game (ticks 1–15)**
Assign analysts to departments immediately. Don't wait for incidents — get ahead of silos. Assign a Custodian to your first Bronze dataset as quickly as possible to enable promotion.

**Mid game (ticks 15–40)**
Prioritise classification — unclassified datasets are a liability as they age. Watch for the Compliance Audit warning (it arrives at tick 22). Make sure you have at least one Gold dataset before tick 30.

**Pressure management**
Never let a critical incident sit for more than 3 ticks. Use the Priority Queue to triage — it saves the time of scanning every tab manually.

**Scarcity decisions**
When a new dataset spawns with no governance, you must decide: steal a Custodian from a Bronze dataset (risking its completeness) or let the new dataset drift. Neither is free.

**Person departures**
When a departure warning fires, immediately check which of their datasets is most critical and reassign. Three ticks goes fast.

---

## DMBOK Concepts in This Game

| Game Mechanic | DMBOK Knowledge Area |
|---|---|
| Medallion Bronze/Silver/Gold | Data Architecture & Data Quality Management |
| 5 quality dimensions | Data Quality Management (DAMA dimensions) |
| Owner / Steward / Custodian roles | Data Governance — Roles & Responsibilities |
| Data Classification | Data Security Management |
| Silos | Data Integration & Interoperability |
| Catalogue | Metadata Management |
| Compliance Audits | Data Governance — Compliance & Audit |
| Incidents | Data Quality — Issue Management |
| Executive Pressures | Data Governance — Stakeholder Management |
