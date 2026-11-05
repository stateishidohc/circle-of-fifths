import { describe, expect, it } from 'vitest';
import { cagedPositions, cagedWindow } from '../../src/core/instrument/positions';
import { STANDARD_GUITAR } from '../../src/core/instrument/tuning';

describe('cagedPositions', () => {
  it('キー C（6弦ルート 8フレット）の 5 シェイプ窓', () => {
    const windows = cagedPositions(STANDARD_GUITAR, 0, 15);
    const byShape = Object.fromEntries(
      windows.map((w) => [`${w.shape}@${w.minFret}`, [w.minFret, w.maxFret]]),
    );
    // E シェイプはルートフレット 8 から
    expect(byShape['E@8']).toEqual([8, 11]);
    // C シェイプはオープンポジション（12 − 8 = 0 から）
    expect(byShape['C@0']).toEqual([0, 4]);
    expect(byShape['A@2']).toEqual([2, 5]);
    expect(byShape['G@4']).toEqual([4, 8]);
    expect(byShape['D@10']).toEqual([10, 14]);
  });
  it('窓は指板範囲にクリップされ、昇順で返る', () => {
    const windows = cagedPositions(STANDARD_GUITAR, 0, 12);
    expect(windows.every((w) => w.minFret >= 0 && w.maxFret <= 12)).toBe(true);
    const mins = windows.map((w) => w.minFret);
    expect([...mins].sort((a, b) => a - b)).toEqual(mins);
  });
  it('cagedWindow は最初に現れる窓を返す', () => {
    const w = cagedWindow(STANDARD_GUITAR, 0, 15, 'E');
    expect(w).toEqual({ shape: 'E', minFret: 8, maxFret: 11 });
  });
});
