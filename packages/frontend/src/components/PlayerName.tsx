import { sanitizePlayerName } from '@rayfin-app/shared';

/**
 * The only way the app displays a player name.
 *
 * playerName is untrusted public input. It is re-sanitized on display (control
 * and bidi-override characters stripped, length capped) and rendered as a React
 * text node, which escapes it. Never pass it to dangerouslySetInnerHTML or
 * build HTML strings from it.
 */
export function PlayerName({ name, className }: { name: string; className?: string }) {
  const safe = sanitizePlayerName(name) || 'Anonymous Elf';
  return (
    <span className={className} title={safe}>
      {safe}
    </span>
  );
}
