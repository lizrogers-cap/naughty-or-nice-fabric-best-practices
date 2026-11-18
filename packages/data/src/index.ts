import { QuizAttempt } from './QuizAttempt.js';
import { Scenario } from './Scenario.js';
import type { UniversalAppSchema } from '@rayfin-app/shared';

/**
 * The app's Rayfin data schema.
 *
 * Keep this array in step with `UniversalAppSchema` in `@rayfin-app/shared`:
 * an entity registered here but missing from the shared type is reachable at
 * runtime and invisible to the compiler.
 */
export type { UniversalAppSchema };
export { QuizAttempt, Scenario };

export const schema = [Scenario, QuizAttempt];
