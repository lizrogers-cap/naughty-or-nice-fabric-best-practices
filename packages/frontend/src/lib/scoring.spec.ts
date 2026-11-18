import {
  parseOptions,
  percentOf,
  pointsFor,
  sanitizePlayerName,
  verdictFor,
} from '@rayfin-app/shared';
import { describe, expect, it } from 'vitest';

describe('verdict tiers', () => {
  it.each([
    [0, 'Lump of Coal'],
    [39, 'Lump of Coal'],
    [40, 'Workshop Apprentice'],
    [69, 'Workshop Apprentice'],
    [70, 'Nice List'],
    [89, 'Nice List'],
    [90, 'North Pole Certified'],
    [100, 'North Pole Certified'],
  ])('%i%% → %s', (pct, name) => {
    expect(verdictFor(pct).name).toBe(name);
  });

  it('scores pointValue for correct answers and 0 otherwise', () => {
    expect(pointsFor(true, 10)).toBe(10);
    expect(pointsFor(false, 10)).toBe(0);
  });

  it('computes clamped whole percentages', () => {
    expect(percentOf(117, 130)).toBe(90);
    expect(percentOf(0, 0)).toBe(0);
    expect(percentOf(200, 100)).toBe(100);
  });
});

describe('sanitizePlayerName', () => {
  it('trims, collapses whitespace and caps at 30 characters', () => {
    expect(sanitizePlayerName('   Jingle    Bells  ')).toBe('Jingle Bells');
    expect(sanitizePlayerName('x'.repeat(50))).toHaveLength(30);
  });

  it('strips control and bidi-override characters', () => {
    expect(sanitizePlayerName('Ev‮il\u0000Elf​')).toBe('EvilElf');
    expect(sanitizePlayerName('\u0007​ ')).toBe('');
  });

  it('does not split surrogate pairs when capping', () => {
    const name = '🎄'.repeat(40);
    expect(Array.from(sanitizePlayerName(name))).toHaveLength(30);
  });
});

describe('parseOptions', () => {
  it('decodes JSON string arrays and tolerates bad data', () => {
    expect(parseOptions('["a","b"]')).toEqual(['a', 'b']);
    expect(parseOptions(null)).toEqual([]);
    expect(parseOptions('not json')).toEqual([]);
    expect(parseOptions('{"a":1}')).toEqual([]);
  });
});
