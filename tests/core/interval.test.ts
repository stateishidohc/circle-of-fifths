import { describe, expect, it } from 'vitest';
import { M3, M7, P4, P5, m3, semitonesBetween, transpose } from '../../src/core/interval';
import { noteName, parseNote } from '../../src/core/pitch';
import type { SpelledNote } from '../../src/core/pitch';

const n = (s: string): SpelledNote => {
  const note = parseNote(s);
  if (!note) throw new Error(`invalid: ${s}`);
  return note;
};

describe('transpose（綴りの正しさ）', () => {
  it('基本', () => {
    expect(noteName(transpose(n('C'), M3))).toBe('E');
    expect(noteName(transpose(n('C'), P5))).toBe('G');
    expect(noteName(transpose(n('A'), m3))).toBe('C');
  });
  it('F♯ の長7度は E♯（F ではない）', () => {
    expect(noteName(transpose(n('F#'), M7))).toBe('E♯');
  });
  it('G♭ の完全4度は C♭（B ではない）', () => {
    expect(noteName(transpose(n('Gb'), P4))).toBe('C♭');
  });
  it('B の長3度は D♯、D♭ の長3度は F', () => {
    expect(noteName(transpose(n('B'), M3))).toBe('D♯');
    expect(noteName(transpose(n('Db'), M3))).toBe('F');
  });
});

describe('semitonesBetween', () => {
  it('上方向の半音数を返す', () => {
    expect(semitonesBetween(n('C'), n('E'))).toBe(4);
    expect(semitonesBetween(n('E'), n('C'))).toBe(8);
    expect(semitonesBetween(n('F#'), n('E#'))).toBe(11);
  });
});
