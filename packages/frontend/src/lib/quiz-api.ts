import {
  CURRENT_SEASON,
  parseOptions,
  type AnswerEntry,
  type QuestionType,
} from '@rayfin-app/shared';

import { getRayfinClient } from './rayfin-client';

/** A scenario as the quiz uses it: options already decoded. */
export interface QuizScenario {
  id: string;
  slug: string;
  prompt: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
  naughtyOrNice: string;
  category: string;
  pointValue: number;
}

export interface LeaderboardRow {
  id: string;
  playerName: string;
  score: number;
  verdict: string;
  completedAt: Date;
}

/** Upper bound on scenarios fetched; content is a small curated set. */
const MAX_SCENARIOS = 200;

export async function loadScenarios(): Promise<QuizScenario[]> {
  const client = await getRayfinClient();
  const rows = await client.data.Scenario.select([
    'id',
    'slug',
    'prompt',
    'questionType',
    'options',
    'correctAnswer',
    'explanation',
    'naughtyOrNice',
    'category',
    'pointValue',
  ])
    .orderBy({ slug: 'asc' })
    .first(MAX_SCENARIOS)
    .execute();

  return rows
    .filter((r) => r.questionType === 'true_false' || r.questionType === 'multiple_choice')
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      prompt: r.prompt,
      questionType: r.questionType as QuestionType,
      options:
        r.questionType === 'true_false' ? ['naughty', 'nice'] : parseOptions(r.options),
      correctAnswer: r.correctAnswer,
      explanation: r.explanation,
      naughtyOrNice: r.naughtyOrNice,
      category: r.category,
      pointValue: r.pointValue > 0 ? r.pointValue : 10,
    }))
    .filter((s) => s.options.length >= 2);
}

export interface NewAttempt {
  playerName: string;
  startedAt: Date;
  completedAt: Date;
  score: number;
  verdict: string;
  answers: AnswerEntry[];
}

export async function submitAttempt(attempt: NewAttempt): Promise<string> {
  const client = await getRayfinClient();
  const created = await client.data.QuizAttempt.create({
    playerName: attempt.playerName,
    season: CURRENT_SEASON,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
    score: attempt.score,
    verdict: attempt.verdict,
    answersJson: JSON.stringify(attempt.answers),
  });
  return created.id;
}

const LEADERBOARD_FIELDS = ['id', 'playerName', 'score', 'verdict', 'completedAt'] as const;

function toRow(r: { id: string; playerName: string; score: number; verdict: string; completedAt: Date | string }): LeaderboardRow {
  return {
    id: r.id,
    playerName: r.playerName,
    score: r.score,
    verdict: r.verdict,
    completedAt: new Date(r.completedAt),
  };
}

/** Fixed top-10 lists for the season. `.execute()` on purpose: no next page. */
export async function loadLeaderboards(
  season: string = CURRENT_SEASON,
): Promise<{ nice: LeaderboardRow[]; naughty: LeaderboardRow[] }> {
  const client = await getRayfinClient();

  const [topNice, topNaughty] = await Promise.all([
    client.data.QuizAttempt.select([...LEADERBOARD_FIELDS])
      .where({ season: { eq: season } })
      .orderBy({ score: 'desc' })
      .orderBy({ completedAt: 'asc' })
      .first(10)
      .execute(),
    client.data.QuizAttempt.select([...LEADERBOARD_FIELDS])
      .where({ season: { eq: season } })
      .orderBy({ score: 'asc' })
      .orderBy({ completedAt: 'asc' })
      .first(10)
      .execute(),
  ]);

  return { nice: topNice.map(toRow), naughty: topNaughty.map(toRow) };
}
