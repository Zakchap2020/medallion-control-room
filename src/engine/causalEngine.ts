import type { GameState, BusinessPressure, ResolutionOption, PressureType } from "../models/types";
import { DATASET_BY_ID } from "../data/datasets";
import { compositeQuality } from "./qualityUtils";

let _nextPressureIdx = 0;
function pressureId(prefix: string): string {
  return `${prefix}-${++_nextPressureIdx}`;
}

function opt(
  id: string,
  label: string,
  description: string,
  capacityCost: number,
  effect: ResolutionOption["effect"]
): ResolutionOption {
  return { id, label, description, capacityCost, effect };
}

// ── Pressure factory helpers ───────────────────────────────────────────────

function makeGovernanceGapPressure(
  datasetId: string,
  tick: number,
  causeChain: string[],
  sourceId: string,
  urgency: BusinessPressure["urgency"]
): BusinessPressure {
  const fd = DATASET_BY_ID[datasetId];
  return {
    id: pressureId("gg"),
    type: "governance_gap",
    title: `${fd.name} — No Data Owner Assigned`,
    description: `${fd.name} is ${fd.criticality >= 5 ? "critical" : "important"} and currently has no accountable owner.`,
    detail: `Without a Data Owner, accountability for ${fd.name} is undefined. Quality will continue to degrade and any dispute over this data has no resolution path.`,
    causeChain,
    affectedDatasets: [datasetId],
    sourceStakeholderId: sourceId,
    urgency,
    tickAppeared: tick,
    tickDeadline: tick + 45,
    status: "open",
    consequenceIfIgnored: `Trust in ${fd.name} will fall. Downstream datasets and reports depending on this data become unreliable.`,
    resolutionOptions: [
      opt("appoint-owner", "Appoint Data Owner", `Formally assign a domain leader as Data Owner for ${fd.name}.`, 1, {
        datasetEffects: [{ datasetId, riskReduction: 25 }],
        narrativeOutcome: `Data Owner appointed for ${fd.name}. Accountability is established.`,
        trustDelta: 3,
      }),
      opt("investigate-first", "Investigate Dataset", `Understand the current state before appointing ownership.`, 1, {
        datasetEffects: [{ datasetId, riskReduction: 10 }],
        narrativeOutcome: `Investigation into ${fd.name} completed. Risk partially reduced — ownership still required.`,
      }),
      opt("defer-risk", "Accept Risk (Defer)", "Log the gap and defer action. Escalation likely.", 0, {
        narrativeOutcome: `Governance gap on ${fd.name} deferred. Risk is growing.`,
        trustDelta: -3,
      }),
    ],
  };
}

function makeKpiConflictPressure(tick: number): BusinessPressure {
  return {
    id: pressureId("kpi"),
    type: "kpi_conflict",
    title: "Revenue Numbers Conflict — Finance vs. Sales",
    description: "Finance and Sales are quoting different revenue figures. The Board KPI Pack contains both.",
    detail: "The General Ledger and CRM Pipeline both claim to be the source of revenue truth. With no canonical definition and no owner arbitrating, both teams produce different numbers monthly. Board members are receiving conflicting pre-reads.",
    causeChain: [
      "General Ledger accuracy has deteriorated (no steward monitoring quality)",
      "CRM Pipeline uses a different revenue recognition rule than Finance",
      "No Data Owner has defined the canonical revenue metric",
      "Both Finance and Sales feed the Board KPI Pack independently",
    ],
    affectedDatasets: ["general-ledger", "crm-pipeline", "revenue-forecast", "board-kpi-pack"],
    sourceStakeholderId: "cfo",
    urgency: "critical",
    tickAppeared: tick,
    tickDeadline: tick + 30,
    status: "open",
    consequenceIfIgnored: "Board confidence will fall. Risk of a formal escalation to the CEO. Trust -15.",
    resolutionOptions: [
      opt("define-canonical", "Define Canonical Revenue Metric", "Establish the GL as the authoritative revenue source and document the definition.", 2, {
        datasetEffects: [
          { datasetId: "general-ledger", riskReduction: 30, qualityBoost: { accuracy: 12, consistency: 10 } },
          { datasetId: "revenue-forecast", riskReduction: 20 },
        ],
        trustDelta: 10,
        patienceBoost: 20,
        stakeholderId: "cfo",
        narrativeOutcome: "Revenue metric formalised. General Ledger is now the authoritative source. Finance and Sales are aligned.",
      }),
      opt("alignment-meeting", "Convene Finance-Sales Alignment", "Schedule a formal alignment meeting. Buys time but no permanent fix.", 1, {
        patienceBoost: 12,
        stakeholderId: "cfo",
        narrativeOutcome: "Finance and Sales alignment meeting held. Numbers are reconciled for this cycle — but the root cause remains.",
        delayedTrustDelta: -5,
        delayedTicks: 20,
      }),
      opt("escalate-ceo", "Escalate to CEO for Arbitration", "Fast resolution, but CEOs don't like being pulled into data disputes.", 1, {
        trustDelta: 5,
        patienceBoost: -15,
        stakeholderId: "ceo",
        narrativeOutcome: "CEO resolved the dispute in Finance's favour. CRO is unhappy. A political debt has been created.",
      }),
    ],
  };
}

