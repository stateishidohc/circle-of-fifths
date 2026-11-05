import { describe, expect, it } from 'vitest';
import { noteAt, positionsOfPc } from '../../src/core/instrument/fretboard';
import { DROP_D, STANDARD_GUITAR } from '../../src/core/instrument/tuning';
import { midi } from '../../src/core/pitch';

describe('noteAt（標準チューニング）', () => {
  it('開放弦', () => {
    expect(noteAt(STANDARD_GUITAR, 1, 0)).toEqual({ pc: 4, octave: 4 }); // E4
    expect(noteAt(STANDARD_GUITAR, 6, 0)).toEqual({ pc: 4, octave: 2 }); // E2
  });
  it('フレットを足すと半音ずつ上がる', () => {
    expect(noteAt(STANDARD_GUITAR, 5, 3)).toEqual({ pc: 0, octave: 3 }); // A2+3 = C3
    expect(noteAt(STANDARD_GUITAR, 6, 5).pc).toBe(noteAt(STANDARD_GUITAR, 5, 0).pc); // 5F=次の開放
    expect(midi(noteAt(STANDARD_GUITAR, 2, 1))).toBe(60); // B3+1 = C4
  });
  it('ドロップD は6弦が全音下がる', () => {
    expect(noteAt(DROP_D, 6, 0)).toEqual({ pc: 2, octave: 2 }); // D2
  });
});

describe('positionsOfPc', () => {
  it('0〜5フレットの C (pc=0) の位置', () => {
    const positions = positionsOfPc(STANDARD_GUITAR, 0, { maxFret: 5 });
    expect(positions).toContainEqual({ string: 2, fret: 1 });
    expect(positions).toContainEqual({ string: 3, fret: 5 });
    expect(positions).toContainEqual({ string: 5, fret: 3 });
    // 6弦の C は8フレットなので範囲外
    expect(positions.some((p) => p.string === 6)).toBe(false);
  });
});
