import { verdictByName, type VerdictTier } from '@rayfin-app/shared';
import { Award, Gift, Hammer, Mountain } from 'lucide-react';

import { cn } from '@/lib/utils';

const STYLES: Record<VerdictTier, { className: string; Icon: typeof Award }> = {
  certified: { className: 'bg-gold text-gold-foreground border-gold', Icon: Award },
  nice: { className: 'bg-nice text-nice-foreground border-nice', Icon: Gift },
  apprentice: { className: 'bg-secondary text-secondary-foreground border-border', Icon: Hammer },
  coal: { className: 'bg-naughty text-naughty-foreground border-naughty', Icon: Mountain },
};

/** Renders a stored verdict string. Unknown values fall back to a neutral pill. */
export function VerdictBadge({ verdict, size = 'sm' }: { verdict: string; size?: 'sm' | 'lg' }) {
  const known = verdictByName(verdict);
  const style = known ? STYLES[known.tier] : null;
  const Icon = style?.Icon ?? Gift;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-100 rounded-full border font-semibold whitespace-nowrap',
        size === 'lg' ? 'px-400 py-200 text-400 leading-400' : 'px-200 py-100-nudge text-200 leading-200',
        style?.className ?? 'bg-muted text-muted-foreground border-border',
      )}
    >
      <Icon className={size === 'lg' ? 'icon-size-300' : 'icon-size-100'} aria-hidden="true" />
      {known?.name ?? verdict}
    </span>
  );
}
