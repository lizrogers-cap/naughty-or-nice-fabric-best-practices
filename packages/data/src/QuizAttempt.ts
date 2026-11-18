import { date, entity, int, role, text, uuid } from '@microsoft/rayfin-core';

/**
 * One finished quiz run, shown on the seasonal leaderboard.
 *
 * Any signed-in player can submit an attempt and read the leaderboard. There is
 * no update or delete grant, so a submitted score cannot be edited afterwards
 * through the data API.
 *
 * `playerName` is public, user-supplied text: the frontend trims it, caps it at
 * 30 characters and only ever renders it as plain text.
 */
@entity()
@role('authenticated', ['create', 'read'])
export class QuizAttempt {
  @uuid() id!: string;
  @text({ min: 1, max: 30 }) playerName!: string;
  @text({ default: 'Winter2026', max: 20 }) season!: string;
  @date() startedAt!: Date;
  @date() completedAt!: Date;
  @int() score!: number;
  @text({ max: 40 }) verdict!: string;
  @text({ max: 4000 }) answersJson!: string;
}