function makeShadowSpreadsheetPressure(tick: number): BusinessPressure {
  return {
    id: pressureId("shadow"),
    type: "shadow_data_risk",
    title: "Shadow Spreadsheet Emerging — Finance",
    description: "Finance is maintaining a personal spreadsheet because they don't trust the General Ledger.",
    detail: "When official data quality falls below acceptable levels, business users find workarounds. Finance has begun maintaining their own reconciled version of the General Ledger in a shared spreadsheet. It currently has 12 contributors. If this becomes the 'real' number, the governed system loses relevance.",
    causeChain: [
      "General Ledger composite quality has fallen below 50",
      "No Data Steward is monitoring or improving GL quality",
      "Finance team lost confidence in official data",
      "A shared spreadsheet has appeared as a substitute",
    ],
    affectedDatasets: ["general-ledger", "revenue-forecast"],
    sourceStakeholderId: "cfo",
    urgency: "high",
    tickAppeared: tick,
    tickDeadline: tick + 40,
    status: "open",
    consequenceIfIgnored: "Shadow spreadsheet becomes entrenched as 'the real GL'. Governed system becomes irrelevant. Trust -20.",
    resolutionOptions: [
      opt("fix-gl-quality", "Fix GL Data Quality at Source", "Address the root cause — improve GL quality so Finance trusts it again.", 2, {
        datasetEffects: [{ datasetId: "general-ledger", qualityBoost: { accuracy: 15, completeness: 12, consistency: 10 }, riskReduction: 20 }],
        trustDelta: 8,
        narrativeOutcome: "GL quality has improved. Finance is returning to the official source. Shadow spreadsheet activity is declining.",
      }),
      opt("appoint-steward", "Appoint GL Data Steward", "Assign a steward to monitor and maintain GL quality ongoing.", 1, {
        datasetEffects: [{ datasetId: "general-ledger", riskReduction: 15 }],
        narrativeOutcome: "Ben Walsh assigned as GL Data Steward. Quality monitoring is now active.",
        trustDelta: 4,
      }),
      opt("formalise-shadow", "Formalise Shadow Data (Risk Accept)", "Officially adopt the spreadsheet as a supplementary source. Fast but legitimises the workaround.", 1, {
        datasetEffects: [{ datasetId: "general-ledger", riskReduction: -10 }],
        trustDelta: -5,
        narrativeOutcome: "Shadow spreadsheet formally adopted as a supplementary source. The governed GL is now secondary. Governance risk has increased.",
      }),
    ],
  };
}

