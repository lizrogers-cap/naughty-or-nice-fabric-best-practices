/**
 * Seeds a handful of demo QuizAttempt rows so the scoreboard isn't empty when
 * recording the contest demo.
 *
 *   npm run seed:demo
 *   npm run seed:demo -- --check   # print the plan, no network
 *
 * Idempotent: a demo row is identified by (playerName, season). Names that
 * already have a row this season are skipped, so reruns never duplicate.
 *
 * All names are invented, generically festive characters. Never put a real
 * person's name here.
 */
import { CURRENT_SEASON, percentOf, verdictFor } from '@rayfin-app/shared';

import { scenarios } from '../content/scenarios.js';
import { connect } from './lib/rayfin-node.js';

/** Fraction of the maximum score each demo player earned. */
const DEMO_PLAYERS: ReadonlyArray<{ playerName: string; fraction: number; daysAgo: number }> = [
  { playerName: 'Tinsel McTwinkle', fraction: 1.0, daysAgo: 6 },
  { playerName: 'Sugarplum Gearheart', fraction: 0.92, daysAgo: 5 },
  { playerName: 'Holly Byteberry', fraction: 0.85, daysAgo: 5 },
  { playerName: 'Pepper Minttwist', fraction: 0.77, daysAgo: 4 },
  { playerName: 'Snowy Dataflake', fraction: 0.62, daysAgo: 4 },
  { playerName: 'Gumdrop Widgetsworth', fraction: 0.46, daysAgo: 3 },
  { playerName: 'Cocoa Nogwhistle', fraction: 0.38, daysAgo: 3 },
  { playerName: 'Jingle Sprocketwhistle', fraction: 0.23, daysAgo: 2 },
  { playerName: 'Sprinkles O\'Frost', fraction: 0.15, daysAgo: 2 },
  { playerName: 'Krampus Jr.', fraction: 0.0, daysAgo: 1 },
];

function buildRows(now = new Date()) {
  const maxScore = scenarios.reduce((sum, s) => sum + s.pointValue, 0);
  const step = scenarios[0]?.pointValue ?? 10;
  return DEMO_PLAYERS.map(({ playerName, fraction, daysAgo }, i) => {
    const score = Math.round((maxScore * fraction) / step) * step;
    const completedAt = new Date(now.getTime() - daysAgo * 86_400_000 - i * 3_600_000);
    const startedAt = new Date(completedAt.getTime() - (4 + (i % 4)) * 60_000);
    return {
      playerName,
      season: CURRENT_SEASON,
      startedAt,
      completedAt,
      score,
      verdict: verdictFor(percentOf(score, maxScore)).name,
      answersJson: '[]',
    };
  });
}

async function main(): Promise<void> {
  const rows = buildRows();
  if (process.argv.includes('--check')) {
    for (const r of rows) console.log(`  ${String(r.score).padStart(3)}  ${r.verdict.padEnd(22)} ${r.playerName}`);
    return;
  }

  const { client, close } = await connect();
  try {
    const existing = await client.data.QuizAttempt.select(['id', 'playerName'])
      .where({ season: { eq: CURRENT_SEASON } })
      .first(10_000)
      .execute();
    const taken = new Set(existing.map((r) => r.playerName));

    let created = 0;
    for (const row of rows) {
      if (taken.has(row.playerName)) {
        console.log(`  unchanged  ${row.playerName}`);
        continue;
      }
      await client.data.QuizAttempt.create(row);
      created++;
      console.log(`  created    ${row.playerName} (${row.score}, ${row.verdict})`);
    }
    console.log(`Done: ${created} created, ${rows.length - created} unchanged.`);
  } finally {
    close();
  }
}

main().catch((err: unknown) => {
  console.error(`✖ Demo seeding failed: ${(err as Error).message ?? String(err)}`);
  process.exit(1);
});
