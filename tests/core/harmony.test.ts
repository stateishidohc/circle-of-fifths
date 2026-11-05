import { describe, expect, it } from 'vitest';
import {
  avoidNotes,
  borrowedChords,
  relatedKeys,
  secondaryDominants,
  tritonePair,
  tritoneSubstitute,
} from '../../src/core/harmony';
import { chordName } from '../../src/core/chord';
import { diatonicChords } from '../../src/core/diatonic';
import type { Key, Mode } from '../../src/core/key';
import { noteName, parseNote } from '../../src/core/pitch';
import { scaleNotes } from '../../src/core/scale';

const key = (tonic: string, mode: Mode): Key => {
  const n = parseNote(tonic);
  if (!n) throw new Error(`invalid: ${tonic}`);
  return { tonic: n, mode };
};

describe('relatedKeys（近親調）', () => {
  it('C メジャー', () => {
    const r = relatedKeys(key('C', 'major'));
    expect(noteName(r.relative.tonic)).toBe('A');
    expect(r.relative.mode).toBe('minor');
    expect(r.parallel.mode).toBe('minor');
    expect(noteName(r.dominant.tonic)).toBe('G');
    expect(noteName(r.subdominant.tonic)).toBe('F');
  });
  it('E♭ メジャーの属調・下属調は B♭・A♭', () => {
    const r = relatedKeys(key('Eb', 'major'));
    expect(noteName(r.dominant.tonic)).toBe('B♭');
    expect(noteName(r.subdominant.tonic)).toBe('A♭');
  });
});

describe('secondaryDominants', () => {
  it('C メジャー: A7 B7 C7 D7 E7', () => {
    const sd = secondaryDominants(key('C', 'major'), 'natural');
    expect(sd.map((x) => x.label).join(' ')).toBe('V7/II V7/III V7/IV V7/V V7/VI');
    expect(sd.map((x) => chordName(x.chord)).join(' ')).toBe('A7 B7 C7 D7 E7');
  });
  it('A ナチュラルマイナー: dim 上（II度）は除かれる', () => {
    const sd = secondaryDominants(key('A', 'minor'), 'natural');
    expect(sd.map((x) => x.label).join(' ')).toBe('V7/♭III V7/IV V7/V V7/♭VI');
    expect(sd.map((x) => chordName(x.chord)).join(' ')).toBe('G7 A7 B7 C7');
  });
});

describe('tritoneSubstitute（裏コード）', () => {
  it('G7 の裏は D♭7', () => {
    const sub = tritoneSubstitute({ root: parseNote('G')!, quality: '7' });
    expect(chordName(sub)).toBe('D♭7');
  });
  it('F♯ メジャーの V7（C♯7）の裏は G7', () => {
    const sub = tritoneSubstitute({ root: parseNote('C#')!, quality: '7' });
    expect(chordName(sub)).toBe('G7');
  });
});

describe('borrowedChords（借用和音）', () => {
  it('C メジャー: Fm, B♭, A♭, E♭, Dm7♭5', () => {
    const b = borrowedChords(key('C', 'major'));
    expect(b.map((x) => x.label).join(' ')).toBe('IVm ♭VII ♭VI ♭III IIm7♭5');
    expect(b.map((x) => chordName(x.chord)).join(' ')).toBe('Fm B♭ A♭ E♭ Dm7♭5');
  });
  it('A マイナー: A（ピカルディ）と D', () => {
    const b = borrowedChords(key('A', 'minor'));
    expect(b.map((x) => chordName(x.chord)).join(' ')).toBe('A D');
  });
});

describe('avoidNotes（コードトーンの半音上のスケール音）', () => {
  it('C メジャーの各ダイアトニックコード', () => {
    const k = key('C', 'major');
    const scale = scaleNotes(k.tonic, 'major');
    const rows = diatonicChords(k, { seventh: true, minorVariant: 'natural' });
    const result = rows.map((r) =>
      avoidNotes(r.chord, scale)
        .map((n) => noteName(n))
        .join(','),
    );
    // Imaj7:F, IIm7:なし, IIIm7:F,C, IVmaj7:なし, V7:C, VIm7:F, VIIm7♭5:C
    expect(result).toEqual(['F', '', 'C,F', '', 'C', 'F', 'C']);
  });
});

describe('tritonePair', () => {
  it('G7 は B と F のトライトーンを含む', () => {
    const pair = tritonePair({ root: parseNote('G')!, quality: '7' });
    expect(pair && pair.map((n) => noteName(n)).join('–')).toBe('B–F');
  });
  it('Dm7 にトライトーンはない', () => {
    expect(tritonePair({ root: parseNote('D')!, quality: 'm7' })).toBeNull();
  });
  it('Bm7♭5 は B と F を含む', () => {
    const pair = tritonePair({ root: parseNote('B')!, quality: 'm7b5' });
    expect(pair && pair.map((n) => noteName(n)).join('–')).toBe('B–F');
  });
});
