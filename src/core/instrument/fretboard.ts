import type { Note, PitchClass } from '../pitch';
import { midi, midiToNote } from '../pitch';
import type { Tuning } from './tuning';

/**
 * 指板座標（弦, フレット）⇔ 音高の変換。Phase 2 の指板ビューと
 * Phase 4 のボイシング生成の両方がこのモジュールを使う。
 */

/** string は 1 始まり（1弦=最高音側）。fret 0 = 開放弦 */
export function noteAt(tuning: Tuning, string: number, fret: number): Note {
  const open = tuning.strings[string - 1];
  if (!open) throw new Error(`noteAt: ${string}弦は存在しません (${tuning.id})`);
  if (fret < 0) throw new Error(`noteAt: フレットが負です: ${fret}`);
  return midiToNote(midi(open) + fret);
}

export interface FretboardPosition {
  string: number;
  fret: number;
}

/** 指定ピッチクラスの音が押さえられる位置をすべて返す */
export function positionsOfPc(
  tuning: Tuning,
  pc: PitchClass,
  options: { minFret?: number; maxFret?: number } = {},
): FretboardPosition[] {
  const { minFret = 0, maxFret = 15 } = options;
  const result: FretboardPosition[] = [];
  for (let s = 1; s <= tuning.strings.length; s++) {
    for (let f = minFret; f <= maxFret; f++) {
      if (noteAt(tuning, s, f).pc === pc) result.push({ string: s, fret: f });
    }
  }
  return result;
}
