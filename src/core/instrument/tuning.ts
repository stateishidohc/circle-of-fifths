import type { Note } from '../pitch';

/**
 * チューニング定義。strings[0] が 1弦（最高音側）、末尾が最低音弦。
 * ギター以外（7弦・ベース・ウクレレ）にも拡張できるよう弦数は固定しない。
 */
export interface Tuning {
  id: string;
  name: string;
  strings: Note[];
}

const n = (pc: number, octave: number): Note => ({ pc: pc as Note['pc'], octave });

/** 標準チューニング（1弦 E4 → 6弦 E2） */
export const STANDARD_GUITAR: Tuning = {
  id: 'guitar-standard',
  name: 'ギター（標準）',
  strings: [n(4, 4), n(11, 3), n(7, 3), n(2, 3), n(9, 2), n(4, 2)],
};

export const DROP_D: Tuning = {
  id: 'guitar-drop-d',
  name: 'ギター（ドロップD）',
  strings: [n(4, 4), n(11, 3), n(7, 3), n(2, 3), n(9, 2), n(2, 2)],
};

export const DADGAD: Tuning = {
  id: 'guitar-dadgad',
  name: 'ギター（DADGAD）',
  strings: [n(2, 4), n(9, 3), n(7, 3), n(2, 3), n(9, 2), n(2, 2)],
};

export const TUNINGS: readonly Tuning[] = [STANDARD_GUITAR, DROP_D, DADGAD];
