import { pointsFor, type AnswerEntry } from '@rayfin-app/shared';
import { ArrowRight, Check, Gift, Mountain, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { CountdownTracker, type BulbState } from '@/components/CountdownTracker';
import { answerLabel } from '@/lib/answer-label';
import type { QuizScenario } from '@/lib/quiz-api';
import { cn } from '@/lib/utils';

export interface QuizAnswer extends AnswerEntry {
  points: number;
}

export function QuizView({
  scenarios,
  onFinish,
}: {
  scenarios: QuizScenario[];
  onFinish: (answers: QuizAnswer[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const scenario = scenarios[index]!;
  const revealed = selected !== null;
  const isCorrect = revealed && selected === scenario.correctAnswer;
  const isLast = index === scenarios.length - 1;

  useEffect(() => {
    if (revealed) nextRef.current?.focus();
  }, [revealed]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  const bulbs: BulbState[] = scenarios.map((_, i) => {
    if (i < answers.length) return answers[i]!.correct ? 'correct' : 'wrong';
    if (i === index && !revealed) return 'current';
    return 'upcoming';
  });

  function choose(option: string) {
    if (revealed) return;
    const correct = option === scenario.correctAnswer;
    setSelected(option);
    setAnswers((prev) => [
      ...prev,
      { scenarioId: scenario.id, selectedAnswer: option, correct, points: pointsFor(correct, scenario.pointValue) },
    ]);
  }

  function advance() {
    if (isLast) {
      onFinish(answers);
      return;
    }
    setSelected(null);
    setIndex((i) => i + 1);
  }

  const isTrueFalse = scenario.questionType === 'true_false';

  return (
    <section className="mx-auto flex w-full max-w-[760px] flex-col gap-600">
      <CountdownTracker bulbs={bulbs} />

      <article key={scenario.id} className="pop-in flex flex-col gap-500 rounded-3xl border bg-card p-600 shadow-sm">
        <div className="flex flex-wrap items-center gap-200">
          <span className="rounded-full bg-secondary px-300 py-100 text-200 leading-200 font-semibold text-secondary-foreground">
            {scenario.category}
          </span>
          <span className="text-200 leading-200 text-muted-foreground font-numeric">{scenario.pointValue} pts</span>
        </div>

        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-600 leading-600 font-semibold outline-none"
        >
          {scenario.prompt}
        </h2>

        <div
          role="group"
          aria-label="Answer options"
          className={cn('grid gap-300', isTrueFalse ? 'grid-cols-2' : 'grid-cols-1')}
        >
          {scenario.options.map((option) => {
            const chosen = selected === option;
            const right = option === scenario.correctAnswer;
            return (
              <button
                key={option}
                type="button"
                onClick={() => choose(option)}
                disabled={revealed}
                aria-pressed={chosen}
                className={cn(
                  'flex items-center gap-300 rounded-2xl border-2 px-400 py-300 text-left text-400 leading-400 transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                  !revealed && 'border-border bg-background hover:border-primary hover:bg-hover',
                  revealed && right && 'border-nice bg-nice-soft',
                  revealed && chosen && !right && 'border-naughty bg-naughty-soft',
                  revealed && !chosen && !right && 'border-border opacity-60',
                  isTrueFalse && 'justify-center py-500 font-heading text-500 leading-500 font-semibold',
                )}
              >
                {isTrueFalse &&
                  (option === 'naughty' ? (
                    <Mountain className="icon-size-400" aria-hidden="true" />
                  ) : (
                    <Gift className="icon-size-400" aria-hidden="true" />
                  ))}
                <span className="flex-1">{answerLabel(scenario, option)}</span>
                {revealed && right && <Check className="icon-size-300 shrink-0 text-nice" aria-label="Correct answer" />}
                {revealed && chosen && !right && <X className="icon-size-300 shrink-0" aria-label="Your answer" />}
              </button>
            );
          })}
        </div>

        <div aria-live="polite">
          {revealed && (
            <div
              className={cn(
                'pop-in flex flex-col gap-300 rounded-2xl border-l-4 p-400',
                isCorrect ? 'border-nice bg-nice-soft' : 'border-naughty bg-naughty-soft',
              )}
            >
              <p className="font-heading text-500 leading-500 font-bold">
                {isCorrect ? `Correct! +${scenario.pointValue} pts` : 'Not quite. Coal for that one.'}
              </p>
              {!isCorrect && (
                <p className="text-300 leading-300">
                  <span className="font-semibold">Correct answer:</span> {answerLabel(scenario, scenario.correctAnswer)}
                </p>
              )}
              <p className="text-400 leading-400">
                <span className="font-semibold">The elf foreman says: </span>
                {scenario.explanation}
              </p>
            </div>
          )}
        </div>

        {revealed && (
          <button
            ref={nextRef}
            type="button"
            onClick={advance}
            className="inline-flex items-center justify-center gap-200 self-end rounded-full bg-primary px-600 py-300 text-400 leading-400 font-semibold text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {isLast ? 'See my verdict' : 'Next scenario'}
            <ArrowRight className="icon-size-200" aria-hidden="true" />
          </button>
        )}
      </article>
    </section>
  );
}
