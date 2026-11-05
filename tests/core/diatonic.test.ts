import { describe, expect, it } from 'vitest';
import { diatonicChords } from '../../src/core/diatonic';
import type { MinorVariant } from '../../src/core/diatonic';
import { chordName } from '../../src/core/chord';
import type { Key, Mode } from '../../src/core/key';
import { noteName, parseNote } from '../../src/core/pitch';

const key = (tonic: string, mode: Mode): Key => {
  const n = parseNote(tonic);
  if (!n) throw new Error(`invalid: ${tonic}`);
  return { tonic: n, mode };
};

const ALL_MAJOR_TONICS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const ALL_MINOR_TONICS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Eb', 'Bb', 'F', 'C', 'G', 'D'];

describe('C メジャーのダイアトニック', () => {
  it('三和音', () => {
    const d = diatonicChords(key('C', 'major'), { seventh: false, minorVariant: 'natural' });
    expect(d.map((x) => chordName(x.chord)).join(' ')).toBe('C Dm Em F G Am Bdim');
    expect(d.map((x) => x.roman).join(' ')).toBe('I IIm IIIm IV V VIm VIIdim');
    expect(d.map((x) => x.func).join(' ')).toBe('T SD T SD D T D');
  });
  it('四和音', () => {
    const d = diatonicChords(key('C', 'major'), { seventh: true, minorVariant: 'natural' });
    expect(d.map((x) => chordName(x.chord)).join(' ')).toBe(
      'Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7♭5',
    );
    expect(d.map((x) => x.roman).join(' ')).toBe('Imaj7 IIm7 IIIm7 IVmaj7 V7 VIm7 VIIm7♭5');
  });
  it('構成音も正しい（V7 = G B D F）', () => {
    const d = diatonicChords(key('C', 'major'), { seventh: true, minorVariant: 'natural' });
    expect(d[4].notes.map((n) => noteName(n)).join(' ')).toBe('G B D F');
  });
});

describe('異名同音の綴り', () => {
  it('F♯ メジャーの VIIm7♭5 は E♯m7♭5', () => {
    const d = diatonicChords(key('F#', 'major'), { seventh: true, minorVariant: 'natural' });
    expect(chordName(d[6].chord)).toBe('E♯m7♭5');
    expect(d.map((x) => chordName(x.chord)).join(' ')).toBe(
      'F♯maj7 G♯m7 A♯m7 Bmaj7 C♯7 D♯m7 E♯m7♭5',
    );
  });
  it('G♭ メジャーの IV は C♭', () => {
    const d = diatonicChords(key('Gb', 'major'), { seventh: false, minorVariant: 'natural' });
    expect(d.map((x) => chordName(x.chord)).join(' ')).toBe('G♭ A♭m B♭m C♭ D♭ E♭m Fdim');
  });
});

describe('A マイナーのダイアトニック', () => {
  it('ナチュラル（四和音）', () => {
    const d = diatonicChords(key('A', 'minor'), { seventh: true, minorVariant: 'natural' });
    expect(d.map((x) => chordName(x.chord)).join(' ')).toBe(
      'Am7 Bm7♭5 Cmaj7 Dm7 Em7 Fmaj7 G7',
    );
    expect(d.map((x) => x.roman).join(' ')).toBe(
      'Im7 IIm7♭5 ♭IIImaj7 IVm7 Vm7 ♭VImaj7 ♭VII7',
    );
    expect(d.map((x) => x.func).join(' ')).toBe('T SD T SD D SD D');
  });
  it('ハーモニック（四和音）', () => {
    const d = diatonicChords(key('A', 'minor'), { seventh: true, minorVariant: 'harmonic' });
    expect(d.map((x) => chordName(x.chord)).join(' ')).toBe(
      'AmM7 Bm7♭5 Cmaj7(♯5) Dm7 E7 Fmaj7 G♯dim7',
    );
    expect(d[4].roman).toBe('V7');
    expect(d[6].roman).toBe('VIIdim7');
  });
  it('メロディック（三和音）', () => {
    const d = diatonicChords(key('A', 'minor'), { seventh: false, minorVariant: 'melodic' });
    expect(d.map((x) => chordName(x.chord)).join(' ')).toBe('Am Bm Caug D E F♯dim G♯dim');
  });
});

describe('全24キーの品質列', () => {
  const MAJOR_TRIADS = 'maj min min maj maj min dim';
  const MAJOR_SEVENTHS = 'maj7 m7 m7 maj7 7 m7 m7b5';
  it.each(ALL_MAJOR_TONICS)('%s メジャー', (tonic) => {
    const t = diatonicChords(key(tonic, 'major'), { seventh: false, minorVariant: 'natural' });
    expect(t.map((x) => x.quality).join(' ')).toBe(MAJOR_TRIADS);
    const s = diatonicChords(key(tonic, 'major'), { seventh: true, minorVariant: 'natural' });
    expect(s.map((x) => x.quality).join(' ')).toBe(MAJOR_SEVENTHS);
  });

  const MINOR_EXPECTED: Record<MinorVariant, { triads: string; sevenths: string }> = {
    natural: {
      triads: 'min dim maj min min maj maj',
      sevenths: 'm7 m7b5 maj7 m7 m7 maj7 7',
    },
    harmonic: {
      triads: 'min dim aug min maj maj dim',
      sevenths: 'mM7 m7b5 augMaj7 m7 7 maj7 dim7',
    },
    melodic: {
      triads: 'min min aug maj maj dim dim',
      sevenths: 'mM7 m7 augMaj7 7 7 m7b5 m7b5',
    },
  };
  const variants: MinorVariant[] = ['natural', 'harmonic', 'melodic'];
  it.each(ALL_MINOR_TONICS)('%s マイナー（全バリアント）', (tonic) => {
    for (const v of variants) {
      const t = diatonicChords(key(tonic, 'minor'), { seventh: false, minorVariant: v });
      expect(t.map((x) => x.quality).join(' ')).toBe(MINOR_EXPECTED[v].triads);
      const s = diatonicChords(key(tonic, 'minor'), { seventh: true, minorVariant: v });
      expect(s.map((x) => x.quality).join(' ')).toBe(MINOR_EXPECTED[v].sevenths);
    }
  });
});
