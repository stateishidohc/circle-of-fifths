import type { SpelledNote } from './pitch';
import { noteName, parseNote, type Notation } from './pitch';
import type { Interval } from './interval';
import { A5, M3, M7, M9, P1, P4, P5, d5, d7, intervalLabel, m3, m7, transpose } from './interval';

/** コード品質。Phase 4 のボイシング生成でも使うため拡張可能にしておく */
export type ChordQuality =
  | 'maj'
  | 'min'
  | 'dim'
  | 'aug'
  | '7'
  | 'maj7'
  | 'm7'
  | 'mM7'
  | 'm7b5'
  | 'dim7'
  | 'augMaj7'
  | 'sus4'
  | 'add9';

export type Tension = '9' | 'b9' | '#9' | '11' | '#11' | '13' | 'b13';

export interface Chord {
  root: SpelledNote;
  quality: ChordQuality;
  tensions?: Tension[];
  bass?: SpelledNote;
}

export type ChordRole = 'R' | '3' | '5' | '7' | '9' | '11' | '13';

/** 構成音＋役割。essential=false の音はボイシングで省略候補になる */
export interface ChordTone {
  note: SpelledNote;
  role: ChordRole;
  essential: boolean;
  /** 度数表示ラベル（R, ♭3, ♭5, ♭7 …） */
  label: string;
}

interface ToneRecipe {
  interval: Interval;
  role: ChordRole;
  essential: boolean;
}

const t = (interval: Interval, role: ChordRole, essential: boolean): ToneRecipe => ({
  interval,
  role,
  essential,
});

const QUALITY_RECIPES: Record<ChordQuality, ToneRecipe[]> = {
  maj: [t(P1, 'R', true), t(M3, '3', true), t(P5, '5', false)],
  min: [t(P1, 'R', true), t(m3, '3', true), t(P5, '5', false)],
  dim: [t(P1, 'R', true), t(m3, '3', true), t(d5, '5', true)],
  aug: [t(P1, 'R', true), t(M3, '3', true), t(A5, '5', true)],
  '7': [t(P1, 'R', true), t(M3, '3', true), t(P5, '5', false), t(m7, '7', true)],
  maj7: [t(P1, 'R', true), t(M3, '3', true), t(P5, '5', false), t(M7, '7', true)],
  m7: [t(P1, 'R', true), t(m3, '3', true), t(P5, '5', false), t(m7, '7', true)],
  mM7: [t(P1, 'R', true), t(m3, '3', true), t(P5, '5', false), t(M7, '7', true)],
  m7b5: [t(P1, 'R', true), t(m3, '3', true), t(d5, '5', true), t(m7, '7', true)],
  dim7: [t(P1, 'R', true), t(m3, '3', true), t(d5, '5', true), t(d7, '7', true)],
  augMaj7: [t(P1, 'R', true), t(M3, '3', true), t(A5, '5', true), t(M7, '7', true)],
  // sus4 は3度の代わりに4度。役割は '11' として持つ（3度は含まない）
  sus4: [t(P1, 'R', true), t(P4, '11', true), t(P5, '5', false)],
  add9: [t(P1, 'R', true), t(M3, '3', true), t(P5, '5', false), t(M9, '9', true)],
};

/** コードの構成音を役割付きで返す */
export function chordTones(chord: Chord): ChordTone[] {
  return QUALITY_RECIPES[chord.quality].map((r) => ({
    note: transpose(chord.root, r.interval),
    role: r.role,
    essential: r.essential,
    label: intervalLabel(r.interval),
  }));
}

/** コードネームのサフィックス。表記の流儀は CLAUDE.md「表記の規約」を参照 */
export const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: '',
  min: 'm',
  dim: 'dim',
  aug: 'aug',
  '7': '7',
  maj7: 'maj7',
  m7: 'm7',
  mM7: 'mM7',
  m7b5: 'm7♭5',
  dim7: 'dim7',
  augMaj7: 'maj7(♯5)',
  sus4: 'sus4',
  add9: 'add9',
};

export function chordName(chord: Chord, notation: Notation = 'english'): string {
  let name = noteName(chord.root, notation) + QUALITY_SUFFIX[chord.quality];
  if (chord.bass) name += '/' + noteName(chord.bass, notation);
  return name;
}

/** ASCII 混じりのコードネームを解析（例: "F#m7", "Bbmaj7", "Cm7b5"） */
export function parseChordName(text: string): Chord | null {
  const m = /^([A-Ga-g](?:𝄪|##|x|♯|#|𝄫|bb|♭|b)?)(.*)$/.exec(text.trim());
  if (!m) return null;
  const root = parseNote(m[1]);
  if (!root) return null;
  const suffixText = m[2]
    .replace(/♭/g, 'b')
    .replace(/♯/g, '#')
    .replace(/[()]/g, '');
  const SUFFIX_TO_QUALITY: Record<string, ChordQuality> = {
    '': 'maj',
    maj: 'maj',
    M: 'maj',
    m: 'min',
    min: 'min',
    '-': 'min',
    dim: 'dim',
    '°': 'dim',
    aug: 'aug',
    '+': 'aug',
    '7': '7',
    maj7: 'maj7',
    M7: 'maj7',
    m7: 'm7',
    min7: 'm7',
    mM7: 'mM7',
    mmaj7: 'mM7',
    m7b5: 'm7b5',
    'ø7': 'm7b5',
    ø: 'm7b5',
    dim7: 'dim7',
    '°7': 'dim7',
    'maj7#5': 'augMaj7',
    'augmaj7': 'augMaj7',
    sus4: 'sus4',
    add9: 'add9',
  };
  const quality = SUFFIX_TO_QUALITY[suffixText];
  if (quality === undefined) return null;
  return { root, quality };
}
