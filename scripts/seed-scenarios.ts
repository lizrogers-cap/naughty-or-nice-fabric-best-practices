/**
 * Idempotent scenario seeder.
 *
 *   npm run content:publish           # the normal way: unlock, seed, re-lock (see publish-scenarios.ts)
 *   npm run seed:scenarios            # raw upsert; fails while Scenario writes are locked
 *   npm run seed:scenarios -- --plan  # read-only diff against the database
 *   npm run seed:scenarios -- --check # validate content only, no network
 *
 * Each scenario is matched on `slug`: missing rows are created, rows whose fields
 * differ are updated, and identical rows are reported as "unchanged". Reruns
 * are safe.
 *
 * Connection and identity: see scripts/lib/rayfin-node.ts. Writes are stamped
 * with the signed-in identity, and only that identity can update the rows later.
 */
import type { RayfinClient } from '@microsoft/rayfin-client';
import type { ScenarioRecord, UniversalAppSchema } from '@rayfin-app/shared';
import { SCENARIO_CATEGORIES } from '@rayfin-app/shared';
import { scenarios, type ScenarioContent } from '../content/scenarios.js';
import { connect } from './lib/rayfin-node.js';

/** Field limits mirror packages/data/src/Scenario.ts. */
const LIMITS = {
  slug: 80,
  prompt: 1000,
  options: 1000,
  correctAnswer: 200,
  explanation: 2000,
  category: 50,
} as const;

type SeedFields = Omit<ScenarioRecord, 'id' | 'author_id'>;
const COMPARED_FIELDS = [
  'prompt',
  'questionType',
  'options',
  'correctAnswer',
  'explanation',
  'naughtyOrNice',
  'category',
  'pointValue',
] as const satisfies readonly (keyof SeedFields)[];

function toRow(s: ScenarioContent): SeedFields {
  return {
    slug: s.slug,
    prompt: s.prompt,
    questionType: s.questionType,
    options: s.options && s.options.length > 0 ? JSON.stringify(s.options) : null,
    correctAnswer: s.correctAnswer,
    explanation: s.explanation,
    naughtyOrNice: s.naughtyOrNice,
    category: s.category,
    pointValue: s.pointValue,
  };
}

export function validateScenarios(list: readonly ScenarioContent[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const categoriesCovered = new Set<string>();

  list.forEach((s, i) => {
    const at = `scenario #${i + 1} (${s.slug || 'no slug'})`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug)) errors.push(`${at}: slug must be kebab-case`);
    if (seen.has(s.slug)) errors.push(`${at}: duplicate slug`);
    seen.add(s.slug);

    if (!(SCENARIO_CATEGORIES as readonly string[]).includes(s.category)) {
      errors.push(`${at}: unknown category "${s.category}"`);
    }
    categoriesCovered.add(s.category);

    if (s.naughtyOrNice !== 'naughty' && s.naughtyOrNice !== 'nice') {
      errors.push(`${at}: naughtyOrNice must be "naughty" or "nice"`);
    }
    if (!Number.isInteger(s.pointValue) || s.pointValue <= 0) {
      errors.push(`${at}: pointValue must be a positive integer`);
    }

    if (s.questionType === 'true_false') {
      if (s.options && s.options.length > 0) errors.push(`${at}: true_false must have options: null`);
      if (s.correctAnswer !== 'naughty' && s.correctAnswer !== 'nice') {
        errors.push(`${at}: true_false correctAnswer must be "naughty" or "nice"`);
      }
    } else if (s.questionType === 'multiple_choice') {
      if (!s.options || s.options.length < 2) errors.push(`${at}: multiple_choice needs 2+ options`);
      else {
        if (new Set(s.options).size !== s.options.length) errors.push(`${at}: duplicate options`);
        if (!s.options.includes(s.correctAnswer)) {
          errors.push(`${at}: correctAnswer must exactly match one of the options`);
        }
      }
    } else {
      errors.push(`${at}: unknown questionType "${String(s.questionType)}"`);
    }

    const row = toRow(s);
    for (const [field, max] of Object.entries(LIMITS)) {
      const value = row[field as keyof typeof LIMITS];
      if (typeof value === 'string' && (value.length === 0 || value.length > max)) {
        errors.push(`${at}: ${field} length ${value.length} is outside 1..${max}`);
      }
    }
  });

  for (const category of SCENARIO_CATEGORIES) {
    if (!categoriesCovered.has(category)) errors.push(`no scenario covers category "${category}"`);
  }
  if (list.length < 12) errors.push(`need at least 12 scenarios, found ${list.length}`);
  return errors;
}

