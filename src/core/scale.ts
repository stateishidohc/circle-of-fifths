import type { SpelledNote } from './pitch';
import type { Interval } from './interval';
import { M2, M3, M6, M7, P1, P4, P5, m3, m6, m7, transpose } from './interval';

/**
 * スケール定義。Phase 2 でモード・ペンタ・ブルースを追加する。
 */
export type ScaleType = 'major' | 'naturalMinor' | 'harmonicMinor' | 'melodicMinor';

export interface ScaleDef {
  type: ScaleType;
  nameJa: string;
  intervals: readonly Interval[];
}

export const SCALES: Record<ScaleType, ScaleDef> = {
  major: {
    type: 'major',
    nameJa: 'メジャー',
    intervals: [P1, M2, M3, P4, P5, M6, M7],
  },
  naturalMinor: {
    type: 'naturalMinor',
    nameJa: 'ナチュラルマイナー',
    intervals: [P1, M2, m3, P4, P5, m6, m7],
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
};

/** 主音からスケール構成音（7音）を文脈に合った綴りで返す */
export function scaleNotes(tonic: SpelledNote, type: ScaleType): SpelledNote[] {
  return SCALES[type].intervals.map((iv) => transpose(tonic, iv));
}
