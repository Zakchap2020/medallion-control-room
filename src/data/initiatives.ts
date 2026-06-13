import type { InitiativeDefinition } from "../models/types";

export const INITIATIVE_DEFINITIONS: InitiativeDefinition[] = [
  {
    key: "mdm-program",
    name: "Master Data Management Programme",
    shortName: "MDM Programme",
    description: "Establish a single authoritative source for Customer and Employee data. Eliminates duplicates, resolves identity conflicts across systems.",
    cyclesRequired: 4,
    capacityCostPerCycle: 2,
    launchCost: 2,
    effects: [
      { type: "quality_floor", target: "customer-master", value: 60 },
      { type: "quality_floor", target: "employee-master", value: 60 },
      { type: "risk_reduction", target: "customer-master", value: 25 },
      { type: "risk_reduction", target: "employee-master", value: 25 },
      { type: "maturity_boost", value: 8 },
    ],
  },
  {
    key: "governance-council",
    name: "Data Governance Council",
    shortName: "Governance Council",
    description: "Formalise cross-domain governance through a standing council. Establishes data policy, resolves ownership disputes, and drives accountability.",
    cyclesRequired: 2,
    capacityCostPerCycle: 1,
    launchCost: 1,
    effects: [
      { type: "pressure_reduction", target: "governance_gap", value: 30 },
      { type: "maturity_boost", value: 10 },
      { type: "trust_boost", value: 5 },
    ],
  },
  {
    key: "audit-preparation",
    name: "Regulatory Audit Preparation",
    shortName: "Audit Prep",
    description: "Prepare data lineage documentation, ownership attestations, and compliance evidence for the upcoming regulatory review.",
    cyclesRequired: 1,
    capacityCostPerCycle: 2,
    launchCost: 2,
    effects: [
      { type: "risk_reduction", target: "regulatory-filing", value: 40 },
      { type: "trust_boost", value: 10 },
    ],
  },
  {
    key: "data-catalogue",
    name: "Enterprise Data Catalogue",
    shortName: "Data Catalogue",
    description: "Deploy a searchable catalogue of all enterprise datasets with metadata, ownership, lineage, and quality scores visible to the business.",
    cyclesRequired: 2,
    capacityCostPerCycle: 1,
    launchCost: 1,
    effects: [
      { type: "risk_reduction", value: 15 },
      { type: "maturity_boost", value: 8 },
      { type: "trust_boost", value: 5 },
    ],
  },
  {
    key: "platform-modernisation",
    name: "Data Platform Modernisation",
    shortName: "Platform Uplift",
    description: "Rebuild the data infrastructure on a modern lakehouse architecture. Enables automated quality monitoring, lineage tracking, and scalable governance.",
    cyclesRequired: 5,
    capacityCostPerCycle: 3,
    launchCost: 3,
    prerequisites: ["data-catalogue"],
    effects: [
      { type: "quality_floor", value: 40 },
      { type: "capacity_increase", value: 2 },
      { type: "maturity_boost", value: 12 },
      { type: "trust_boost", value: 8 },
    ],
  },
  {
    key: "privacy-programme",
    name: "Data Privacy & Classification Programme",
    shortName: "Privacy Programme",
    description: "Classify all sensitive datasets, implement access controls, and establish data handling standards for restricted and confidential data.",
    cyclesRequired: 2,
    capacityCostPerCycle: 1,
    launchCost: 1,
    effects: [
      { type: "risk_reduction", target: "restricted", value: 35 },
      { type: "risk_reduction", target: "confidential", value: 20 },
      { type: "trust_boost", value: 5 },
    ],
  },
  {
    key: "executive-data-literacy",
    name: "Executive Data Literacy Programme",
    shortName: "Exec Literacy",
    description: "Help the C-suite interpret data correctly, reduce misinterpretation of KPIs, and build confidence in governed data over shadow sources.",
    cyclesRequired: 1,
    capacityCostPerCycle: 1,
    launchCost: 1,
    effects: [
      { type: "pressure_reduction", target: "stakeholder_frustration", value: 40 },
      { type: "trust_boost", value: 8 },
    ],
  },
  {
    key: "self-service-analytics",
    name: "Self-Service Analytics Platform",
    shortName: "Self-Service BI",
    description: "Give business users direct access to governed, trusted data through a self-service BI layer. Reduces reliance on ad-hoc data requests and shadow spreadsheets.",
    cyclesRequired: 3,
    capacityCostPerCycle: 2,
    launchCost: 2,
    prerequisites: ["data-catalogue"],
    effects: [
      { type: "pressure_reduction", target: "executive_escalation", value: 30 },
      { type: "pressure_reduction", target: "shadow_data_risk", value: 35 },
      { type: "maturity_boost", value: 7 },
      { type: "trust_boost", value: 6 },
    ],
  },
];

export const INITIATIVE_BY_KEY: Record<string, InitiativeDefinition> = Object.fromEntries(
  INITIATIVE_DEFINITIONS.map((d) => [d.key, d])
);