function sameContent(existing: Partial<ScenarioRecord>, wanted: SeedFields): boolean {
  return COMPARED_FIELDS.every((field) => {
    const a = existing[field] ?? null;
    const b = wanted[field] ?? null;
    return a === b;
  });
}

async function fetchExistingBySlug(
  client: RayfinClient<UniversalAppSchema>,
): Promise<Map<string, Partial<ScenarioRecord>>> {
  const bySlug = new Map<string, Partial<ScenarioRecord>>();
  let after: string | undefined;
  do {
    let query = client.data.Scenario.select(['id', 'slug', ...COMPARED_FIELDS])
      .orderBy({ slug: 'asc' })
      .first(100);
    if (after) query = query.after(after);
    const page = await query.executePaginated();
    for (const row of page.items) bySlug.set(row.slug as string, row as Partial<ScenarioRecord>);
    after = page.hasNextPage ? (page.endCursor ?? undefined) : undefined;
  } while (after);
  return bySlug;
}

/** `--plan` exit code meaning "content differs from the database". */
const PLAN_HAS_CHANGES = 3;

async function main(): Promise<void> {
  const checkOnly = process.argv.includes('--check');
  const planOnly = process.argv.includes('--plan');

  const errors = validateScenarios(scenarios);
  if (errors.length > 0) {
    console.error(`✖ content/scenarios.ts has ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✔ ${scenarios.length} scenarios valid, all ${SCENARIO_CATEGORIES.length} categories covered.`);
  if (checkOnly) return;

  const { client, userId: authorId, close } = await connect();
  try {
    const existing = await fetchExistingBySlug(client);
    const tally = { created: 0, updated: 0, unchanged: 0, failed: 0 };
    const verb = (done: string, planned: string) => (planOnly ? planned : done).padEnd(13);

    for (const scenario of scenarios) {
      const wanted = toRow(scenario);
      const current = existing.get(scenario.slug);
      try {
        if (!current?.id) {
          if (!planOnly) await client.data.Scenario.create({ ...wanted, author_id: authorId });
          tally.created++;
          console.log(`  ${verb('created', 'would create')}${scenario.slug}`);
        } else if (sameContent(current, wanted)) {
          tally.unchanged++;
          console.log(`  ${verb('unchanged', 'unchanged')}${scenario.slug}`);
        } else {
          if (!planOnly) await client.data.Scenario.update({ id: current.id }, { ...wanted, author_id: authorId });
          tally.updated++;
          console.log(`  ${verb('updated', 'would update')}${scenario.slug}`);
        }
      } catch (err) {
        tally.failed++;
        console.error(
          `  FAILED       ${scenario.slug}: ${(err as Error).message}\n` +
            '               Scenario writes are locked by default. Use `npm run content:publish`,\n' +
            '               which unlocks, seeds and re-locks. Rows can only be updated by the\n' +
            '               identity that created them.',
        );
      }
    }

    const extra = [...existing.keys()].filter((slug) => !scenarios.some((s) => s.slug === slug));
    if (extra.length > 0) {
      console.warn(`  note: ${extra.length} row(s) in the database are not in content/scenarios.ts: ${extra.join(', ')}`);
    }

    if (planOnly) {
      const pending = tally.created + tally.updated;
      console.log(`Plan: ${tally.created} to create, ${tally.updated} to update, ${tally.unchanged} unchanged.`);
      // Exit code tells content:publish whether an unlock is needed.
      process.exitCode = pending > 0 ? PLAN_HAS_CHANGES : 0;
      return;
    }
    console.log(
      `Done: ${tally.created} created, ${tally.updated} updated, ${tally.unchanged} unchanged, ${tally.failed} failed.`,
    );
    if (tally.failed > 0) process.exitCode = 1;
  } finally {
    close();
  }
}

main().catch((err: unknown) => {
  console.error(`✖ Seeding failed: ${(err as Error).message ?? String(err)}`);
  process.exit(1);
});
