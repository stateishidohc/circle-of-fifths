import type { Letter, SpelledNote } from './pitch';
import { noteAscii, parseNote, spelled } from './pitch';
import { M6, m3, transpose } from './interval';

export type Mode = 'major' | 'minor';

export interface Key {
  tonic: SpelledNote;
  mode: Mode;
}

/** 五度線上の位置。C=0、♯方向に +1（G=1, D=2…）、♭方向に −1（F=-1…）。臨時記号は ±7 */
const LETTER_FIFTHS: Record<Letter, number> = {
  F: -1,
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
};

export function lineOfFifths(note: SpelledNote): number {
  return LETTER_FIFTHS[note.letter] + note.accidental * 7;
}

/**
 * 調号。正の数は♯の数、負の数は♭の数。
 * 長調は五度線の位置そのもの、短調は平行長調に合わせて −3。
 */
export function keySignature(key: Key): number {
  const lof = lineOfFifths(key.tonic);
  return key.mode === 'major' ? lof : lof - 3;
}

/** 調号の表示文字列（例: "♯3", "♭2", "♮"） */
export function keySignatureLabel(key: Key): string {
  const sig = keySignature(key);
  if (sig === 0) return '♮';
  return sig > 0 ? `♯${sig}` : `♭${-sig}`;
}

/** 平行調（relative key）: C major ⇔ A minor */
export function relativeKey(key: Key): Key {
  return key.mode === 'major'
    ? { tonic: transpose(key.tonic, M6), mode: 'minor' }
    : { tonic: transpose(key.tonic, m3), mode: 'major' };
}

/** 同主調（parallel key）: C major ⇔ C minor */
export function parallelKey(key: Key): Key {
  return { tonic: key.tonic, mode: key.mode === 'major' ? 'minor' : 'major' };
}

export interface CirclePosition {
  /** 0=C を基準に時計回り（1=G, 2=D, …, 11=F） */
  index: number;
  major: SpelledNote;
  minor: SpelledNote;
  /** 異名同音の別綴り（B/C♭, F♯/G♭, D♭/C♯ の位置のみ） */
  majorAlt?: SpelledNote;
  minorAlt?: SpelledNote;
  /** 調号（♯正 / ♭負）。主綴りに対するもの */
  signature: number;
}

function mustParse(s: string): SpelledNote {
  const n = parseNote(s);
  if (!n) throw new Error(`invalid note: ${s}`);
  return n;
}

const MAJORS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'] as const;

/** 5度圏の12ポジション。外周=長調、内周=平行短調 */
export const CIRCLE_OF_FIFTHS: readonly CirclePosition[] = MAJORS.map((name, index) => {
  const major = mustParse(name);
  const minor = transpose(major, M6);
  const pos: CirclePosition = {
    index,
    major,
    minor,
    signature: lineOfFifths(major),
  };
  if (index === 5) {
    pos.majorAlt = mustParse('Cb');
    pos.minorAlt = mustParse('Ab');
  } else if (index === 6) {
    pos.majorAlt = mustParse('Gb');
    pos.minorAlt = mustParse('Eb');
  } else if (index === 7) {
    pos.majorAlt = mustParse('C#');
    pos.minorAlt = mustParse('A#');
  }
  return pos;
});

/** キーの 5度圏上のポジション（0-11）。異名同音は同じ位置にまとめる */
export function circleIndexOf(key: Key): number {
  const lof = key.mode === 'major' ? lineOfFifths(key.tonic) : lineOfFifths(key.tonic) - 3;
  return ((lof % 12) + 12) % 12;
}

/** URL 用 ID（例: "Eb", "F#"） */
export function keyTonicParam(key: Key): string {
  return noteAscii(key.tonic);
}

export function parseKeyParam(tonicText: string | null, modeText: string | null): Key | null {
  if (!tonicText) return null;
  const tonic = parseNote(tonicText);
  if (!tonic) return null;
  const mode: Mode = modeText === 'minor' ? 'minor' : 'major';
  return { tonic, mode };
}

export const DEFAULT_KEY: Key = { tonic: spelled('C'), mode: 'major' };