function makeBoardKpiPressure(tick: number): BusinessPressure {
  return {
    id: pressureId("bkpi"),
    type: "kpi_conflict",
    title: "Board KPI Pack — Numbers Do Not Reconcile",
    description: "Board members arrived at the last meeting with different versions of the KPI pack. At least three figures are disputed.",
    detail: "The Board KPI Pack pulls from General Ledger, Revenue Forecast, and Employee Master — all of which have low quality and inconsistent governance. The pack was assembled manually and contains at least three sets of numbers that cannot be reconciled without a data dictionary that doesn't exist.",
    causeChain: [
      "Board KPI Pack has no Data Owner defining authoritative sources",
      "General Ledger accuracy is below 55",
      "Revenue Forecast has a different revenue definition than the GL",
      "Employee Master has inconsistent records feeding headcount numbers",
    ],
    affectedDatasets: ["board-kpi-pack", "general-ledger", "revenue-forecast", "employee-master"],
    sourceStakeholderId: "board",
    urgency: "critical",
    tickAppeared: tick,
    tickDeadline: tick + 25,
    status: "open",
    consequenceIfIgnored: "Board confidence falls critically. Reputation damage. Trust -18.",
    resolutionOptions: [
      opt("emergency-governance", "Emergency Governance Remediation", "Assign owners and fix upstream quality. Comprehensive but high cost.", 2, {
        datasetEffects: [
          { datasetId: "board-kpi-pack", riskReduction: 30, qualityBoost: { accuracy: 10, consistency: 15 } },
          { datasetId: "general-ledger", qualityBoost: { accuracy: 8 }, riskReduction: 15 },
        ],
        trustDelta: 12,
        patienceBoost: 18,
        stakeholderId: "board",
        narrativeOutcome: "Emergency governance applied to the Board KPI Pack. Numbers are reconciled. Board confidence partially restored.",
      }),
      opt("manual-reconcile", "Manual Reconciliation (Short-Term)", "Manually correct this cycle's pack. No structural fix.", 1, {
        patienceBoost: 10,
        stakeholderId: "board",
        trustDelta: 2,
        narrativeOutcome: "Board pack manually reconciled for this cycle. Root cause unaddressed — problem will recur.",
        delayedTrustDelta: -8,
        delayedTicks: 25,
      }),
      opt("postpone-pack", "Postpone Board Pack", "Request a one-cycle delay. Buys time but signals weakness.", 1, {
        patienceBoost: -8,
        stakeholderId: "board",
        trustDelta: -5,
        narrativeOutcome: "Board pack postponed. Board notified. Victor Ashby is not pleased.",
      }),
    ],
  };
}

function makeCompliancePressure(datasetId: string, tick: number): BusinessPressure {
  const fd = DATASET_BY_ID[datasetId];
  const sourceId = fd.domain === "HR" ? "chro" : "cfo";
  return {
    id: pressureId("comp"),
    type: "compliance_risk",
    title: `${fd.name} — Restricted Data Without Custodian`,
    description: `${fd.name} contains restricted data but has no Data Custodian managing access and storage controls.`,
    detail: `${fd.name} is classified as restricted and used by ${fd.usageCount} people. Without a Data Custodian, access is uncontrolled, storage is unaudited, and there is no breach response capability. A privacy incident at this point would be a regulatory event.`,
    causeChain: [
      `${fd.name} is classified as restricted`,
      `No Data Custodian has been assigned`,
      `Access controls are not formally managed`,
      `Governance risk has exceeded the threshold for acceptable exposure`,
    ],
    affectedDatasets: [datasetId],
    sourceStakeholderId: sourceId,
    urgency: "high",
    tickAppeared: tick,
    tickDeadline: tick + 30,
    status: "open",
    consequenceIfIgnored: `Regulatory exposure. If a breach occurs without a custodian, the liability is total. Trust -12.`,
    resolutionOptions: [
      opt("assign-custodian", "Assign Emergency Custodian", "Immediately assign a Data Custodian to manage access and storage.", 1, {
        datasetEffects: [{ datasetId, riskReduction: 30 }],
        trustDelta: 5,
        narrativeOutcome: `Data Custodian assigned to ${fd.name}. Access controls are now managed.`,
      }),
      opt("launch-privacy", "Launch Privacy Programme", "Start the Privacy & Classification Programme to address this systematically.", 2, {
        datasetEffects: [{ datasetId, riskReduction: 20 }],
        initiativeUnlock: "privacy-programme",
        narrativeOutcome: `Privacy Programme launched in response to ${fd.name} exposure. Systemic fix underway.`,
        trustDelta: 6,
      }),
      opt("accept-risk", "Accept Risk (Document Only)", "Log the risk without action. Escalation certain.", 0, {
        narrativeOutcome: `Risk accepted on ${fd.name}. Documented but unmitigated. Regulatory exposure continues.`,
        trustDelta: -4,
      }),
    ],
  };
}

