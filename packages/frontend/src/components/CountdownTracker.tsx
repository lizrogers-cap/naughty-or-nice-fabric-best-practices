import { cn } from '@/lib/utils';

export type BulbState = 'correct' | 'wrong' | 'current' | 'upcoming';

/**
 * Progress shown as a countdown to Christmas: one string light per scenario.
 * Answered bulbs light up green (Nice) or go dark (coal); the current bulb
 * twinkles gold. "Sleeps" = scenarios left including the current one.
 */
export function CountdownTracker({ bulbs }: { bulbs: BulbState[] }) {
  const total = bulbs.length;
  const answered = bulbs.filter((b) => b === 'correct' || b === 'wrong').length;
  const sleeps = total - answered;
  const currentIndex = bulbs.indexOf('current');

  return (
    <div className="flex flex-col gap-200">
      <div className="flex items-baseline justify-between gap-300">
        <p className="font-heading text-500 leading-500 font-semibold">
          {sleeps === 0 ? 'Christmas morning!' : `${sleeps} ${sleeps === 1 ? 'sleep' : 'sleeps'} until Christmas`}
        </p>
        <p className="text-300 leading-300 text-muted-foreground font-numeric">
          {currentIndex >= 0 ? `Scenario ${currentIndex + 1} of ${total}` : `${answered} of ${total} answered`}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
        aria-valuetext={`${answered} of ${total} scenarios answered`}
        className="relative pt-100"
      >
        {/* the garland wire */}
        <div className="absolute inset-x-0 top-300 border-t-2 border-dashed border-border" aria-hidden="true" />
        <ol className="relative flex justify-between gap-100">
          {bulbs.map((state, i) => (
            <li key={i} className="flex flex-col items-center" aria-hidden="true">
              <span className="block h-200 w-100 rounded-sm bg-muted-foreground/60" />
              <span
                className={cn(
                  'block h-400 w-300 rounded-full border transition-colors',
                  state === 'correct' && 'bg-nice border-nice twinkle text-nice',
                  state === 'wrong' && 'bg-naughty border-naughty',
                  state === 'current' && 'bg-gold border-gold twinkle text-gold',
                  state === 'upcoming' && 'bg-muted border-input',
                )}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
