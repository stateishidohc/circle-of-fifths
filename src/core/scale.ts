import type { SpelledNote } from './pitch';
import type { Interval } from './interval';
import {
  A4,
  M2,
  M3,
  M6,
  M7,
  P1,
  P4,
  P5,
  d5,
  intervalLabel,
  m2,
  m3,
  m6,
  m7,
  transpose,
} from './interval';

/**
 * スケール定義。度数ラベル（R, ♭3 …）は intervals から機械的に導出する。
 */
export type ScaleType =
  | 'major'
  | 'naturalMinor'
  | 'harmonicMinor'
  | 'melodicMinor'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'locrian'
  | 'majorPentatonic'
  | 'minorPentatonic'
  | 'blues';

export interface ScaleDef {
  type: ScaleType;
  nameJa: string;
  intervals: readonly Interval[];
}

export const SCALES: Record<ScaleType, ScaleDef> = {
  major: {
    type: 'major',
    nameJa: 'メジャー（イオニアン）',
    intervals: [P1, M2, M3, P4, P5, M6, M7],
  },
  dorian: {
    type: 'dorian',
    nameJa: 'ドリアン',
    intervals: [P1, M2, m3, P4, P5, M6, m7],
  },
  phrygian: {
    type: 'phrygian',
    nameJa: 'フリジアン',
    intervals: [P1, m2, m3, P4, P5, m6, m7],
  },
  lydian: {
    type: 'lydian',
    nameJa: 'リディアン',
    intervals: [P1, M2, M3, A4, P5, M6, M7],
  },
  mixolydian: {
    type: 'mixolydian',
    nameJa: 'ミクソリディアン',
    intervals: [P1, M2, M3, P4, P5, M6, m7],
  },
  naturalMinor: {
    type: 'naturalMinor',
    nameJa: 'ナチュラルマイナー（エオリアン）',
    intervals: [P1, M2, m3, P4, P5, m6, m7],
  },
  locrian: {
    type: 'locrian',
    nameJa: 'ロクリアン',
    intervals: [P1, m2, m3, P4, d5, m6, m7],
  },
  harmonicMinor: {
    type: 'harmonicMinor',
    nameJa: 'ハーモニックマイナー',
    intervals: [P1, M2, m3, P4, P5, m6, M7],
  },
  melodicMinor: {
    type: 'melodicMinor',
    nameJa: 'メロディックマイナー',
    intervals: [P1, M2, m3, P4, P5, M6, M7],
  },
  majorPentatonic: {
    type: 'majorPentatonic',
    nameJa: 'メジャーペンタトニック',
    intervals: [P1, M2, M3, P5, M6],
  },
  minorPentatonic: {
    type: 'minorPentatonic',
    nameJa: 'マイナーペンタトニック',
    intervals: [P1, m3, P4, P5, m7],
  },
  blues: {
    type: 'blues',
    nameJa: 'ブルース',
    intervals: [P1, m3, P4, d5, P5, m7],
  },
};

/** UI のセレクタに出す順序 */
export const SCALE_ORDER: readonly ScaleType[] = [
  'major',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'naturalMinor',
  'locrian',
  'harmonicMinor',
  'melodicMinor',
  'majorPentatonic',
  'minorPentatonic',
  'blues',
];

/** 主音からスケール構成音を文脈に合った綴りで返す */
export function scaleNotes(tonic: SpelledNote, type: ScaleType): SpelledNote[] {
  return SCALES[type].intervals.map((iv) => transpose(tonic, iv));
}

export interface ScaleTone {
  note: SpelledNote;
  /** 度数ラベル（R, 2, ♭3 …） */
  label: string;
  isRoot: boolean;
}

/** スケール構成音＋度数ラベル。指板・鍵盤ビューのハイライトに使う */
export function scaleTones(tonic: SpelledNote, type: ScaleType): ScaleTone[] {
  return SCALES[type].intervals.map((iv) => ({
    note: transpose(tonic, iv),
    label: intervalLabel(iv),
    isRoot: iv.degree === 1,
  }));
}
