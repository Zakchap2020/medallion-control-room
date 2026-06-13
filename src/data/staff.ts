import type { StaffMember, Stakeholder } from "../models/types";

export const ALL_STAFF: StaffMember[] = [
  // ── Data Owners (senior business leaders, one per domain) ─────────────────
  {
    id: "owner-finance", name: "Margaret Holloway", title: "VP Finance",
    role: "DataOwner", domain: "Finance",
    skills: { governance: 70, technical: 40, influence: 85 },
    trait: "political", avatarIndex: 0, active: true,
  },
  {
    id: "owner-sales", name: "Ryan Torres", title: "Sales Director",
    role: "DataOwner", domain: "Sales",
    skills: { governance: 60, technical: 35, influence: 80 },
    trait: "ambitious", avatarIndex: 1, active: true,
  },
  {
    id: "owner-marketing", name: "Priya Nair", title: "Marketing Director",
    role: "DataOwner", domain: "Marketing",
    skills: { governance: 55, technical: 45, influence: 75 },
    trait: "ambitious", avatarIndex: 2, active: true,
  },
  {
    id: "owner-hr", name: "James Okafor", title: "HR Director",
    role: "DataOwner", domain: "HR",
    skills: { governance: 75, technical: 30, influence: 70 },
    trait: "veteran", avatarIndex: 3, active: true,
  },
  {
    id: "owner-ops", name: "Elena Vasquez", title: "COO (delegate)",
    role: "DataOwner", domain: "Operations",
    skills: { governance: 65, technical: 55, influence: 80 },
    trait: "methodical", avatarIndex: 4, active: true,
  },

  // ── Data Stewards (embedded in domains, day-to-day quality) ──────────────
  {
    id: "steward-finance", name: "Ben Walsh", title: "Finance Data Steward",
    role: "DataSteward", domain: "Finance",
    skills: { governance: 80, technical: 60, influence: 45 },
    trait: "methodical", avatarIndex: 5, active: true,
  },
  {
    id: "steward-sales", name: "Sophie Kim", title: "Sales Operations Steward",
    role: "DataSteward", domain: "Sales",
    skills: { governance: 75, technical: 55, influence: 50 },
    trait: "reliable", avatarIndex: 6, active: true,
  },
  {
    id: "steward-marketing", name: "Marcus Chen", title: "Marketing Data Steward",
    role: "DataSteward", domain: "Marketing",
    skills: { governance: 65, technical: 60, influence: 40 },
    trait: "methodical", avatarIndex: 7, active: true,
  },
  {
    id: "steward-hr", name: "Aisha Yusuf", title: "HR Data Steward",
    role: "DataSteward", domain: "HR",
    skills: { governance: 82, technical: 50, influence: 55 },
    trait: "veteran", avatarIndex: 8, active: true,
  },
  {
    id: "steward-ops", name: "Carlos Mendez", title: "Operations Data Coordinator",
    role: "DataSteward", domain: "Operations",
    skills: { governance: 70, technical: 65, influence: 45 },
    trait: "reliable", avatarIndex: 9, active: true,
  },

  // ── Data Engineers (technical, support pipeline and quality) ─────────────
  {
    id: "engineer-1", name: "Tom Nakamura", title: "Senior Data Engineer",
    role: "DataEngineer", domain: "Finance",
    skills: { governance: 55, technical: 90, influence: 35 },
    trait: "methodical", avatarIndex: 10, active: true,
  },
  {
    id: "engineer-2", name: "Leah Osei", title: "Data Pipeline Engineer",
    role: "DataEngineer", domain: "Sales",
    skills: { governance: 45, technical: 85, influence: 30 },
    trait: "veteran", avatarIndex: 11, active: true,
  },
  {
    id: "engineer-3", name: "Dev Patel", title: "Data Engineer",
    role: "DataEngineer", domain: "HR",
    skills: { governance: 50, technical: 80, influence: 25 },
    trait: "methodical", avatarIndex: 12, active: true,
  },
  {
    id: "engineer-4", name: "Fatima Al-Hassan", title: "Data Engineer",
    role: "DataEngineer", domain: "Operations",
    skills: { governance: 48, technical: 82, influence: 28 },
    trait: "reliable", avatarIndex: 13, active: true,
  },

  // ── Data Custodians (technical custody, access, storage) ─────────────────
  {
    id: "custodian-1", name: "Oliver Reed", title: "Lead Data Custodian",
    role: "DataCustodian", domain: "Finance",
    skills: { governance: 65, technical: 75, influence: 40 },
    trait: "veteran", avatarIndex: 14, active: true,
  },
  {
    id: "custodian-2", name: "Nina Petrov", title: "Data Custodian",
    role: "DataCustodian", domain: "HR",
    skills: { governance: 60, technical: 72, influence: 35 },
    trait: "methodical", avatarIndex: 15, active: true,
  },
  {
    id: "custodian-3", name: "Kwame Asante", title: "Data Custodian",
    role: "DataCustodian", domain: "Operations",
    skills: { governance: 62, technical: 70, influence: 38 },
    trait: "reliable", avatarIndex: 16, active: true,
  },
];

// Pressure-generating stakeholders — not assignable, not controllable
export const ALL_STAKEHOLDERS: Stakeholder[] = [
  {
    id: "cfo", name: "Richard Holden", title: "Chief Financial Officer",
    role: "CFO", domain: "Finance", patience: 65,
    avatarIndex: 17, trait: "impatient",
  },
  {
    id: "cro", name: "Samira Patel", title: "Chief Revenue Officer",
    role: "CRO", domain: "Sales", patience: 70,
    avatarIndex: 18, trait: "ambitious",
  },
  {
    id: "cmo", name: "Diana Osei", title: "Chief Marketing Officer",
    role: "CMO", domain: "Marketing", patience: 72,
    avatarIndex: 19, trait: "political",
  },
  {
    id: "chro", name: "William Asante", title: "Chief People Officer",
    role: "CHRO", domain: "HR", patience: 75,
    avatarIndex: 20, trait: "veteran",
  },
  {
    id: "coo", name: "Marcus Webb", title: "Chief Operating Officer",
    role: "COO", domain: "Operations", patience: 70,
    avatarIndex: 21, trait: "methodical",
  },
  {
    id: "board", name: "Victor Ashby", title: "Non-Executive Director",
    role: "BoardMember", domain: "Finance", patience: 60,
    avatarIndex: 22, trait: "impatient",
  },
  {
    id: "ceo", name: "Catherine Lim", title: "Chief Executive Officer",
    role: "CEO", domain: "Finance", patience: 68,
    avatarIndex: 23, trait: "ambitious",
  },
];
