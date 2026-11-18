/**
 * Publishes content/scenarios.ts to the deployed app while keeping Scenario
 * writes locked at all other times.
 *
 *   npm run content:publish
 *
 * Steps:
 *   1. Validate content (offline).
 *   2. Plan: read-only diff against the database. If nothing changed, stop
 *      here: no unlock happens at all.
 *   3. Unlock: `rayfin up db apply` with RAYFIN_SCENARIO_WRITES=open, which
 *      grants owner-scoped create/update on Scenario (see packages/data/src/Scenario.ts).
 *   4. Seed: `npm run seed:scenarios`.
 *   5. Re-lock: `rayfin up db apply` with the switch removed. This runs even if
 *      seeding fails or you press Ctrl+C. If the re-lock itself fails, the script
 *      exits non-zero and tells you to run `npx rayfin up db apply`.
 *
 * Any plain `npx rayfin up` or `npx rayfin up db apply` also re-locks, because
 * the switch is unset by default.
 */
import { spawnSync } from 'node:child_process';

const SWITCH = 'RAYFIN_SCENARIO_WRITES';
const PLAN_HAS_CHANGES = 3;

function run(label: string, command: string, env: NodeJS.ProcessEnv = process.env): number {
  console.log(`\n▶ ${label}`);
  // shell: true resolves npm/npx .cmd shims on Windows. Commands are fixed strings.
  const result = spawnSync(command, { stdio: 'inherit', shell: true, env });
  if (result.error) console.error(`  ${result.error.message}`);
  return result.status ?? 1;
}

function lockedEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env[SWITCH];
  return env;
}

function main(): number {
  if (process.env[SWITCH]) {
    console.error(`✖ ${SWITCH} is set in your shell. Unset it first; this script manages it.`);
    return 1;
  }

  if (run('Validating content', 'npm run --silent seed:scenarios:check') !== 0) return 1;

  const plan = run('Comparing content with the database (read-only)', 'npx tsx scripts/seed-scenarios.ts --plan');
  if (plan === 0) {
    console.log('\n✔ Everything is already up to date. Scenario writes stayed locked.');
    return 0;
  }
  if (plan !== PLAN_HAS_CHANGES) return plan;

  // From here on, always attempt to re-lock, even on Ctrl+C.
  let interrupted = false;
  const onSigint = () => {
    interrupted = true;
    console.warn('\n  Ctrl+C received: re-locking before exit…');
  };
  process.on('SIGINT', onSigint);

  let seedStatus = 1;
  try {
    const unlock = run('Unlocking Scenario writes (temporary)', 'npx rayfin up db apply', {
      ...process.env,
      [SWITCH]: 'open',
    });
    if (unlock === 0 && !interrupted) {
      seedStatus = run('Seeding scenarios', 'npm run --silent seed:scenarios');
    }
  } finally {
    const lock = run('Re-locking Scenario writes', 'npx rayfin up db apply', lockedEnv());
    process.off('SIGINT', onSigint);
    if (lock !== 0) {
      console.error(
        '\n✖ RE-LOCK FAILED: Scenario writes may still be open.\n' +
          '  Run `npx rayfin up db apply` now (with RAYFIN_SCENARIO_WRITES unset) and confirm it succeeds.',
      );
      return 2;
    }
  }

  console.log(seedStatus === 0 ? '\n✔ Scenarios published. Writes are locked again.' : '\n✖ Seeding failed. Writes are locked again.');
  return seedStatus === 0 && !interrupted ? 0 : 1;
}

process.exitCode = main();
