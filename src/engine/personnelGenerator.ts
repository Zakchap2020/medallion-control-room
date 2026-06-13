import type { Person, PersonRoleType, PersonTrait } from "../models/types";

const FIRST_NAMES = [
  "Amara", "Yuki", "Carlos", "Priya", "Jordan", "Sam", "Maya", "Chris",
  "Taylor", "Ren", "Alex", "Kenji", "Fatima", "Liam", "Zara", "Omar",
  "Elena", "Marcus", "Suki", "Tobias", "Nadia", "Felix", "Imani", "Lars",
  "Chloe", "Dev", "Rania", "Kai", "Sofia", "Emeka",
];

const LAST_NAMES = [
  "Hayes", "Nkosi", "Patel", "Adewale", "Watanabe", "Chen", "Obi", "Morgan",
  "Reyes", "Kim", "Andersen", "Okonkwo", "Baptiste", "Singh", "Nakamura",
  "Diallo", "Thompson", "Vasquez", "Petrov", "Osei", "Larsson", "Kamara",
  "Hoffmann", "Tanaka", "Müller",
];

const TRAITS: PersonTrait[] = ["methodical", "ambitious", "veteran", "reliable", "transient"];

export const TRAIT_DEPARTURE_CHANCE: Record<PersonTrait, number> = {
  methodical: 0.02,
  ambitious:  0.06,
  veteran:    0.035,
  reliable:   0,
  transient:  0.09,
};

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Keep a set of used names per generation to avoid duplicates
function pickName(used: Set<string>): string {
  let name = "";
  let attempts = 0;
  do {
    const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const last  = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    name = `${first} ${last}`;
    attempts++;
  } while (used.has(name) && attempts < 50);
  used.add(name);
  return name;
}

function pickTrait(): PersonTrait {
  return TRAITS[Math.floor(Math.random() * TRAITS.length)];
}

function skillsForRole(role: PersonRoleType, trait: PersonTrait) {
  const vetBonus = trait === "veteran" ? 1 : 0;
  const ambBonus = trait === "ambitious" ? 1 : 0;
  switch (role) {
    case "owner":
      return {
        governance: rnd(6, 9) + vetBonus,
        analysis:   rnd(4, 7) + ambBonus,
        engineering: rnd(2, 5),
      };
    case "steward":
      return {
        governance: rnd(5, 8) + vetBonus,
        analysis:   rnd(6, 9) + ambBonus,
        engineering: rnd(3, 6),
      };
    case "custodian":
      return {
        governance:  rnd(3, 6),
        analysis:    rnd(3, 6) + ambBonus,
        engineering: rnd(7, 10) + vetBonus,
      };
  }
}

function makePerson(
  id: string,
  role: PersonRoleType,
  used: Set<string>
): Person {
  const trait  = pickTrait();
  const name   = pickName(used);
  return {
    id,
    name,
    roleType: role,
    skills: skillsForRole(role, trait),
    trait,
    active: true,
  };
}

export function generatePersonnel(): Person[] {
  const used = new Set<string>();
  return [
    makePerson("person-1", "owner",     used),
    makePerson("person-2", "owner",     used),
    makePerson("person-3", "steward",   used),
    makePerson("person-4", "steward",   used),
    makePerson("person-5", "custodian", used),
    makePerson("person-6", "custodian", used),
  ];
}
