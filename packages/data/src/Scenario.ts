import { entity, int, role, text, uuid } from '@microsoft/rayfin-core';

/**
 * One "Santa's Workshop" quiz question.
 *
 * Content is authored in `content/scenarios.ts` and loaded by
 * `npm run content:publish`, keyed on `slug`. Never reuse a slug for a
 * different scenario, and never change a shipped scenario's slug.
 *
 * Access: LOCKED BY DEFAULT.
 * - Any signed-in player can read scenarios. `author_id` is hidden from reads
 *   while locked (and visible during the short publish window).
 * - Nobody can create, update or delete scenarios through the data API.
 *
 * Content publishing opens a temporary write window: `npm run content:publish`
 * runs `rayfin up db apply` with RAYFIN_SCENARIO_WRITES=open, seeds, then runs
 * `db apply` again without it to remove the grant. While the window is open,
 * writes are still owner-scoped: a row can only be written by the identity whose
 * subject claim matches `author_id` (the seed script stamps its own identity).
 *
 * The switch is read when the Rayfin CLI builds and loads this package to
 * generate the database permissions, never in the browser. A normal
 * `rayfin up` / `db apply` leaves it unset, so every deploy re-locks.
 *
 * Rayfin supports only the built-in `anonymous` and `authenticated` roles, and
 * anonymous data access on Fabric needs a tenant admin switch, so reads use
 * `authenticated`. A Fabric App signs players in before rendering anyway.
 */
const SCENARIO_WRITES_OPEN =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.RAYFIN_SCENARIO_WRITES === 'open';

type ScenarioShape = { author_id: string };
type ScenarioRoleDecorator = ReturnType<typeof role<ScenarioShape>>;

const contentWriteGrant: ScenarioRoleDecorator = SCENARIO_WRITES_OPEN
  ? role<ScenarioShape>('authenticated', ['create', 'update'], {
      policy: (claims, scenario) => claims.sub.eq(scenario.author_id),
    })
  : () => undefined;

// While locked, author_id is hidden from reads. While the publish window is open
// it must stay visible: Data API Builder drops a read-excluded field from the
// GraphQL schema entirely, which would also remove it from the create/update
// inputs the seed script needs.
const readGrant: ScenarioRoleDecorator = SCENARIO_WRITES_OPEN
  ? role<ScenarioShape>('authenticated', 'read')
  : role<ScenarioShape>('authenticated', 'read', { exclude: ['author_id'] });

@entity()
@readGrant
@contentWriteGrant
export class Scenario {
  @uuid() id!: string;
  @text({ min: 1, max: 80, unique: true }) slug!: string;
  @text({ min: 1, max: 1000 }) prompt!: string;
  @text({ max: 20 }) questionType!: string;
  @text({ optional: true, max: 1000 }) options?: string;
  @text({ min: 1, max: 200 }) correctAnswer!: string;
  @text({ min: 1, max: 2000 }) explanation!: string;
  @text({ max: 10 }) naughtyOrNice!: string;
  @text({ max: 50 }) category!: string;
  @int({ default: 10 }) pointValue!: number;
  @text({ max: 200 }) author_id!: string;
}
