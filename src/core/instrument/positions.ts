import type { PitchClass } from '../pitch';
import type { Tuning } from './tuning';

/**
 * CAGED システムの 5 ポジション（フレット窓）。
 * 最低音弦上のルート（Eシェイプのルートフレット r）を基準に、
 * 各シェイプの窓を相対位置で定義する（教材的な近似。1フレット程度の流儀差はある）。
 */
export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D';

export const CAGED_SHAPES: readonly CagedShape[] = ['C', 'A', 'G', 'E', 'D'];

export interface PositionWindow {
  shape: CagedShape;
  minFret: number;
  maxFret: number;
}

/** Eシェイプのルートフレット r に対する各シェイプ窓の相対位置 */
const SHAPE_OFFSETS: Record<CagedShape, { lo: number; hi: number }> = {
  E: { lo: 0, hi: 3 },
  D: { lo: 2, hi: 6 },
  C: { lo: 4, hi: 8 },
  A: { lo: 6, hi: 9 },
  G: { lo: 8, hi: 12 },
};

/**
 * 指板範囲 [0, maxFret] 内にかかる CAGED 窓をすべて返す（同じシェイプが
 * 12フレット上にもう一度現れることがある）。minFret 昇順。
 */
export function cagedPositions(
  tuning: Tuning,
  rootPc: PitchClass,
  maxFret: number,
): PositionWindow[] {
  const lowest = tuning.strings[tuning.strings.length - 1];
  const r = (rootPc - lowest.pc + 12) % 12;
  const result: PositionWindow[] = [];
  for (const shape of CAGED_SHAPES) {
    const { lo, hi } = SHAPE_OFFSETS[shape];
    for (let base = r - 12; base <= maxFret + 12; base += 12) {
      const minFret = base + lo;
      const maxF = base + hi;
      if (maxF < 0 || minFret > maxFret) continue;
      result.push({ shape, minFret: Math.max(0, minFret), maxFret: Math.min(maxFret, maxF) });
    }
  }
  return result.sort((a, b) => a.minFret - b.minFret || a.maxFret - b.maxFret);
}

/** 指定シェイプの窓（指板範囲内で最初に現れるもの）を返す */
export function cagedWindow(
  tuning: Tuning,
  rootPc: PitchClass,
  maxFret: number,
  shape: CagedShape,
): PositionWindow | null {
  return cagedPositions(tuning, rootPc, maxFret).find((w) => w.shape === shape) ?? null;
}
