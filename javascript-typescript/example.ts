// TypeScript Example: Portfolio Skill Model
export interface Skill {
  id: string;
  name: string;
  level: string;
  category: 'frontend' | 'backend' | 'tools';
}

export function filterSkills(skills: Skill[], category: string): Skill[] {
  if (category === 'all') return skills;
  return skills.filter(s => s.category === category);
}
