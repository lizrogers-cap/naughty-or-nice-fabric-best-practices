import type { Verdict } from '@rayfin-app/shared';
import { Check, Loader2, RotateCcw, Trophy, TriangleAlert, X } from 'lucide-react';

import { VerdictBadge } from '@/components/VerdictBadge';
import { PlayerName } from '@/components/PlayerName';
import { answerLabel } from '@/lib/answer-label';
import type { QuizScenario } from '@/lib/quiz-api';
import { cn } from '@/lib/utils';

import type { QuizAnswer } from './QuizView';

export type SaveState = { status: 'saving' } | { status: 'saved' } | { status: 'error'; message: string };

export function ResultsView({
  playerName,
  scenarios,
  answers,
  score,
  maxScore,
  percent,
  verdict,
  save,
  onRetrySave,
  onPlayAgain,
  onShowScoreboard,
}: {
  playerName: string;
  scenarios: QuizScenario[];
  answers: QuizAnswer[];
  score: number;
  maxScore: number;
  percent: number;
  verdict: Verdict;
  save: SaveState;
  onRetrySave: () => void;
  onPlayAgain: () => void;
  onShowScoreboard: () => void;
}) {
  const byId = new Map(scenarios.map((s) => [s.id, s]));
  const correctCount = answers.filter((a) => a.correct).length;

  return (
    <section className="mx-auto flex w-full max-w-[760px] flex-col gap-600">
      <div className="pop-in flex flex-col items-center gap-400 rounded-3xl border bg-card p-600 text-center shadow-sm">
        <p className="text-300 leading-300 text-muted-foreground">
          The elf foreman's verdict for <PlayerName name={playerName} className="font-semibold text-foreground" />
        </p>
        <VerdictBadge verdict={verdict.name} size="lg" />
        <p className="font-heading text-hero-1000 leading-hero-1000 font-bold font-numeric">
          {score}
          <span className="text-hero-800 leading-hero-800 text-muted-foreground"> / {maxScore}</span>
        </p>
        <p className="text-400 leading-400 text-muted-foreground">
          {correctCount} of {answers.length} correct · {percent}%
        </p>
        <p className="max-w-[520px] text-400 leading-400">{verdict.blurb}</p>

        <div role="status" className="min-h-600 text-300 leading-300">
          {save.status === 'saving' && (
            <span className="inline-flex items-center gap-200 text-muted-foreground">
              <Loader2 className="icon-size-200 animate-spin" aria-hidden="true" /> Delivering your score to the North Pole…
            </span>
          )}
          {save.status === 'saved' && <span className="text-nice font-semibold">Score saved to the Winter 2026 scoreboard.</span>}
          {save.status === 'error' && (
            <span className="inline-flex flex-wrap items-center justify-center gap-200 text-destructive">
              <TriangleAlert className="icon-size-200" aria-hidden="true" /> {save.message}
              <button type="button" onClick={onRetrySave} className="font-semibold text-primary underline">
                Retry
              </button>
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-300">
          <button
            type="button"
            onClick={onShowScoreboard}
            className="inline-flex items-center gap-200 rounded-full bg-primary px-600 py-300 text-400 leading-400 font-semibold text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Trophy className="icon-size-200" aria-hidden="true" /> See the scoreboard
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="inline-flex items-center gap-200 rounded-full border bg-background px-600 py-300 text-400 leading-400 font-semibold hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <RotateCcw className="icon-size-200" aria-hidden="true" /> Play again
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-300">
        <h2 className="font-heading text-600 leading-600 font-semibold">Scenario review</h2>
        <ol className="flex flex-col gap-300">
          {answers.map((a, i) => {
            const s = byId.get(a.scenarioId);
            if (!s) return null;
            return (
              <li
                key={a.scenarioId}
                className={cn(
                  'rounded-2xl border border-l-4 bg-card p-400',
                  a.correct ? 'border-l-nice' : 'border-l-naughty',
                )}
              >
                <details>
                  <summary className="flex cursor-pointer list-none items-start gap-300 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                    {a.correct ? (
                      <Check className="icon-size-300 mt-100 shrink-0 text-nice" aria-label="Correct" />
                    ) : (
                      <X className="icon-size-300 mt-100 shrink-0" aria-label="Incorrect" />
                    )}
                    <span className="flex flex-1 flex-col gap-100">
                      <span className="text-200 leading-200 text-muted-foreground">
                        {i + 1}. {s.category} · {a.points}/{s.pointValue} pts
                      </span>
                      <span className="text-400 leading-400">{s.prompt}</span>
                    </span>
                  </summary>
                  <div className="mt-300 flex flex-col gap-200 pl-800 text-300 leading-300">
                    <p>
                      <span className="font-semibold">Your answer:</span> {answerLabel(s, a.selectedAnswer)}
                    </p>
                    {!a.correct && (
                      <p>
                        <span className="font-semibold">Correct answer:</span> {answerLabel(s, s.correctAnswer)}
                      </p>
                    )}
                    <p className="text-muted-foreground">{s.explanation}</p>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
