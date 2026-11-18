import { CURRENT_SEASON } from '@rayfin-app/shared';
import { Crown, Flame, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { PlayerName } from '@/components/PlayerName';
import { VerdictBadge } from '@/components/VerdictBadge';
import { loadLeaderboards, type LeaderboardRow } from '@/lib/quiz-api';
import { cn } from '@/lib/utils';

import type { LoadState } from './StartView';

type Boards = { nice: LeaderboardRow[]; naughty: LeaderboardRow[] };

const ROASTS = [
  'Deployed to Prod on Christmas Eve. Twice.',
  'Gave the whole North Pole Admin access.',
  'Still thinks bi-directional means "extra safe".',
  'Has 400,000 tiny Parquet files and no regrets.',
  'Named a workspace "FINAL final v2".',
  'Ignored the throttling alerts. All of them.',
  'Certified their own semantic model. Not allowed.',
  'Left the dev capacity running all summer.',
  'Put the Nice List on a USB stick. Unlabeled.',
  'Built a 900-column flat table "for flexibility".',
];

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

function seasonLabel(season: string): string {
  return season.replace(/^([A-Za-z]+)(\d{4})$/, '$1 $2');
}

export function ScoreboardView({ myAttemptIds }: { myAttemptIds: readonly string[] }) {
  const [state, setState] = useState<LoadState<Boards>>({ status: 'loading' });

  const fetchBoards = useCallback(
    () =>
      loadLeaderboards(CURRENT_SEASON)
        .then((data) => setState({ status: 'ready', data }))
        .catch(() =>
          setState({ status: 'error', message: "Couldn't reach the North Pole scoreboard. Check your connection and try again." }),
        ),
    [],
  );

  useEffect(() => {
    void fetchBoards();
  }, [fetchBoards]);

  function load() {
    setState({ status: 'loading' });
    void fetchBoards();
  }

  const mine = new Set(myAttemptIds);

  return (
    <section className="mx-auto flex w-full max-w-[1100px] flex-col gap-600">
      <div className="flex flex-wrap items-end justify-between gap-300">
        <div className="flex flex-col gap-100">
          <p className="text-300 leading-300 font-semibold tracking-widest text-primary uppercase">
            {seasonLabel(CURRENT_SEASON)} season
          </p>
          <h1 className="font-heading text-hero-800 leading-hero-800 font-bold">The Scoreboard</h1>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={state.status === 'loading'}
          className="inline-flex items-center gap-200 rounded-full border bg-card px-400 py-200 text-300 leading-300 font-semibold hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
        >
          <RefreshCw className={cn('icon-size-200', state.status === 'loading' && 'animate-spin')} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {state.status === 'error' && (
        <div role="alert" className="flex items-center gap-300 rounded-2xl border bg-card p-400 text-400 leading-400">
          <TriangleAlert className="icon-size-300 shrink-0 text-destructive" aria-hidden="true" />
          <span className="flex-1">{state.message}</span>
          <button type="button" onClick={load} className="font-semibold text-primary underline">
            Try again
          </button>
        </div>
      )}

      <div className="grid gap-600 lg:grid-cols-[1.15fr_1fr]">
        <NiceList state={state} mine={mine} />
        <NaughtyList state={state} mine={mine} />
      </div>
    </section>
  );
}

function YouTag() {
  return (
    <span className="rounded-full bg-primary px-200 py-100-nudge text-100 leading-100 font-bold tracking-wider text-primary-foreground uppercase">
      You
    </span>
  );
}

function ListBody({
  state,
  pick,
  emptyText,
  renderRow,
}: {
  state: LoadState<Boards>;
  pick: (b: Boards) => LeaderboardRow[];
  emptyText: string;
  renderRow: (row: LeaderboardRow, rank: number) => React.ReactNode;
}) {
  if (state.status === 'loading') {
    return (
      <p role="status" className="flex items-center gap-200 py-600 text-300 leading-300 text-muted-foreground">
        <Loader2 className="icon-size-200 animate-spin" aria-hidden="true" /> Checking the list twice…
      </p>
    );
  }
  if (state.status === 'error') return null;
  const rows = pick(state.data);
  if (rows.length === 0) {
    return <p className="py-600 text-center text-400 leading-400 text-muted-foreground">{emptyText}</p>;
  }
  return (
    <>
      <ol className="flex flex-col">{rows.map((r, i) => renderRow(r, i + 1))}</ol>
      {rows.length < 10 && (
        <p className="pt-300 text-200 leading-200 text-muted-foreground">
          Only {rows.length} {rows.length === 1 ? 'player has' : 'players have'} finished so far this season.
        </p>
      )}
    </>
  );
}

function NiceList({ state, mine }: { state: LoadState<Boards>; mine: Set<string> }) {
  return (
    <div className="relative flex flex-col gap-400 overflow-hidden rounded-3xl border-2 border-gold bg-card p-600 shadow-sm">
      <div className="flex items-center gap-300">
        <Crown className="icon-size-500 twinkle text-gold" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-hero-700 leading-hero-700 font-bold text-nice">The Nice List</h2>
          <p className="text-300 leading-300 text-muted-foreground italic">Top 10 honor roll · highest scores</p>
        </div>
      </div>
      <ListBody
        state={state}
        pick={(b) => b.nice}
        emptyText="No one has earned a spot yet. Be the first name on the honor roll."
        renderRow={(row, rank) => {
          const isMe = mine.has(row.id);
          return (
            <li
              key={row.id}
              className={cn(
                'grid grid-cols-[2.5rem_1fr_auto] items-center gap-300 border-b border-dashed py-300 last:border-b-0',
                isMe && '-mx-300 rounded-xl border-b-0 bg-accent px-300 ring-2 ring-gold',
              )}
              aria-current={isMe ? 'true' : undefined}
            >
              <span
                className={cn(
                  'font-heading text-600 leading-600 font-bold font-numeric',
                  rank <= 3 ? 'text-gold' : 'text-muted-foreground',
                )}
              >
                #{rank}
              </span>
              <span className="flex min-w-0 flex-col gap-100">
                <span className="flex min-w-0 items-center gap-200">
                  <PlayerName name={row.playerName} className="truncate font-heading text-500 leading-500 font-semibold" />
                  {isMe && <YouTag />}
                </span>
                <span className="flex flex-wrap items-center gap-200">
                  <VerdictBadge verdict={row.verdict} />
                  <span className="text-200 leading-200 text-muted-foreground">{dateFormat.format(row.completedAt)}</span>
                </span>
              </span>
              <span className="font-heading text-600 leading-600 font-bold text-nice font-numeric">{row.score}</span>
            </li>
          );
        }}
      />
    </div>
  );
}

function NaughtyList({ state, mine }: { state: LoadState<Boards>; mine: Set<string> }) {
  return (
    <div className="flex flex-col gap-400 rounded-3xl border-2 border-dashed border-naughty bg-naughty-soft p-600">
      <div className="flex items-center gap-300">
        <Flame className="icon-size-500 text-primary" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-hero-700 leading-hero-700 font-bold">The Naughty List</h2>
          <p className="text-300 leading-300 text-muted-foreground">Top 10 roast · lowest scores · coal delivered nightly</p>
        </div>
      </div>
      <ListBody
        state={state}
        pick={(b) => b.naughty}
        emptyText="Suspiciously empty. Somebody is hiding their Friday deployments."
        renderRow={(row, rank) => {
          const isMe = mine.has(row.id);
          return (
            <li
              key={row.id}
              className={cn(
                'grid grid-cols-[2.5rem_1fr_auto] items-center gap-300 border-b border-border py-300 last:border-b-0',
                isMe && '-mx-300 rounded-xl border-b-0 bg-card px-300 ring-2 ring-primary',
              )}
              aria-current={isMe ? 'true' : undefined}
            >
              <span className="font-numeric text-500 leading-500 font-bold text-muted-foreground">#{rank}</span>
              <span className="flex min-w-0 flex-col gap-100">
                <span className="flex min-w-0 items-center gap-200">
                  <PlayerName name={row.playerName} className="truncate text-400 leading-400 font-bold" />
                  {isMe && <YouTag />}
                </span>
                <span className="text-200 leading-200 text-muted-foreground italic">{ROASTS[(rank - 1) % ROASTS.length]}</span>
                <span className="flex flex-wrap items-center gap-200">
                  <VerdictBadge verdict={row.verdict} />
                  <span className="text-200 leading-200 text-muted-foreground">{dateFormat.format(row.completedAt)}</span>
                </span>
              </span>
              <span className="font-numeric text-500 leading-500 font-bold">{row.score}</span>
            </li>
          );
        }}
      />
    </div>
  );
}