function makeAuditDemandPressure(tick: number): BusinessPressure {
  return {
    id: pressureId("audit"),
    type: "audit_demand",
    title: "External Regulatory Audit — Lineage and Ownership Required",
    description: "The regulator has requested data lineage documentation and ownership attestation for all financial datasets.",
    detail: "The external audit team has asked for: (1) a complete data lineage map for regulatory filings, (2) named Data Owners for all restricted datasets, (3) evidence of quality monitoring for datasets used in statutory reports. You have limited time to prepare.",
    causeChain: [
      "Quarterly regulatory filing window is approaching",
      "Previous filing required three restatements (flagged by auditors)",
      "No formal data lineage documentation exists",
      "Ownership attestation is not possible without assigned Data Owners",
    ],
    affectedDatasets: ["regulatory-filing", "general-ledger", "payroll", "headcount-report"],
    sourceStakeholderId: "board",
    urgency: "critical",
    tickAppeared: tick,
    tickDeadline: tick + 20,
    status: "open",
    consequenceIfIgnored: "Audit failure. Trust -20. Regulatory risk escalated. Board confidence critical.",
    resolutionOptions: [
      opt("launch-audit-prep", "Launch Audit Preparation Initiative", "Start the formal audit preparation programme. Highest chance of a clean audit.", 3, {
        initiativeUnlock: "audit-preparation",
        trustDelta: 5,
        narrativeOutcome: "Audit Preparation Initiative launched. Lineage documentation and ownership attestation in progress.",
      }),
      opt("manual-compliance", "Manual Compliance Response", "Manually compile lineage and ownership evidence. Partial credit — some risk remains.", 2, {
        datasetEffects: [
          { datasetId: "regulatory-filing", riskReduction: 20 },
          { datasetId: "general-ledger", riskReduction: 10 },
        ],
        trustDelta: 6,
        narrativeOutcome: "Manual audit response submitted. Partial lineage provided. Auditors noted gaps but accepted the response for this cycle.",
      }),
      opt("request-extension", "Request Extension", "Buy more time. The regulator may grant it once.", 1, {
        trustDelta: -5,
        patienceBoost: -10,
        stakeholderId: "board",
        narrativeOutcome: "Extension requested. Regulator granted one additional cycle. Board is concerned.",
        delayedTrustDelta: -5,
        delayedTicks: 20,
      }),
    ],
  };
}

