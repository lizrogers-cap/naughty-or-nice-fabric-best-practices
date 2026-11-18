import type { QuizScenario } from './quiz-api';

/** Human label for an answer value: true/false values read as Naughty / Nice. */
export function answerLabel(scenario: Pick<QuizScenario, 'questionType'>, answer: string): string {
  if (scenario.questionType === 'true_false') return answer === 'naughty' ? 'Naughty' : 'Nice';
  return answer;
}
