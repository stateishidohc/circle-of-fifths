/**
 * 音高の基礎。計算は PitchClass(0-11) で行い、表示用の綴りは SpelledNote で持つ。
 */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** -2=𝄫, -1=♭, 0=なし, 1=♯, 2=𝄪 */
export type Accidental = -2 | -1 | 0 | 1 | 2;

export interface SpelledNote {
  letter: Letter;
  accidental: Accidental;
}

/** 実音（オクターブ付き）。MIDI ノート番号に変換できる */
export interface Note {
  pc: PitchClass;
  octave: number;
}

export const LETTERS: readonly Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const NATURAL_PC: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function spelled(letter: Letter, accidental: Accidental = 0): SpelledNote {
  return { letter, accidental };
}

export function pc(note: SpelledNote): PitchClass {
  return ((((NATURAL_PC[note.letter] + note.accidental) % 12) + 12) % 12) as PitchClass;
}

const ACC_SYMBOL: Record<Accidental, string> = {
  [-2]: '𝄫',
  [-1]: '♭',
  [0]: '',
  [1]: '♯',
  [2]: '𝄪',
};

const ACC_ASCII: Record<Accidental, string> = {
  [-2]: 'bb',
  [-1]: 'b',
  [0]: '',
  [1]: '#',
  [2]: '##',
};

export type Notation = 'english' | 'doremi';

const DOREMI: Record<Letter, string> = {
  C: 'ド',
  D: 'レ',
  E: 'ミ',
  F: 'ファ',
  G: 'ソ',
  A: 'ラ',
  B: 'シ',
};

/** 表示用の音名（例: F♯, B♭, E♯） */
export function noteName(note: SpelledNote, notation: Notation = 'english'): string {
  const base = notation === 'doremi' ? DOREMI[note.letter] : note.letter;
  return base + ACC_SYMBOL[note.accidental];
}

/** URL などで使う ASCII 表記（例: F#, Bb） */
export function noteAscii(note: SpelledNote): string {
  return note.letter + ACC_ASCII[note.accidental];
}

/** "F#", "Gb", "F♯", "B𝄫" などを解析する */
export function parseNote(text: string): SpelledNote | null {
  const m = /^([A-Ga-g])(𝄪|##|x|♯|#|𝄫|bb|♭|b)?$/.exec(text.trim());
  if (!m) return null;
  const letter = m[1].toUpperCase() as Letter;
  const accText = m[2] ?? '';
  const acc: Accidental =
    accText === '' ? 0
    : accText === '#' || accText === '♯' ? 1
    : accText === '##' || accText === 'x' || accText === '𝄪' ? 2
    : accText === 'bb' || accText === '𝄫' ? -2
    : -1;
  return { letter, accidental: acc };
}

export function sameSpelling(a: SpelledNote, b: SpelledNote): boolean {
  return a.letter === b.letter && a.accidental === b.accidental;
}

export function midi(note: Note): number {
  return note.pc + 12 * (note.octave + 1);
}

export function midiToNote(m: number): Note {
  return { pc: ((m % 12) + 12) % 12 as PitchClass, octave: Math.floor(m / 12) - 1 };
}