function makePayrollGhostPressure(tick: number): BusinessPressure {
  return {
    id: pressureId("payroll"),
    type: "data_quality_failure",
    title: "Payroll Contains Ghost Employees",
    description: "Payroll records include employees who no longer appear in the Employee Master — or never did.",
    detail: "A routine reconciliation flagged 23 payroll records with no matching Employee Master entry. Some are from an acquisition two years ago. Others have no clear origin. Finance and HR are pointing at each other. Payroll is running this Friday.",
    causeChain: [
      "Employee Master and Payroll have no shared steward",
      "Acquisition data was loaded into Payroll but never reconciled with Employee Master",
      "No consistency check has been run between the two systems",
      "CHRO and CFO discovered the gap independently",
    ],
    affectedDatasets: ["payroll", "employee-master", "headcount-report"],
    sourceStakeholderId: "chro",
    urgency: "critical",
    tickAppeared: tick,
    tickDeadline: tick + 15,
    status: "open",
    consequenceIfIgnored: "Financial exposure. Potential payroll run error. Trust -15. CHRO and CFO confidence severely damaged.",
    resolutionOptions: [
      opt("reconcile-data", "Data Reconciliation Programme", "Reconcile Payroll and Employee Master using a shared steward.", 2, {
        datasetEffects: [
          { datasetId: "payroll", qualityBoost: { accuracy: 18, consistency: 15 }, riskReduction: 25 },
          { datasetId: "employee-master", qualityBoost: { consistency: 12 }, riskReduction: 15 },
        ],
        trustDelta: 10,
        patienceBoost: 15,
        stakeholderId: "chro",
        narrativeOutcome: "Payroll and Employee Master reconciled. Ghost employees removed. CHRO and CFO confidence improved.",
      }),
      opt("launch-mdm", "Launch MDM Programme", "Treat this as the trigger for a full Master Data Management programme.", 2, {
        initiativeUnlock: "mdm-program",
        trustDelta: 6,
        narrativeOutcome: "MDM Programme launched in response to payroll data crisis. Long-term fix underway.",
      }),
      opt("manual-payroll-audit", "Manual Payroll Audit", "Manually review payroll records before Friday's run. Partial fix.", 1, {
        datasetEffects: [{ datasetId: "payroll", riskReduction: 12 }],
        narrativeOutcome: "Manual payroll audit completed. Ghost employees deferred pending full reconciliation.",
        trustDelta: 3,
      }),
    ],
  };
}

function makeCustomerChaosPressure(tick: number): BusinessPressure {
  return {
    id: pressureId("custchaos"),
    type: "data_quality_failure",
    title: "Customer Records Fragmented Across Three Systems",
    description: "Sales, Marketing, and Finance all maintain separate customer records. None of them agree.",
    detail: "A recent analysis showed 14,000 customers in CRM, 18,200 in Finance, and 11,500 in a shared Marketing spreadsheet. De-duplication attempts have failed twice. Campaigns are misfiring. Billing errors are appearing. The CRO and CMO have both escalated.",
    causeChain: [
      "Customer Master has no Data Owner or Steward",
      "CRM was implemented by Sales without integration to Finance's customer records",
      "Marketing maintains a separate segmentation list in a spreadsheet",
      "Three different customer definitions are in active use",
    ],
    affectedDatasets: ["customer-master", "crm-pipeline", "campaign-attribution"],
    sourceStakeholderId: "cro",
    urgency: "high",
    tickAppeared: tick,
    tickDeadline: tick + 40,
    status: "open",
    consequenceIfIgnored: "Customer data becomes increasingly fragmented. Campaign effectiveness falls. CRO and CMO confidence deteriorates. Trust -12.",
    resolutionOptions: [
      opt("mdm-programme", "Launch MDM Programme", "Treat Customer Master as the first target of a full MDM programme.", 3, {
        initiativeUnlock: "mdm-program",
        trustDelta: 8,
        narrativeOutcome: "MDM Programme launched with Customer Master as the primary target. CRO and CMO briefed.",
      }),
      opt("appoint-steward-customer", "Appoint Customer Master Steward", "Assign an operational steward as an immediate stabilising step.", 1, {
        datasetEffects: [{ datasetId: "customer-master", riskReduction: 20 }],
        trustDelta: 4,
        narrativeOutcome: "Sophie Kim appointed as Customer Master Steward. Stewardship now active.",
      }),
      opt("technical-dedup", "Technical Deduplication Sprint", "Engineering-led deduplication across systems. Addresses symptoms, not the structural cause.", 2, {
        datasetEffects: [{ datasetId: "customer-master", qualityBoost: { accuracy: 12, consistency: 18 }, riskReduction: 15 }],
        trustDelta: 5,
        narrativeOutcome: "Technical deduplication completed. Customer count reconciled. Stewardship still required to prevent recurrence.",
        delayedTrustDelta: -4,
        delayedTicks: 30,
      }),
    ],
  };
}

