import { describe, expect, it } from 'vitest';
import { triadOf, triadVoicings } from '../../src/core/voicing/triads';
import { voicingShape } from '../../src/core/voicing/generator';
import { voicingSoundedMidis } from '../../src/core/voicing/scorer';
import { STANDARD_GUITAR } from '../../src/core/instrument/tuning';
import { parseChordName } from '../../src/core/chord';
import type { Chord } from '../../src/core/chord';

const chord = (name: string): Chord => {
  const c = parseChordName(name);
  if (!c) throw new Error(`invalid: ${name}`);
  return c;
};

describe('triadOf', () => {
  it('7th コードから土台のトライアドを得る', () => {
    expect(triadOf(chord('Cmaj7')).quality).toBe('maj');
    expect(triadOf(chord('G7')).quality).toBe('maj');
    expect(triadOf(chord('Dm7')).quality).toBe('min');
    expect(triadOf(chord('Bm7b5')).quality).toBe('dim');
  });
});

describe('triadVoicings（1〜3弦セットの C メジャー）', () => {
  const results = triadVoicings(chord('C'), STANDARD_GUITAR, { bassString: 3 });

  it('基本形・第1転回・第2転回の定番シェイプが出る', () => {
    const byShape = new Map(results.map((v) => [voicingShape(v), v]));
    // 2nd inversion（G ベース）: 3弦0 2弦1 1弦0
    expect(byShape.get('xxx010')?.inversion).toBe(2);
    // root position（C ベース）: 3弦5 2弦5 1弦3
    expect(byShape.get('xxx553')?.inversion).toBe(0);
    // 1st inversion（E ベース）: 3弦9 2弦8 1弦8
    expect(byShape.get('xxx988')?.inversion).toBe(1);
  });

  it('転回形タグが付く', () => {
    for (const v of results) {
      expect(v.tags).toContain('triad');
      expect(v.tags).toContain(
        ['root-position', '1st-inversion', '2nd-inversion'][v.inversion],
      );
    }
  });

  it('クローズ（1オクターブ以内・音高昇順）でスパン4フレット以内', () => {
    for (const v of results) {
      const frets = v.positions.filter((p) => p.fret !== null).map((p) => p.fret!);
      expect(frets).toHaveLength(3);
      const fretted = frets.filter((f) => f > 0);
      if (fretted.length) {
        expect(Math.max(...fretted) - Math.min(...fretted)).toBeLessThanOrEqual(3);
      }
    }
  });

  it('すべての弦セットでクローズ（最高音-最低音 < 1オクターブ）', () => {
    const all = triadVoicings(chord('G7'), STANDARD_GUITAR);
    expect(all.length).toBeGreaterThan(0);
    for (const v of all) {
      const midis = voicingSoundedMidis(v, STANDARD_GUITAR);
      expect(midis[2] - midis[0]).toBeLessThan(12);
    }
  });
});

describe('triadVoicings（マイナー・ディミニッシュ、全弦セット）', () => {
  it('Am の 1〜3弦 基本形は 3弦2 2弦1 1弦0', () => {
    const shapes = triadVoicings(chord('Am'), STANDARD_GUITAR, { bassString: 3 }).map((v) =>
      voicingShape(v),
    );
    expect(shapes).toContain('xxx210');
  });
  it('Bm7♭5 からはディミニッシュトライアドが出る', () => {
    const results = triadVoicings(chord('Bm7b5'), STANDARD_GUITAR);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((v) => v.chord.quality === 'dim')).toBe(true);
  });
  it('弦セットは4種類（1-3, 2-4, 3-5, 4-6弦）', () => {
    const results = triadVoicings(chord('C'), STANDARD_GUITAR);
    const sets = new Set(results.map((v) => v.stringSet.join('-')));
    expect(sets).toEqual(new Set(['3-2-1', '4-3-2', '5-4-3', '6-5-4']));
  });
});
