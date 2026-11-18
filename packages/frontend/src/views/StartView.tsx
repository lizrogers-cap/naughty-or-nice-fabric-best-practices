import { PLAYER_NAME_MAX_LENGTH, sanitizePlayerName } from '@rayfin-app/shared';
import { Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

export function StartView({
  scenarioCount,
  onStart,
  onRetry,
}: {
  scenarioCount: LoadState<number>;
  onStart: (playerName: string) => void;
  onRetry: () => void;
}) {
  const inputId = useId();
  const hintId = useId();
  const [name, setName] = useState('');
  const clean = sanitizePlayerName(name);
  const ready = scenarioCount.status === 'ready' && scenarioCount.data > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (clean && ready) onStart(clean);
  }

  return (
    <section className="pop-in mx-auto flex w-full max-w-[640px] flex-col gap-600">
      <div className="flex flex-col gap-300 text-center">
        <p className="text-300 leading-300 font-semibold tracking-widest text-primary uppercase">
          The Fabric Best Practices Predictor
        </p>
        <h1 className="font-heading text-hero-900 leading-hero-900 font-bold">
          Naughty <span className="text-muted-foreground">or</span> <span className="text-nice">Nice?</span>
        </h1>
        <p className="text-400 leading-400 text-muted-foreground">
          The elf foreman has reviewed this year's Microsoft Fabric projects. Judge each scenario,
          get his verdict, and find out which list you end up on.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="flex flex-col gap-400 rounded-3xl border bg-card p-600 shadow-sm"
        noValidate
      >
        <label htmlFor={inputId} className="font-heading text-500 leading-500 font-semibold">
          Sign the workshop guest book
        </label>
        <input
          id={inputId}
          aria-describedby={hintId}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={PLAYER_NAME_MAX_LENGTH * 2}
          autoComplete="nickname"
          placeholder="e.g. Tinsel McTwinkle"
          className="rounded-xl border border-input bg-background px-400 py-300 text-400 leading-400 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p id={hintId} className="text-200 leading-200 text-muted-foreground">
          Display name for the public scoreboard, {PLAYER_NAME_MAX_LENGTH} characters max. Use a festive alias
          rather than your real name.
          {name.length > 0 && clean.length === 0 && ' Please enter at least one visible character.'}
        </p>

        {scenarioCount.status === 'error' && (
          <div role="alert" className="flex items-start gap-200 rounded-xl bg-muted p-300 text-300 leading-300">
            <TriangleAlert className="icon-size-200 mt-100 shrink-0 text-destructive" aria-hidden="true" />
            <div className="flex flex-col gap-200">
              <span>{scenarioCount.message}</span>
              <button type="button" onClick={onRetry} className="self-start font-semibold text-primary underline">
                Try again
              </button>
            </div>
          </div>
        )}
        {scenarioCount.status === 'ready' && scenarioCount.data === 0 && (
          <p role="status" className="rounded-xl bg-muted p-300 text-300 leading-300 text-muted-foreground">
            The workshop has no scenarios yet. Run the scenario seed script, then reload.
          </p>
        )}

        <button
          type="submit"
          disabled={!clean || !ready}
          className="inline-flex items-center justify-center gap-200 rounded-full bg-primary px-600 py-300 text-400 leading-400 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {scenarioCount.status === 'loading' ? (
            <>
              <Loader2 className="icon-size-200 animate-spin" aria-hidden="true" /> Loading the workshop…
            </>
          ) : (
            <>
              <Sparkles className="icon-size-200" aria-hidden="true" />
              {scenarioCount.status === 'ready' && scenarioCount.data > 0
                ? `Start the countdown (${scenarioCount.data} scenarios)`
                : 'Start the countdown'}
            </>
          )}
        </button>
      </form>
    </section>
  );
}