function makeDependencyPressure(downstreamId: string, upstreamId: string, tick: number): BusinessPressure {
  const down = DATASET_BY_ID[downstreamId];
  const up = DATASET_BY_ID[upstreamId];
  return {
    id: pressureId("dep"),
    type: "dependency_cascade",
    title: `${down.name} Degrading — Upstream ${up.name} is Failing`,
    description: `${down.name} depends on ${up.name}, which has deteriorated below acceptable quality thresholds.`,
    detail: `${up.name} quality has fallen to a level that is cascading failures downstream into ${down.name}. Any report or process that uses ${down.name} is now returning inconsistent or inaccurate results.`,
    causeChain: [
      `${up.name} composite quality has fallen below 40`,
      `No Data Engineer is monitoring the pipeline from ${up.name} to ${down.name}`,
      `Quality issues in ${up.name} are propagating downstream automatically`,
    ],
    affectedDatasets: [downstreamId, upstreamId],
    sourceStakeholderId: undefined,
    urgency: "high",
    tickAppeared: tick,
    tickDeadline: tick + 25,
    status: "open",
    consequenceIfIgnored: `${down.name} quality will continue to fall. Downstream reports become unreliable.`,
    resolutionOptions: [
      opt("fix-upstream", "Fix Upstream Dataset", `Assign a Data Engineer to repair ${up.name} quality.`, 2, {
        datasetEffects: [{ datasetId: upstreamId, qualityBoost: { accuracy: 15, completeness: 12 }, riskReduction: 20 }],
        narrativeOutcome: `${up.name} quality restored. ${down.name} is now receiving clean upstream data.`,
        trustDelta: 5,
      }),
      opt("decouple-upstream", "Decouple Dependency (Temp)", "Isolate the downstream dataset from the failing upstream. Buys time.", 1, {
        datasetEffects: [{ datasetId: downstreamId, riskReduction: 10 }],
        narrativeOutcome: `${down.name} temporarily decoupled from ${up.name}. Risk reduced but data freshness compromised.`,
      }),
    ],
  };
}

function makeStakeholderFrustrationPressure(stakeholderId: string, stakeholderName: string, domain: string, tick: number): BusinessPressure {
  return {
    id: pressureId("sfrust"),
    type: "stakeholder_frustration",
    title: `${stakeholderName} — Patience Critical`,
    description: `${stakeholderName} has reached a breaking point. Continued inaction on ${domain} data will result in an escalation.`,
    detail: `${stakeholderName} has been raising concerns about data quality and governance in ${domain} for multiple cycles. Patience is now critically low. Without a visible win, they will escalate to the CEO and may begin advocating for a different approach to data governance entirely.`,
    causeChain: [
      `Multiple unresolved data issues in ${domain}`,
      `No visible governance improvements in recent cycles`,
      `${stakeholderName} has been raising concerns without response`,
      `Patience has fallen to a critical level`,
    ],
    affectedDatasets: [],
    sourceStakeholderId: stakeholderId,
    urgency: "high",
    tickAppeared: tick,
    tickDeadline: tick + 20,
    status: "open",
    consequenceIfIgnored: "CEO escalation. Trust -10. Governance authority at risk.",
    resolutionOptions: [
      opt("executive-briefing", "Executive Briefing — Show Progress", "Brief the stakeholder on governance progress and concrete wins.", 1, {
        patienceBoost: 20,
        stakeholderId,
        trustDelta: 3,
        narrativeOutcome: `${stakeholderName} briefed on governance progress. Patience partially restored.`,
      }),
      opt("quick-win", "Deliver a Quick Win in Their Domain", "Resolve a visible data issue in their domain to demonstrate value.", 2, {
        patienceBoost: 30,
        stakeholderId,
        trustDelta: 6,
        narrativeOutcome: `Visible improvement delivered in ${domain}. ${stakeholderName} is satisfied for now.`,
      }),
    ],
  };
}

