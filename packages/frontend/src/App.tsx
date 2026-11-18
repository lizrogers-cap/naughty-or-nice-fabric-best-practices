import { percentOf, verdictFor } from '@rayfin-app/shared';
import { Moon, Snowflake, Sun, Trophy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Snowfall } from '@/components/Snowfall';
import { useTheme } from '@/hooks/theme.context';
import { readMyAttemptIds, rememberMyAttemptId } from '@/lib/my-attempts';
import { loadScenarios, submitAttempt, type QuizScenario } from '@/lib/quiz-api';
import { cn } from '@/lib/utils';
import { QuizView, type QuizAnswer } from '@/views/QuizView';
import { ResultsView, type SaveState } from '@/views/ResultsView';
import { ScoreboardView } from '@/views/ScoreboardView';
import { StartView, type LoadState } from '@/views/StartView';

type View = 'play' | 'scoreboard';

interface ResultsPhase {
  name: 'results';
  playerName: string;
  startedAt: Date;
  completedAt: Date;
  deck: QuizScenario[];
  answers: QuizAnswer[];
}

type Phase =
  | { name: 'start' }
  | { name: 'quiz'; playerName: string; startedAt: Date; deck: QuizScenario[]; round: number }
  | ResultsPhase;

function summarize(deck: readonly QuizScenario[], answers: readonly QuizAnswer[]) {
  const score = answers.reduce((sum, a) => sum + a.points, 0);
  const maxScore = deck.reduce((sum, s) => sum + s.pointValue, 0);
  const percent = percentOf(score, maxScore);
  return { score, maxScore, percent, verdict: verdictFor(percent) };
}

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [view, setView] = useState<View>('play');
  const [phase, setPhase] = useState<Phase>({ name: 'start' });
  const [scenarios, setScenarios] = useState<LoadState<QuizScenario[]>>({ status: 'loading' });
  const [save, setSave] = useState<SaveState>({ status: 'saving' });
  const [myAttemptIds, setMyAttemptIds] = useState<string[]>(() => readMyAttemptIds());

  const fetchScenarios = useCallback(
    () =>
      loadScenarios()
        .then((data) => setScenarios({ status: 'ready', data }))
        .catch(() =>
          setScenarios({
            status: 'error',
            message: "Couldn't load the workshop scenarios. Check your connection and try again.",
          }),
        ),
    [],
  );

  useEffect(() => {
    void fetchScenarios();
  }, [fetchScenarios]);

  function retryScenarios() {
    setScenarios({ status: 'loading' });
    void fetchScenarios();
  }

  const results = phase.name === 'results' ? summarize(phase.deck, phase.answers) : null;

  /** Persists a finished round. Called from event handlers only: once on finish, again on Retry. */
  function saveAttempt(round: ResultsPhase) {
    const { score, verdict } = summarize(round.deck, round.answers);
    setSave({ status: 'saving' });
    submitAttempt({
      playerName: round.playerName,
      startedAt: round.startedAt,
      completedAt: round.completedAt,
      score,
      verdict: verdict.name,
      answers: round.answers.map(({ scenarioId, selectedAnswer, correct }) => ({ scenarioId, selectedAnswer, correct })),
    })
      .then((id) => {
        setMyAttemptIds(rememberMyAttemptId(id));
        setSave({ status: 'saved' });
      })
      .catch(() => setSave({ status: 'error', message: "Your score didn't save." }));
  }

  function start(playerName: string) {
    if (scenarios.status !== 'ready') return;
    setPhase((prev) => ({
      name: 'quiz',
      playerName,
      startedAt: new Date(),
      deck: shuffle(scenarios.data),
      round: prev.name === 'quiz' ? prev.round + 1 : Date.now(),
    }));
  }

  function finish(answers: QuizAnswer[]) {
    if (phase.name !== 'quiz') return;
    const round: ResultsPhase = {
      name: 'results',
      playerName: phase.playerName,
      startedAt: phase.startedAt,
      completedAt: new Date(),
      deck: phase.deck,
      answers,
    };
    setPhase(round);
    saveAttempt(round);
  }

  const scenarioCount: LoadState<number> =
    scenarios.status === 'ready' ? { status: 'ready', data: scenarios.data.length } : scenarios;

  return (
    <div className="relative min-h-full">
      <Snowfall />

      <div className="relative z-10 flex min-h-full flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-300 px-400 py-300">
            <button
              type="button"
              onClick={() => setView('play')}
              className="flex items-center gap-200 rounded-lg font-heading text-500 leading-500 font-bold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Snowflake className="icon-size-300 text-primary" aria-hidden="true" />
              <span>
                Naughty <span className="text-muted-foreground">or</span> <span className="text-nice">Nice</span>
              </span>
            </button>

            <nav aria-label="Main" className="flex items-center gap-200">
              {(
                [
                  ['play', 'Play', Snowflake],
                  ['scoreboard', 'Scoreboard', Trophy],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  aria-current={view === key ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-100 rounded-full px-300 py-200 text-300 leading-300 font-semibold',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    view === key ? 'bg-primary text-primary-foreground' : 'hover:bg-hover',
                  )}
                >
                  <Icon className="icon-size-200" aria-hidden="true" />
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="rounded-full p-200 hover:bg-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {isDark ? <Sun className="icon-size-200" aria-hidden="true" /> : <Moon className="icon-size-200" aria-hidden="true" />}
              </button>
            </nav>
          </div>
          <TwinkleGarland />
        </header>

        <main className="flex-1 px-400 py-800">
          {view === 'scoreboard' ? (
            <ScoreboardView myAttemptIds={myAttemptIds} />
          ) : phase.name === 'start' ? (
            <StartView scenarioCount={scenarioCount} onStart={start} onRetry={retryScenarios} />
          ) : phase.name === 'quiz' ? (
            <QuizView key={phase.round} scenarios={phase.deck} onFinish={finish} />
          ) : (
            results && (
              <ResultsView
                playerName={phase.playerName}
                scenarios={phase.deck}
                answers={phase.answers}
                score={results.score}
                maxScore={results.maxScore}
                percent={results.percent}
                verdict={results.verdict}
                save={save}
                onRetrySave={() => saveAttempt(phase)}
                onPlayAgain={() => setPhase({ name: 'start' })}
                onShowScoreboard={() => setView('scoreboard')}
              />
            )
          )}
        </main>

        <footer className="px-400 pb-600 text-center text-200 leading-200 text-muted-foreground">
          A 12 Days of Fabric Apps entry. Scenarios are based on practices documented on Microsoft Learn; the elf
          foreman's opinions are his own.
        </footer>
      </div>
    </div>
  );
}

const BULB_COLORS = ['text-primary', 'text-gold', 'text-nice', 'text-gold'] as const;

/** Decorative string lights under the header. */
function TwinkleGarland() {
  return (
    <div className="flex justify-around overflow-hidden px-400" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className={cn('twinkle -mb-100 block h-200 w-200 rounded-full bg-current', BULB_COLORS[i % BULB_COLORS.length])}
          style={{ animationDelay: `${(i % 5) * 0.4}s` }}
        />
      ))}
    </div>
  );
}

export default App;
