/**
 * Scoring and verdict rules. Shared by the frontend and the demo seed script
 * so every stored verdict comes from the same thresholds.
 */

export type VerdictTier = 'coal' | 'apprentice' | 'nice' | 'certified';

export interface Verdict {
  tier: VerdictTier;
  name: string;
  /** Inclusive lower bound, in whole percent. */
  minPercent: number;
  blurb: string;
}

/** Ordered from highest to lowest threshold. */
export const VERDICTS: readonly Verdict[] = [
  {
    tier: 'certified',
    name: 'North Pole Certified',
    minPercent: 90,
    blurb: 'The elf foreman tried to find a flaw. He could not. Your workspace gets the Certified badge.',
  },
  {
    tier: 'nice',
    name: 'Nice List',
    minPercent: 70,
    blurb: 'Solid instincts. A few rough edges, but Santa is signing off on your deployment pipeline.',
  },
  {
    tier: 'apprentice',
    name: 'Workshop Apprentice',
    minPercent: 40,
    blurb: 'You know your way around the workshop, but someone should review your pull requests.',
  },
  {
    tier: 'coal',
    name: 'Lump of Coal',
    minPercent: 0,
    blurb: 'Bold choices were made. Mostly in Production. On a Friday. Here is your coal.',
  },
];

export function percentOf(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.round((Math.max(0, Math.min(score, maxScore)) / maxScore) * 100);
}

export function verdictFor(percent: number): Verdict {
  return VERDICTS.find((v) => percent >= v.minPercent) ?? VERDICTS[VERDICTS.length - 1]!;
}

export function verdictByName(name: string): Verdict | undefined {
  return VERDICTS.find((v) => v.name === name);
}

/** Points earned for one answer: full pointValue when correct, otherwise 0. */
export function pointsFor(correct: boolean, pointValue: number): number {
  return correct ? pointValue : 0;
}

/** Parses the JSON-encoded options column; returns [] for null or bad data. */
export function parseOptions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((o): o is string => typeof o === 'string') : [];
  } catch {
    return [];
  }
}
