import { describe, expect, it } from 'vitest';
import { midi, midiToNote, noteAscii, noteName, parseNote, pc, spelled } from '../../src/core/pitch';

describe('pc（ピッチクラス計算）', () => {
  it('ナチュラル', () => {
    expect(pc(spelled('C'))).toBe(0);
    expect(pc(spelled('B'))).toBe(11);
  });
  it('異名同音（E♯=F, C♭=B, F𝄪=G）', () => {
    expect(pc({ letter: 'E', accidental: 1 })).toBe(5);
    expect(pc({ letter: 'C', accidental: -1 })).toBe(11);
    expect(pc({ letter: 'F', accidental: 2 })).toBe(7);
    expect(pc({ letter: 'B', accidental: 1 })).toBe(0);
  });
});

describe('parseNote', () => {
  it('ASCII 表記', () => {
    expect(parseNote('F#')).toEqual({ letter: 'F', accidental: 1 });
    expect(parseNote('Gb')).toEqual({ letter: 'G', accidental: -1 });
    expect(parseNote('Bbb')).toEqual({ letter: 'B', accidental: -2 });
    expect(parseNote('C##')).toEqual({ letter: 'C', accidental: 2 });
  });
  it('記号表記', () => {
    expect(parseNote('F♯')).toEqual({ letter: 'F', accidental: 1 });
    expect(parseNote('E♭')).toEqual({ letter: 'E', accidental: -1 });
  });
  it('不正な入力は null', () => {
    expect(parseNote('H')).toBeNull();
    expect(parseNote('C###')).toBeNull();
    expect(parseNote('')).toBeNull();
  });
});

describe('noteName / noteAscii', () => {
  it('英語表記', () => {
    expect(noteName({ letter: 'F', accidental: 1 })).toBe('F♯');
    expect(noteName({ letter: 'B', accidental: -1 })).toBe('B♭');
    expect(noteAscii({ letter: 'E', accidental: 1 })).toBe('E#');
  });
  it('ドレミ表記', () => {
    expect(noteName({ letter: 'F', accidental: 1 }, 'doremi')).toBe('ファ♯');
    expect(noteName({ letter: 'B', accidental: -1 }, 'doremi')).toBe('シ♭');
  });
});

describe('MIDI 変換', () => {
  it('midi / midiToNote が往復する', () => {
    expect(midi({ pc: 0, octave: 4 })).toBe(60); // C4
    expect(midi({ pc: 4, octave: 2 })).toBe(40); // E2
    expect(midiToNote(60)).toEqual({ pc: 0, octave: 4 });
    expect(midiToNote(69)).toEqual({ pc: 9, octave: 4 }); // A4
  });
});
