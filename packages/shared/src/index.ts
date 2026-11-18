/**
 * Browser-safe contracts shared by the data registration package, the
 * frontend, and the seed script.
 *
 * Keep each record shape aligned with its decorated runtime entity in
 * `@rayfin-app/data`. This package must stay isomorphic, so do not import the
 * decorated classes here.
 */

export type QuestionType = 'multiple_choice' | 'true_false';
export type NaughtyOrNice = 'naughty' | 'nice';

export const SCENARIO_CATEGORIES = [
  'Capacity & Cost',
  'Security & Governance',
  'CI/CD',
  'Modeling',
  'Performance',
  'Workspace Hygiene',
] as const;
export type ScenarioCategory = (typeof SCENARIO_CATEGORIES)[number];

export interface ScenarioRecord {
  id: string;
  /** Stable, unique identity key used by the seed script. */
  slug: string;
  prompt: string;
  questionType: string;
  /** JSON-encoded string[] for multiple_choice; null for true_false. */
  options?: string | null;
  correctAnswer: string;
  explanation: string;
  naughtyOrNice: string;
  category: string;
  pointValue: number;
  /** Write-only owner stamp; not returned on reads. */
  author_id: string;
}

export interface QuizAttemptRecord {
  id: string;
  playerName: string;
  season: string;
  startedAt: Date;
  completedAt: Date;
  score: number;
  verdict: string;
  /** JSON-encoded AnswerEntry[]. */
  answersJson: string;
}

export interface AnswerEntry {
  scenarioId: string;
  selectedAnswer: string;
  correct: boolean;
}

export const CURRENT_SEASON = 'Winter2026';
export const PLAYER_NAME_MAX_LENGTH = 30;

/**
 * Trims, collapses whitespace, strips control characters, and caps a
 * user-supplied display name. Returns an empty string when nothing usable is
 * left; callers should reject that. Render the result as plain text only.
 */
export function sanitizePlayerName(raw: string): string {
  return Array.from(
    raw
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  )
    .slice(0, PLAYER_NAME_MAX_LENGTH)
    .join('')
    .trim();
}

export * from './scoring.js';

export type UniversalAppSchema = {
  Scenario: ScenarioRecord;
  QuizAttempt: QuizAttemptRecord;
};
