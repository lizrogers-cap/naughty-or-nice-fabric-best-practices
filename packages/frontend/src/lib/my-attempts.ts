/**
 * Remembers which leaderboard rows belong to this browser, so the scoreboard
 * can highlight "you". A per-viewer convenience only: the database stays the
 * source of truth, and every storage call is guarded because storage can be
 * blocked inside iframes or private windows.
 */
const KEY = 'naughty-or-nice:my-attempts';
const MAX_REMEMBERED = 20;

export function readMyAttemptIds(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberMyAttemptId(id: string): string[] {
  const next = [id, ...readMyAttemptIds().filter((x) => x !== id)].slice(0, MAX_REMEMBERED);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: highlighting still works for this session via state */
  }
  return next;
}
