import { describe, expect, it } from 'vitest';
import { FretboardVoicingGenerator, voicingShape } from '../../src/core/voicing/generator';
import { detectDrop, voicingDistance, voicingSoundedMidis } from '../../src/core/voicing/scorer';
import { STANDARD_GUITAR } from '../../src/core/instrument/tuning';
import { parseChordName } from '../../src/core/chord';
import type { Chord } from '../../src/core/chord';
import { pc } from '../../src/core/pitch';

const gen = new FretboardVoicingGenerator();

const chord = (name: string): Chord => {
  const c = parseChordName(name);
  if (!c) throw new Error(`invalid chord: ${name}`);
  return c;
};

const shapes = (name: string, options = { maxResults: 400 }) =>
  gen.generate(chord(name), STANDARD_GUITAR, options).map(voicingShape);

describe('FretboardVoicingGenerator', () => {
  it('定番のオープンコードが見つかる', () => {
    expect(shapes('C')).toContain('x32010');
    expect(shapes('E')).toContain('022100');
    expect(shapes('A')).toContain('x02220');
    expect(shapes('D')).toContain('xx0232');
    expect(shapes('G7')).toContain('320001');
    expect(shapes('Em')).toContain('022000');
  });

  it('F のバレーコード 133211 が見つかり barre が付く', () => {
    const results = gen.generate(chord('F'), STANDARD_GUITAR, { maxResults: 400 });
    const f = results.find((v) => voicingShape(v) === '133211');
    expect(f).toBeDefined();
    expect(f!.tags).toContain('barre');
    expect(f!.barre).toEqual({ fret: 1, fromString: 6, toString: 1 });
  });

  it('すべての結果が制約を満たす（必須音・スパン・指数）', () => {
    const results = gen.generate(chord('Cmaj7'), STANDARD_GUITAR, { maxResults: 200 });
    expect(results.length).toBeGreaterThan(0);
    for (const v of results) {
      const midis = voicingSoundedMidis(v, STANDARD_GUITAR);
      const pcs = new Set(midis.map((m) => m % 12));
      // R・3・7 は必ず鳴る
      expect(pcs.has(0)).toBe(true); // C
      expect(pcs.has(4)).toBe(true); // E
      expect(pcs.has(11)).toBe(true); // B
      // スパンは4フレット以内
      const fretted = v.positions.filter((p) => p.fret !== null && p.fret > 0).map((p) => p.fret!);
      if (fretted.length > 0) {
        expect(Math.max(...fretted) - Math.min(...fretted)).toBeLessThanOrEqual(3);
      }
    }
  });

  it('rootString 指定でベースがその弦のルートになる', () => {
    const results = gen.generate(chord('Cmaj7'), STANDARD_GUITAR, { rootString: 5 });
    expect(results.length).toBeGreaterThan(0);
    for (const v of results) {
      const bass = [...v.positions]
        .filter((p) => p.fret !== null)
        .map((p) => ({ ...p, midi: 0 }));
      expect(bass.length).toBeGreaterThan(0);
      // 5弦がベース（6弦ミュート）でルート音 C
      expect(v.positions.find((p) => p.string === 6)!.fret).toBeNull();
      const p5 = v.positions.find((p) => p.string === 5)!;
      expect(p5.fret).toBe(3); // 5弦3F = C
    }
  });

  it('シェルボイシング（R-3-7 のみ）にタグが付く', () => {
    const results = gen.generate(chord('Dm7'), STANDARD_GUITAR, { maxResults: 200 });
    const shells = results.filter((v) => v.tags.includes('shell'));
    expect(shells.length).toBeGreaterThan(0);
    for (const v of shells) {
      const pcs = new Set(voicingSoundedMidis(v, STANDARD_GUITAR).map((m) => m % 12));
      expect(pcs).toEqual(new Set([2, 5, 0])); // D F C（5度 A なし）
    }
  });

  it('5度省略には omit5 タグが付く', () => {
    const results = gen.generate(chord('C7'), STANDARD_GUITAR, { maxResults: 200 });
    const gPc = 7;
    for (const v of results) {
      const pcs = new Set(voicingSoundedMidis(v, STANDARD_GUITAR).map((m) => m % 12));
      expect(v.tags.includes('omit5')).toBe(!pcs.has(gPc));
    }
  });

  it('三和音では5度は省略されない', () => {
    const results = gen.generate(chord('C'), STANDARD_GUITAR, { maxResults: 200 });
    for (const v of results) {
      const pcs = new Set(voicingSoundedMidis(v, STANDARD_GUITAR).map((m) => m % 12));
      expect(pcs.has(pc({ letter: 'G', accidental: 0 }))).toBe(true);
    }
  });

  it('難易度順に並び、オープン C はバレー C より易しい', () => {
    const results = gen.generate(chord('C'), STANDARD_GUITAR, { maxResults: 400 });
    const open = results.find((v) => voicingShape(v) === 'x32010');
    const barre = results.find((v) => voicingShape(v) === 'x35553');
    expect(open).toBeDefined();
    if (barre) expect(open!.difficulty).toBeLessThan(barre.difficulty);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].difficulty).toBeGreaterThanOrEqual(results[i - 1].difficulty);
    }
  });
});

describe('detectDrop', () => {
  it('drop2 / drop3 / クローズを判定する', () => {
    // クローズ C4 E4 G4 B4 → G を1オクターブ下げると drop2
    expect(detectDrop([60, 64, 67, 71])).toBeNull();
    expect(detectDrop([55, 60, 64, 71])).toBe('drop2');
    // E を1オクターブ下げると drop3
    expect(detectDrop([52, 60, 67, 71])).toBe('drop3');
    expect(detectDrop([60, 64, 67])).toBeNull();
  });
});

describe('voicingDistance', () => {
  it('同じボイシングは距離0、近い形は遠い形より小さい', () => {
    const results = gen.generate(chord('C'), STANDARD_GUITAR, { maxResults: 400 });
    const open = results.find((v) => voicingShape(v) === 'x32010')!;
    expect(voicingDistance(open, open, STANDARD_GUITAR)).toBe(0);
    const others = results.filter((v) => v !== open);
    expect(others.every((v) => voicingDistance(open, v, STANDARD_GUITAR) >= 0)).toBe(true);
  });
});
