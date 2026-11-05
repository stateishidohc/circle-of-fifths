import { describe, expect, it } from 'vitest';
import { chordName, chordTones, parseChordName } from '../../src/core/chord';
import type { Chord } from '../../src/core/chord';
import { noteName, parseNote } from '../../src/core/pitch';

const n = (s: string) => {
  const note = parseNote(s);
  if (!note) throw new Error(`invalid: ${s}`);
  return note;
};

describe('chordTones', () => {
  it('C7 = C E G B♭（役割付き）', () => {
    const tones = chordTones({ root: n('C'), quality: '7' });
    expect(tones.map((t) => noteName(t.note)).join(' ')).toBe('C E G B♭');
    expect(tones.map((t) => t.role)).toEqual(['R', '3', '5', '7']);
    // 5度は省略可能、R/3/7 は essential
    expect(tones.map((t) => t.essential)).toEqual([true, true, false, true]);
  });
  it('F♯maj7 の7度は E♯', () => {
    const tones = chordTones({ root: n('F#'), quality: 'maj7' });
    expect(tones.map((t) => noteName(t.note)).join(' ')).toBe('F♯ A♯ C♯ E♯');
  });
  it('Bm7♭5 = B D F A（減5度は essential）', () => {
    const tones = chordTones({ root: n('B'), quality: 'm7b5' });
    expect(tones.map((t) => noteName(t.note)).join(' ')).toBe('B D F A');
    expect(tones[2].essential).toBe(true);
  });
  it('G♯dim7 = G♯ B D F', () => {
    const tones = chordTones({ root: n('G#'), quality: 'dim7' });
    expect(tones.map((t) => noteName(t.note)).join(' ')).toBe('G♯ B D F');
  });
});

describe('chordName', () => {
  it('サフィックス表記', () => {
    expect(chordName({ root: n('C'), quality: 'maj' })).toBe('C');
    expect(chordName({ root: n('F#'), quality: 'm7b5' })).toBe('F♯m7♭5');
    expect(chordName({ root: n('Bb'), quality: 'maj7' })).toBe('B♭maj7');
    expect(chordName({ root: n('A'), quality: 'mM7' })).toBe('AmM7');
  });
  it('分数コード', () => {
    const c: Chord = { root: n('C'), quality: 'maj', bass: n('G') };
    expect(chordName(c)).toBe('C/G');
  });
});

describe('parseChordName', () => {
  it('基本形を解析する', () => {
    expect(parseChordName('F#m7')).toEqual({ root: n('F#'), quality: 'm7' });
    expect(parseChordName('Bbmaj7')).toEqual({ root: n('Bb'), quality: 'maj7' });
    expect(parseChordName('Cm7b5')).toEqual({ root: n('C'), quality: 'm7b5' });
    expect(parseChordName('G')).toEqual({ root: n('G'), quality: 'maj' });
  });
  it('往復変換（名前 → 解析 → 名前）', () => {
    const name = 'E♭m7';
    const parsed = parseChordName(name);
    expect(parsed && chordName(parsed)).toBe(name);
  });
  it('不明なサフィックスは null', () => {
    expect(parseChordName('C13alt')).toBeNull();
  });
});
