import { describe, expect, it } from 'vitest';
import {
  CIRCLE_OF_FIFTHS,
  circleIndexOf,
  keySignature,
  parseKeyParam,
  relativeKey,
} from '../../src/core/key';
import type { Key, Mode } from '../../src/core/key';
import { noteName, parseNote } from '../../src/core/pitch';

const key = (tonic: string, mode: Mode): Key => {
  const n = parseNote(tonic);
  if (!n) throw new Error(`invalid: ${tonic}`);
  return { tonic: n, mode };
};

describe('keySignature（調号）', () => {
  // [主音, 調号] 正=♯の数、負=♭の数
  const MAJOR_SIGNATURES: [string, number][] = [
    ['C', 0], ['G', 1], ['D', 2], ['A', 3], ['E', 4], ['B', 5], ['F#', 6], ['C#', 7],
    ['F', -1], ['Bb', -2], ['Eb', -3], ['Ab', -4], ['Db', -5], ['Gb', -6], ['Cb', -7],
  ];
  const MINOR_SIGNATURES: [string, number][] = [
    ['A', 0], ['E', 1], ['B', 2], ['F#', 3], ['C#', 4], ['G#', 5], ['D#', 6], ['A#', 7],
    ['D', -1], ['G', -2], ['C', -3], ['F', -4], ['Bb', -5], ['Eb', -6], ['Ab', -7],
  ];

  it.each(MAJOR_SIGNATURES)('%s メジャー = %i', (tonic, sig) => {
    expect(keySignature(key(tonic, 'major'))).toBe(sig);
  });
  it.each(MINOR_SIGNATURES)('%s マイナー = %i', (tonic, sig) => {
    expect(keySignature(key(tonic, 'minor'))).toBe(sig);
  });
});

describe('relativeKey（平行調）', () => {
  it('長調 → 平行短調', () => {
    expect(noteName(relativeKey(key('C', 'major')).tonic)).toBe('A');
    expect(noteName(relativeKey(key('Eb', 'major')).tonic)).toBe('C');
    expect(noteName(relativeKey(key('F#', 'major')).tonic)).toBe('D♯');
    expect(noteName(relativeKey(key('Gb', 'major')).tonic)).toBe('E♭');
  });
  it('短調 → 平行長調', () => {
    expect(noteName(relativeKey(key('A', 'minor')).tonic)).toBe('C');
    expect(noteName(relativeKey(key('Bb', 'minor')).tonic)).toBe('D♭');
  });
  it('往復で元に戻る', () => {
    const k = key('G#', 'minor');
    const back = relativeKey(relativeKey(k));
    expect(back).toEqual(k);
  });
});

describe('CIRCLE_OF_FIFTHS', () => {
  it('12ポジションで、外周は五度ずつ進む', () => {
    expect(CIRCLE_OF_FIFTHS).toHaveLength(12);
    expect(CIRCLE_OF_FIFTHS.map((p) => noteName(p.major)).join(' ')).toBe(
      'C G D A E B F♯ D♭ A♭ E♭ B♭ F',
    );
  });
  it('内周は平行短調', () => {
    expect(CIRCLE_OF_FIFTHS.map((p) => noteName(p.minor)).join(' ')).toBe(
      'A E B F♯ C♯ G♯ D♯ B♭ F C G D',
    );
  });
  it('異名同音の位置が正しい', () => {
    expect(circleIndexOf(key('F#', 'major'))).toBe(6);
    expect(circleIndexOf(key('Gb', 'major'))).toBe(6);
    expect(circleIndexOf(key('Eb', 'minor'))).toBe(6);
    expect(circleIndexOf(key('D#', 'minor'))).toBe(6);
    expect(circleIndexOf(key('A', 'minor'))).toBe(0);
    expect(circleIndexOf(key('F', 'major'))).toBe(11);
  });
});

describe('parseKeyParam（URL パラメータ）', () => {
  it('キーとモードを解析する', () => {
    expect(parseKeyParam('Eb', 'major')).toEqual(key('Eb', 'major'));
    expect(parseKeyParam('F#', 'minor')).toEqual(key('F#', 'minor'));
    expect(parseKeyParam('C', null)).toEqual(key('C', 'major'));
  });
  it('不正な値は null', () => {
    expect(parseKeyParam('X', 'major')).toBeNull();
    expect(parseKeyParam(null, 'major')).toBeNull();
  });
});
