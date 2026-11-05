import { describe, expect, it } from 'vitest';
import { scaleNotes } from '../../src/core/scale';
import { noteName, parseNote } from '../../src/core/pitch';
import type { ScaleType } from '../../src/core/scale';

const names = (tonic: string, type: ScaleType): string => {
  const n = parseNote(tonic);
  if (!n) throw new Error(`invalid: ${tonic}`);
  return scaleNotes(n, type)
    .map((x) => noteName(x))
    .join(' ');
};

describe('メジャースケール（12キー＋異名同音）', () => {
  const MAJOR: [string, string][] = [
    ['C', 'C D E F G A B'],
    ['G', 'G A B C D E F♯'],
    ['D', 'D E F♯ G A B C♯'],
    ['A', 'A B C♯ D E F♯ G♯'],
    ['E', 'E F♯ G♯ A B C♯ D♯'],
    ['B', 'B C♯ D♯ E F♯ G♯ A♯'],
    ['F#', 'F♯ G♯ A♯ B C♯ D♯ E♯'],
    ['Db', 'D♭ E♭ F G♭ A♭ B♭ C'],
    ['Ab', 'A♭ B♭ C D♭ E♭ F G'],
    ['Eb', 'E♭ F G A♭ B♭ C D'],
    ['Bb', 'B♭ C D E♭ F G A'],
    ['F', 'F G A B♭ C D E'],
    // 異名同音キー
    ['Gb', 'G♭ A♭ B♭ C♭ D♭ E♭ F'],
    ['C#', 'C♯ D♯ E♯ F♯ G♯ A♯ B♯'],
  ];
  it.each(MAJOR)('%s メジャー = %s', (tonic, expected) => {
    expect(names(tonic, 'major')).toBe(expected);
  });
});

describe('ナチュラルマイナースケール（12キー）', () => {
  const MINOR: [string, string][] = [
    ['A', 'A B C D E F G'],
    ['E', 'E F♯ G A B C D'],
    ['B', 'B C♯ D E F♯ G A'],
    ['F#', 'F♯ G♯ A B C♯ D E'],
    ['C#', 'C♯ D♯ E F♯ G♯ A B'],
    ['G#', 'G♯ A♯ B C♯ D♯ E F♯'],
    ['D#', 'D♯ E♯ F♯ G♯ A♯ B C♯'],
    ['Bb', 'B♭ C D♭ E♭ F G♭ A♭'],
    ['F', 'F G A♭ B♭ C D♭ E♭'],
    ['C', 'C D E♭ F G A♭ B♭'],
    ['G', 'G A B♭ C D E♭ F'],
    ['D', 'D E F G A B♭ C'],
  ];
  it.each(MINOR)('%s マイナー = %s', (tonic, expected) => {
    expect(names(tonic, 'naturalMinor')).toBe(expected);
  });
});

describe('ハーモニック／メロディックマイナー', () => {
  it('A ハーモニックマイナーは第7音が G♯', () => {
    expect(names('A', 'harmonicMinor')).toBe('A B C D E F G♯');
  });
  it('A メロディックマイナーは第6・7音が F♯ G♯', () => {
    expect(names('A', 'melodicMinor')).toBe('A B C D E F♯ G♯');
  });
  it('E♭ ハーモニックマイナーは第7音が D（♮）', () => {
    expect(names('Eb', 'harmonicMinor')).toBe('E♭ F G♭ A♭ B♭ C♭ D');
  });
  it('G♯ ハーモニックマイナーは第7音が F𝄪', () => {
    expect(names('G#', 'harmonicMinor')).toBe('G♯ A♯ B C♯ D♯ E F𝄪');
  });
});
