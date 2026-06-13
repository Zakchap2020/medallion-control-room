# Medallion Protocol
## How to Play

---

## What Is This?

You are the newly appointed **Head of Data Governance** at a mid-sized enterprise. The organisation's data is a mess — ungoverned, siloed, low-quality, and politically charged. Executives are losing patience. Auditors are circling. The board wants answers.

Your job is to transform this chaos into a governed, trusted data platform before the organisation fractures under its own dysfunction.

This is not a dashboard simulator. Every pressure you face has a real cause. Every decision you make has consequences — some immediate, some delayed, some political.

---

## Before You Start — Choose a Governance Model

At the beginning of each session you must commit to one of three governance operating models. This is your most important decision.

| Model | Capacity per Cycle | Tradeoff |
|---|---|---|
| **Centralised** | 4 | Tight control, slower throughput. Good if you want to focus governance on critical datasets. |
| **Federated** | 6 | More capacity, but distributed — harder to coordinate across domains. Good for breadth. |
| **Platform-led** | 3 → 8 | Starts slow, scales up after platform modernisation. High risk early, high reward late. |

**Capacity** is how many governance actions you can take each 15-tick cycle. Once it runs out, you cannot assign roles, resolve pressures, or launch initiatives until the next cycle begins. Choose carefully.

---

## The Goal

Build **organisational data maturity** while keeping **executive patience** high enough to survive.

Your session ends with one of five outcomes:

| End State | What Got You Here |
|---|---|
| **Data-Driven** | Maturity ≥ 70, executives mostly satisfied. |
| **Technically Stable** | Good pipelines and quality, but business stakeholders were ignored. |
| **Politically Fractured** | Reasonable maturity, but patience collapsed — governance without buy-in. |
| **Shadow-Dominated** | Too many pressures left to expire. Shadow data and workarounds filled the gap. |
| **Over-Governed** | You launched nearly every initiative but burnt out executive patience in the process. |

There is no single right answer. Each outcome reflects a different kind of organisational failure — or success.

---

## The Game Loop

**Ticks** are the unit of time. Every tick the engine runs: datasets drift in quality, stakeholder patience decays, pressures emerge, initiatives advance.

Use the controls at the bottom of the screen:

