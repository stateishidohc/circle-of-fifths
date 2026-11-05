import type { Accidental, SpelledNote } from './pitch';
import { LETTERS, NATURAL_PC, pc } from './pitch';

/**
 * 音程。degree は 1 始まり（1=ユニゾン, 3=3度, 9=9度 …）。
 * 綴り（異名同音）の正しさは「letter を degree-1 歩進め、半音数に合う臨時記号を付ける」
 * ことで機械的に決まる。
 */
export interface Interval {
  degree: number;
  semitones: number;
}

export const P1: Interval = { degree: 1, semitones: 0 };
export const m2: Interval = { degree: 2, semitones: 1 };
export const M2: Interval = { degree: 2, semitones: 2 };
export const m3: Interval = { degree: 3, semitones: 3 };
export const M3: Interval = { degree: 3, semitones: 4 };
export const P4: Interval = { degree: 4, semitones: 5 };
export const A4: Interval = { degree: 4, semitones: 6 };
export const d5: Interval = { degree: 5, semitones: 6 };
export const P5: Interval = { degree: 5, semitones: 7 };
export const A5: Interval = { degree: 5, semitones: 8 };
export const m6: Interval = { degree: 6, semitones: 8 };
export const M6: Interval = { degree: 6, semitones: 9 };
export const d7: Interval = { degree: 7, semitones: 9 };
export const m7: Interval = { degree: 7, semitones: 10 };
export const M7: Interval = { degree: 7, semitones: 11 };
export const P8: Interval = { degree: 8, semitones: 12 };
export const M9: Interval = { degree: 9, semitones: 14 };

/** note を interval だけ上に移調し、文脈に合った綴りで返す */
export function transpose(note: SpelledNote, interval: Interval): SpelledNote {
  const li = LETTERS.indexOf(note.letter);
  const newLetter = LETTERS[(li + interval.degree - 1) % 7];
  const targetPc = (((pc(note) + interval.semitones) % 12) + 12) % 12;
  let acc = targetPc - NATURAL_PC[newLetter];
  acc = ((acc % 12) + 12) % 12;
  if (acc > 6) acc -= 12;
  if (acc < -2 || acc > 2) {
    throw new Error(
      `transpose: ${note.letter}${note.accidental} + ${interval.degree}/${interval.semitones} は三重臨時記号になります`,
    );
  }
  return { letter: newLetter, accidental: acc as Accidental };
}

/** a から b まで上方向の半音数 (0-11) */
export function semitonesBetween(a: SpelledNote, b: SpelledNote): number {
  return (pc(b) - pc(a) + 12) % 12;
}
