import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { QuizScenario } from '@/lib/quiz-api';

const scenarios: QuizScenario[] = [
  {
    id: 's1',
    slug: 'one',
    prompt: 'Friday push straight to Prod?',
    questionType: 'true_false',
    options: ['naughty', 'nice'],
    correctAnswer: 'naughty',
    explanation: 'Use deployment pipelines.',
    naughtyOrNice: 'naughty',
    category: 'CI/CD',
    pointValue: 10,
  },
  {
    id: 's2',
    slug: 'two',
    prompt: 'Best model shape?',
    questionType: 'multiple_choice',
    options: ['Flat table', 'Star schema'],
    correctAnswer: 'Star schema',
    explanation: 'Star schema wins.',
    naughtyOrNice: 'nice',
    category: 'Modeling',
    pointValue: 10,
  },
];

const api = vi.hoisted(() => ({
  loadScenarios: vi.fn(),
  submitAttempt: vi.fn(),
  loadLeaderboards: vi.fn(),
}));
vi.mock('@/lib/quiz-api', () => api);

import App from '@/App';

beforeEach(() => {
  api.loadScenarios.mockResolvedValue(scenarios);
  api.submitAttempt.mockResolvedValue('attempt-1');
  api.loadLeaderboards.mockResolvedValue({
    nice: [{ id: 'attempt-1', playerName: 'Tinsel', score: 10, verdict: 'Workshop Apprentice', completedAt: new Date('2026-12-01') }],
    naughty: [],
  });
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function answer(name: RegExp) {
  await act(async () => fireEvent.click(screen.getByRole('button', { name })));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: /Next scenario|See my verdict/ })));
}

describe('App', () => {
  it('plays a full round, saves the attempt, and shows the verdict and review', async () => {
    render(<App />);
    fireEvent.change(await screen.findByLabelText(/guest book/i), { target: { value: '  Tinsel  ' } });
    const start = await screen.findByRole('button', { name: /Start the countdown \(2 scenarios\)/ });
    await act(async () => fireEvent.click(start));

    // Answer whichever scenario appears first: one right, one wrong.
    for (let i = 0; i < 2; i++) {
      if (screen.queryByText('Friday push straight to Prod?')) {
        await act(async () => fireEvent.click(screen.getByRole('button', { name: /^Naughty$/ })));
        expect(screen.getByText(/Correct! \+10 pts/)).toBeVisible();
        expect(screen.getByText(/Use deployment pipelines\./)).toBeVisible();
        await act(async () => fireEvent.click(screen.getByRole('button', { name: /Next scenario|See my verdict/ })));
      } else {
        await answer(/Flat table/);
      }
    }

    expect(await screen.findByText('Score saved to the Winter 2026 scoreboard.')).toBeVisible();
    expect(api.submitAttempt).toHaveBeenCalledTimes(1);
    const saved = api.submitAttempt.mock.calls[0]![0];
    expect(saved).toMatchObject({ playerName: 'Tinsel', score: 10, verdict: 'Workshop Apprentice' });
    expect(saved.answers).toHaveLength(2);
    expect(saved.answers[0]).not.toHaveProperty('points');

    expect(screen.getByText('Scenario review')).toBeVisible();
    expect(screen.getAllByText('Workshop Apprentice').length).toBeGreaterThan(0);
  });

  it('highlights the current player on the scoreboard and shows per-list empty states', async () => {
    window.localStorage.setItem('naughty-or-nice:my-attempts', JSON.stringify(['attempt-1']));
    render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Scoreboard' })));

    const niceRow = (await screen.findByText('Tinsel')).closest('li')!;
    expect(niceRow).toHaveAttribute('aria-current', 'true');
    expect(within(niceRow).getByText('You')).toBeVisible();
    expect(screen.getByText(/Somebody is hiding their Friday deployments/)).toBeVisible();
    expect(screen.getByText(/Only 1 player has finished/)).toBeVisible();
  });

  it('renders hostile player names as inert text', async () => {
    api.loadLeaderboards.mockResolvedValue({
      nice: [{ id: 'x', playerName: '<img src=x onerror=alert(1)>', score: 5, verdict: 'Lump of Coal', completedAt: new Date() }],
      naughty: [],
    });
    const { container } = render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Scoreboard' })));
    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeVisible();
    expect(container.querySelector('img')).toBeNull();
  });

  it('surfaces a scenario load failure with a retry instead of loading forever', async () => {
    api.loadScenarios.mockRejectedValueOnce(new Error('boom'));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load the workshop scenarios");
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Try again' })));
    expect(await screen.findByRole('button', { name: /2 scenarios/ })).toBeVisible();
  });
});