- **▶ PLAY** — starts the real-time loop
- **⏸ PAUSE** — stops it; use this to think and act
- **1× / 2× / 3×** — tick speed (start at 1× until you're comfortable)
- **+1 Tick** — advance one tick manually when paused
- **End Session** — trigger final scoring at any point

---

## Datasets

The game contains **15 fixed enterprise datasets** spread across five business domains. They never change — every organisation has these assets. What changes is their quality and governance state.

**Domains and datasets:**

| Domain | Datasets |
|---|---|
| Finance | General Ledger, Revenue Forecast, Board KPI Pack, Regulatory Filing |
| Sales | Customer Master, CRM Pipeline, Customer Support Tickets |
| Marketing | Campaign Attribution, Marketing Spend, Digital Analytics |
| HR | Employee Master, Payroll, Headcount Report |
| Operations | Vendor Contracts, Supply Chain Feed |

### Quality Dimensions

Each dataset has five quality dimensions (DMBOK standard):

| Dimension | Degrades when... |
|---|---|
| **Completeness** | No engineer assigned; pipeline gaps go unattended |
| **Accuracy** | No owner to enforce definitions; upstream data is wrong |
| **Consistency** | No steward managing rules; schema drift accumulates |
| **Timeliness** | Dataset sits ungoverned for extended periods |
| **Validity** | No custodian; access controls fail; bad records enter |

**Composite Quality** is the average of all five. It drives your Trust Score and determines whether a dataset reaches Silver or Gold tier.

### Medallion Tiers

Tiers are computed automatically — you don't promote manually.

```
Bronze  →  Silver  →  Gold
```

| Tier | Conditions |
|---|---|
| **Bronze** | Default starting state |
| **Silver** | Composite quality ≥ 60 AND a Data Owner assigned |
| **Gold** | Composite quality ≥ 80 AND both Owner AND Steward assigned |

Gold datasets generate passive trust each tick and are required to pass compliance audits.

---

## Governance Roles

Each dataset can have up to four roles assigned. Role assignments cost **1 capacity** each.

| Role | What they do |
|---|---|
| **Data Owner** | Domain leader. Accountable for policy, usage, and escalations. Slows quality decay significantly. |
| **Data Steward** | Embedded domain expert. Enforces quality standards and resolves definition conflicts. |
| **Data Custodian** | Controls access. Reduces governance risk on sensitive datasets. |
| **Data Engineer** | Maintains pipelines. Prevents timeliness and validity decay. |

**Domain alignment matters.** Each staff member belongs to a domain (Finance, Sales, HR, etc.). You have 17 people in total across 4 role types. Prioritise coverage on your highest-criticality datasets first.

### Quality Drift

Every tick, every dataset drifts downward unless it is governed:

- Fully governed dataset (Owner + Steward + tech role) → quality **slowly improves**
- Partially governed → drift is reduced but not eliminated
- Ungoverned → rapid decay, increasing governance risk each tick

Critical datasets (★★★★★) drift faster. They are your most urgent priority.

---

## Capacity — The Core Constraint

**Cycle capacity** refreshes every 15 ticks. Once used up, you cannot act until the next cycle.

Actions that cost capacity:

| Action | Cost |
|---|---|
| Assign a governance role | 1 cap |
| Resolve a business pressure (varies) | 0 – 3 cap |
| Launch a strategic initiative | 1 – 3 cap |

Every cycle you must decide: assign roles to ungoverned datasets, or resolve active pressures, or invest in an initiative. You rarely have enough to do all three.

**Platform-led governance model** can increase capacity permanently after the Platform Modernisation initiative completes.

---

## Business Pressures

Pressures are not random events — every one has a **cause chain** you can trace. They appear in the Pressures panel when governance gaps trigger real organisational consequences.

### Pressure Types

| Type | Typical Cause |
|---|---|
| **Governance Gap** | Critical dataset has no owner for too long |
| **KPI Conflict** | Revenue Forecast and General Ledger disagree (accuracy < 60 on both) |
| **Shadow Data Risk** | General Ledger quality too low — teams build their own spreadsheets |
| **Compliance Risk** | Restricted dataset has no custodian assigned |
| **Audit Demand** | Scheduled compliance audit has arrived |
| **Dependency Cascade** | Upstream dataset quality failing; downstream datasets break |
| **Stakeholder Frustration** | An executive's patience has dropped below 30 |
| **Executive Escalation** | Executive pressure reaching critical — direct intervention required |
| **Data Quality Failure** | Composite quality critically low on a key dataset |

### Resolving Pressures

Each pressure has **2–3 resolution options**, each with a capacity cost and different effects:

- Some options are quick fixes (low cost, modest effect)
- Some invest in the relationship (patience boost to a specific stakeholder)
- Some reduce risk structurally (data quality boost, governance risk reduction)
- Some unlock an initiative you couldn't launch before

Pressures that **expire unresolved** mark your record as shadow-dominated. Too many expired pressures push you toward a bad end state.

**Urgency matters.** Critical pressures decay stakeholder patience faster while open. Resolve critical pressures within 2–3 cycles or they escalate.

---

## Stakeholders

Seven executives are watching you. You cannot control them — only manage their expectations.

| Executive | Domain | What frustrates them |
|---|---|---|
| **Richard Holden** | CFO | Financial data quality failures, audit risk |
| **Samira Patel** | CRO | CRM and Customer data problems |
| **Diana Osei** | CMO | Campaign attribution conflicts, marketing data chaos |
| **William Asante** | CHRO | HR data governance failures, payroll anomalies |
| **Marcus Webb** | COO | Supply chain and vendor data breakdowns |
| **Victor Ashby** | Board | Compliance exposure, regulatory filing quality |
| **Catherine Lim** | CEO | Systemic failures, cross-domain conflicts |

**Patience** decays every tick. It decays faster when a pressure originating from that stakeholder is open. If patience reaches 0, they escalate — generating a new critical pressure and damaging your trust score.

Certain resolution options and the **Executive Data Literacy** initiative slow patience decay.

---

## Strategic Initiatives

Initiatives are multi-cycle investments that change the rules of the game. They consume capacity upfront and per cycle until completion.

| Initiative | Cycles | Effect |
|---|---|---|
| **MDM Programme** | 4 | Sets quality floor of 60 on Customer Master and Employee Master |
| **Governance Council** | 2 | Reduces new governance gap pressures by 30% |
| **Audit Preparation** | 1 | Reduces regulatory filing risk 40%; trust boost on completion |
| **Data Catalogue** | 2 | Reduces governance risk on all datasets; enables Platform Modernisation |
| **Platform Modernisation** | 5 | Quality floor 40 across all datasets; +2 capacity per cycle. Requires: Data Catalogue |
| **Privacy Programme** | 2 | Reduces governance risk on restricted datasets by 35% |
| **Executive Data Literacy** | 1 | Reduces stakeholder patience decay rate by 40% |
| **Self-Service Analytics** | 3 | Reduces executive escalation pressures by 30%. Requires: Data Catalogue |

**Prerequisites:** Platform Modernisation and Self-Service Analytics require Data Catalogue to be completed first.

Launching an initiative while capacity is tight is a gamble — but waiting too long means you never reach the late-game effects.

---

## Maturity Stages

Your organisational maturity is computed continuously from five factors:

- **Ownership** — % of critical datasets with a Data Owner (weight: 25%)
- **Stewardship** — % of all datasets with a Data Steward (weight: 20%)
- **Technical control** — % with a Custodian or Engineer (weight: 15%)
- **Data quality** — average composite quality across all 15 datasets (weight: 20%)
- **Pressure handling** — resolved vs. expired pressures (weight: 10%)
- **Initiative completion** — completed initiatives out of 8 (weight: 10%)

| Stage | Score | What it means |
|---|---|---|
| **Chaos** | < 25 | Ungoverned. Pressures accumulate faster than you can respond. |
| **Stabilising** | 25–49 | Foundations forming. Quality still drifting in places. |
| **Governed** | 50–74 | Accountability is established. Executives are cautiously optimistic. |
| **Data-Driven** | ≥ 75 | Trust earned. Governance is embedded in how the organisation works. |

---

## The Panels

### Left Panel — Domains & Catalogue

- **Domain View** (top): Shows health per domain — average quality, ownership rate, open pressures. Click a domain section to see its datasets.
- **Dataset Catalogue** (bottom): All 15 datasets. Filter by All / Critical / At Risk / Ungoverned / Gold. Click any dataset to open it in the inspector.

### Right Panel — Dataset Inspector

Select a dataset from the catalogue or domain view to see:
- Quality dimensions with live bars
- Composite quality score and medallion tier
- Data classification and governance risk
- The political charge — what this dataset means to the organisation
- Role assignment dropdowns (Owner, Steward, Custodian, Engineer)
- Upstream dependencies and their quality

### Centre-Left — Pressure Queue

All open business pressures, sorted by urgency. Expand a card to see the cause chain, consequence if ignored, and resolution options with capacity costs. Act here or let pressures expire at your peril.

### Centre-Right — Strategic Initiatives

All 8 initiatives. Active ones show progress. Launch when you have the prerequisites, the capacity, and the timing is right.

### Bottom — Event Log

A chronological feed of everything that has happened: new pressures, resolved pressures, completed initiatives, maturity milestones, delayed consequences. Read it to understand what is happening and why.

---

## Trust Score

Your Trust Score is a composite of:

- **Weighted quality** (40%) — average composite quality across all datasets
- **Executive patience** (30%) — average patience across all 7 stakeholders
- **Governance coverage** (30%) — % of datasets with at least an Owner assigned
- **Initiative bonus** — completed initiatives add a small passive boost

A score above 50 means you're holding. Below 25, the organisation is losing confidence. Below 10, you're in crisis.

---

## Strategy Tips

**Early game (ticks 1–20)**
Don't spread too thin. Pick the 3–4 most critical datasets (★★★★★) and govern them first. The General Ledger and Customer Master are almost always the right starting point — they are upstream of half the other datasets.

**Cycle boundaries matter**
Plan your actions before a cycle ends. A half-used cycle is wasted capacity. If you have 2 cap left and a role assignment costs 1, use it.

**Read the cause chains**
Every pressure tells you exactly what caused it. Use that information — if the KPI Conflict fired because General Ledger accuracy is below 60, that tells you where to assign your Data Engineer, not just how to resolve the pressure card.

**Don't let stakeholders reach zero**
Patience at 30 is manageable. Patience at 10 means a critical pressure is incoming. Resolve pressures from frustrated executives before they escalate. The Event Log will warn you.

**Initiatives as multipliers**
Governance Council early slows the pressure rate. MDM Programme mid-game stabilises your two highest-traffic datasets. Executive Data Literacy can be the difference between surviving the late game and losing stakeholder buy-in. Treat initiatives as investments, not checkboxes.

**Platform-led is high variance**
Starting with 3 cap per cycle means the first two cycles are brutally constrained. If you pick Platform-led, launch Data Catalogue in cycle 1 even if it hurts — you need the path to Platform Modernisation open as early as possible.

---

## DMBOK Concepts in This Game

| Game Mechanic | DMBOK Knowledge Area |
|---|---|
| Medallion Bronze / Silver / Gold | Data Architecture & Quality Management |
| 5 quality dimensions | Data Quality Management (DAMA dimensions) |
| Owner / Steward / Custodian / Engineer roles | Data Governance — Roles & Responsibilities |
| Data classification (Restricted / Confidential / Internal) | Data Security Management |
| Business pressures with cause chains | Data Quality — Issue Management |
| Stakeholder patience | Data Governance — Stakeholder Management |
| Compliance audits | Data Governance — Compliance & Audit |
| Strategic initiatives | Data Governance — Programme Management |
| Maturity stages | DAMA-DMBOK Maturity Model |
| Upstream dependencies | Data Integration & Interoperability |
