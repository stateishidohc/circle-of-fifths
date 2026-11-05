import { describe, expect, it } from 'vitest';
import { scaleNotes, scaleTones } from '../../src/core/scale';
import type { ScaleType } from '../../src/core/scale';
import { noteName, parseNote } from '../../src/core/pitch';
import { intervalLabel, A4, d5, m2, m7 } from '../../src/core/interval';

const names = (tonic: string, type: ScaleType): string => {
  const n = parseNote(tonic);
  if (!n) throw new Error(`invalid: ${tonic}`);
  return scaleNotes(n, type)
    .map((x) => noteName(x))
    .join(' ');
};

describe('7つのモード', () => {
  it('C メジャーの各モードは同じ音の並び替えになる', () => {
    expect(names('D', 'dorian')).toBe('D E F G A B C');
    expect(names('E', 'phrygian')).toBe('E F G A B C D');
    expect(names('F', 'lydian')).toBe('F G A B C D E');
    expect(names('G', 'mixolydian')).toBe('G A B C D E F');
    expect(names('B', 'locrian')).toBe('B C D E F G A');
  });
  it('主音を変えても綴りが正しい', () => {
    expect(names('F#', 'dorian')).toBe('F♯ G♯ A B C♯ D♯ E');
    expect(names('Eb', 'lydian')).toBe('E♭ F G A B♭ C D');
    expect(names('Bb', 'mixolydian')).toBe('B♭ C D E♭ F G A♭');
  });
});

describe('ペンタトニックとブルース', () => {
  it('メジャーペンタ', () => {
    expect(names('C', 'majorPentatonic')).toBe('C D E G A');
    expect(names('F#', 'majorPentatonic')).toBe('F♯ G♯ A♯ C♯ D♯');
  });
  it('マイナーペンタ', () => {
    expect(names('A', 'minorPentatonic')).toBe('A C D E G');
    expect(names('Eb', 'minorPentatonic')).toBe('E♭ G♭ A♭ B♭ D♭');
  });
  it('ブルース（♭5 の綴りは減5度）', () => {
    expect(names('A', 'blues')).toBe('A C D E♭ E G');
    expect(names('C', 'blues')).toBe('C E♭ F G♭ G B♭');
  });
});

describe('intervalLabel（度数ラベル）', () => {
  it('基本', () => {
    expect(intervalLabel({ degree: 1, semitones: 0 })).toBe('R');
    expect(intervalLabel(m2)).toBe('♭2');
    expect(intervalLabel(A4)).toBe('♯4');
    expect(intervalLabel(d5)).toBe('♭5');
    expect(intervalLabel(m7)).toBe('♭7');
  });
  it('scaleTones がラベル付きで返す', () => {
    const a = parseNote('A')!;
    const tones = scaleTones(a, 'minorPentatonic');
    expect(tones.map((t) => t.label).join(' ')).toBe('R ♭3 4 5 ♭7');
    expect(tones[0].isRoot).toBe(true);
    expect(tones.slice(1).every((t) => !t.isRoot)).toBe(true);
  });
});