// ── Cooldown constants ─────────────────────────────────────────────────────

const COOLDOWNS: Record<string, number> = {
  governance_gap: 25,
  kpi_conflict_revenue: 40,
  shadow_spreadsheet: 35,
  board_kpi: 30,
  compliance_restricted: 25,
  audit_demand: 999,           // one-time
  payroll_ghost: 40,
  customer_chaos: 35,
  dependency: 20,
  stakeholder_frustration: 20,
};

function cooledDown(key: string, tick: number, cooldowns: Record<string, number>): boolean {
  const last = cooldowns[key] ?? -999;
  return tick - last >= (COOLDOWNS[key] ?? 25);
}

function hasOpenType(pressures: BusinessPressure[], type: PressureType): boolean {
  return pressures.some((p) => p.type === type && p.status === "open");
}

function hasOpenForDataset(pressures: BusinessPressure[], datasetId: string, type: PressureType): boolean {
  return pressures.some(
    (p) => p.type === type && p.status === "open" && p.affectedDatasets.includes(datasetId)
  );
}

// ── Main causal pressure generator ────────────────────────────────────────

export function generateCausalPressures(state: GameState): BusinessPressure[] {
  const { datasets, pressures, stakeholders, tick, pressureCooldowns, nextAuditTick } = state;
  const newPressures: BusinessPressure[] = [];
  let generated = 0;
  const MAX_NEW = 2;

  const push = (p: BusinessPressure, cooldownKey: string): boolean => {
    if (generated >= MAX_NEW) return false;
    newPressures.push(p);
    pressureCooldowns[cooldownKey] = tick;
    generated++;
    return true;
  };

  // 1. Revenue KPI conflict
  if (!hasOpenType(pressures, "kpi_conflict") && cooledDown("kpi_conflict_revenue", tick, pressureCooldowns)) {
    const gl = datasets["general-ledger"];
    const crm = datasets["crm-pipeline"];
    if (gl && crm && compositeQuality(gl.quality) < 60 && compositeQuality(crm.quality) < 60 && (!gl.ownerId || !crm.ownerId)) {
      if (tick >= 12) push(makeKpiConflictPressure(tick), "kpi_conflict_revenue");
    }
  }

  // 2. Shadow spreadsheet
  if (!hasOpenType(pressures, "shadow_data_risk") && cooledDown("shadow_spreadsheet", tick, pressureCooldowns)) {
    const gl = datasets["general-ledger"];
    if (gl && compositeQuality(gl.quality) < 50 && !gl.stewardId && tick >= 10) {
      push(makeShadowSpreadsheetPressure(tick), "shadow_spreadsheet");
    }
  }

  // 3. Board KPI pack
  if (!hasOpenForDataset(pressures, "board-kpi-pack", "kpi_conflict") && cooledDown("board_kpi", tick, pressureCooldowns)) {
    const bkpi = datasets["board-kpi-pack"];
    const gl = datasets["general-ledger"];
    const rf = datasets["revenue-forecast"];
    if (bkpi && gl && rf && (compositeQuality(bkpi.quality) < 50 || (compositeQuality(gl.quality) < 55 && compositeQuality(rf.quality) < 55))) {
      if (tick >= 15) push(makeBoardKpiPressure(tick), "board_kpi");
    }
  }

  // 4. Compliance — restricted datasets without custodian
  if (generated < MAX_NEW && cooledDown("compliance_restricted", tick, pressureCooldowns)) {
    for (const ds of Object.values(datasets)) {
      const fd = DATASET_BY_ID[ds.id];
      if (fd && fd.classification === "restricted" && !ds.custodianId && ds.governanceRisk > 70) {
        if (!hasOpenForDataset(pressures, ds.id, "compliance_risk")) {
          push(makeCompliancePressure(ds.id, tick), "compliance_restricted");
          break;
        }
      }
    }
  }

  // 5. Audit demand
  if (!hasOpenType(pressures, "audit_demand") && cooledDown("audit_demand", tick, pressureCooldowns)) {
    if (tick >= nextAuditTick || tick >= 35) {
      push(makeAuditDemandPressure(tick), "audit_demand");
    }
  }

  // 6. Payroll ghost employees
  if (!hasOpenForDataset(pressures, "payroll", "data_quality_failure") && cooledDown("payroll_ghost", tick, pressureCooldowns)) {
    const payroll = datasets["payroll"];
    const emp = datasets["employee-master"];
    if (payroll && emp && !payroll.stewardId && !emp.stewardId && tick >= 15) {
      push(makePayrollGhostPressure(tick), "payroll_ghost");
    }
  }

  // 7. Customer chaos
  if (!hasOpenForDataset(pressures, "customer-master", "data_quality_failure") && cooledDown("customer_chaos", tick, pressureCooldowns)) {
    const cm = datasets["customer-master"];
    if (cm && compositeQuality(cm.quality) < 60 && !cm.stewardId && tick >= 12) {
      push(makeCustomerChaosPressure(tick), "customer_chaos");
    }
  }

  // 8. Dependency cascade
  if (generated < MAX_NEW && cooledDown("dependency", tick, pressureCooldowns)) {
    for (const [dsId] of Object.entries(datasets)) {
      const fd = DATASET_BY_ID[dsId];
      if (!fd) continue;
      for (const upId of fd.upstreamIds) {
        const up = datasets[upId];
        if (up && compositeQuality(up.quality) < 40) {
          if (!hasOpenForDataset(pressures, dsId, "dependency_cascade")) {
            push(makeDependencyPressure(dsId, upId, tick), "dependency");
            break;
          }
        }
      }
      if (generated >= MAX_NEW) break;
    }
  }

  // 9. Governance gap on critical datasets
  if (generated < MAX_NEW && cooledDown("governance_gap", tick, pressureCooldowns) && tick >= 5) {
    const criticalIds = ["general-ledger", "customer-master", "employee-master", "payroll", "board-kpi-pack", "regulatory-filing"];
    for (const id of criticalIds) {
      const ds = datasets[id];
      if (ds && !ds.ownerId && ds.governanceRisk > 70) {
        if (!hasOpenForDataset(pressures, id, "governance_gap")) {
          const fd = DATASET_BY_ID[id];
          const srcMap: Record<string, string> = { Finance: "cfo", Sales: "cro", Marketing: "cmo", HR: "chro", Operations: "coo" };
          push(makeGovernanceGapPressure(id, tick, [
            `${fd?.name} has a criticality of ${fd?.criticality}/5`,
            "No Data Owner has been assigned to this dataset",
            `Governance risk is currently ${ds.governanceRisk}`,
          ], srcMap[fd?.domain ?? "Finance"] ?? "cfo", "high"), "governance_gap");
          break;
        }
      }
    }
  }

  // 10. Stakeholder frustration
  if (generated < MAX_NEW && cooledDown("stakeholder_frustration", tick, pressureCooldowns)) {
    for (const s of stakeholders) {
      if (s.patience < 30) {
        if (!pressures.some((p) => p.type === "stakeholder_frustration" && p.sourceStakeholderId === s.id && p.status === "open")) {
          push(makeStakeholderFrustrationPressure(s.id, s.name, s.domain, tick), "stakeholder_frustration");
          break;
        }
      }
    }
  }

  return newPressures;
}

// ── Pressure lifecycle (advance timers, escalate expired) ─────────────────

export function tickPressureLifecycle(
  pressures: BusinessPressure[],
  tick: number
): BusinessPressure[] {
  return pressures.map((p) => {
    if (p.status !== "open") return p;
    if (p.tickDeadline !== undefined && tick >= p.tickDeadline) {
      return { ...p, status: "expired" as const };
    }
    // Escalate if it's been 20+ ticks and urgency isn't already critical
    if (p.urgency !== "critical" && tick - p.tickAppeared >= 20) {
      return { ...p, urgency: "critical" as const };
    }
    return p;
  });
}
