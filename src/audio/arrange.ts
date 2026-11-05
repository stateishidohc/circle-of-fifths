import type { SpelledNote } from '../core/pitch';
import { pc } from '../core/pitch';

/**
 * 綴り音列 → MIDI ノート番号列への割り当て。
 * 簡易シンセで鳴らすための音域決めだけを行う（理論判断はしない）。
 */

/** コード構成音をルート（C3〜B3）から上に積む */
export function stackChordMidis(notes: SpelledNote[]): number[] {
  if (notes.length === 0) return [];
  const midis = [48 + pc(notes[0])];
  for (let i = 1; i < notes.length; i++) {
    const prev = midis[i - 1];
    const diff = (pc(notes[i]) - (prev % 12) + 12) % 12 || 12;
    midis.push(prev + diff);
  }
  return midis;
}

/** スケールを主音（A3〜G♯4）から1オクターブ上行して下行する音列 */
export function scaleRunMidis(notes: SpelledNote[]): number[] {
  if (notes.length === 0) return [];
  const m0 = 57 + ((pc(notes[0]) + 3) % 12);
  const up = [m0];
  for (let i = 1; i < notes.length; i++) {
    const prev = up[i - 1];
    const diff = (pc(notes[i]) - (prev % 12) + 12) % 12 || 12;
    up.push(prev + diff);
  }
  up.push(m0 + 12);
  return [...up, ...up.slice(0, -1).reverse()];
}
