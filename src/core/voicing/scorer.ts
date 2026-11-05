import { midi } from '../pitch';
import type { Tuning } from '../instrument/tuning';
import type { Voicing } from './types';

/**
 * ボイシングの採点と音構造の分析。
 * difficulty は「押さえやすさ＋響きの濁り」をまとめた数値（小さいほど良い）。
 */

export interface DifficultyInput {
  /** フレット押弦のスパン（最大-最小。0〜） */
  span: number;
  /** 必要な指の数（バレーは1本と数える） */
  fingers: number;
  barre: boolean;
  interiorMutes: number;
  /** ベースがルートでない（転回形） */
  inversion: boolean;
  /** 押弦の最低フレット（開放のみなら 0） */
  minFrettedFret: number;
  /** 鳴る音の MIDI ノート番号（昇順） */
  soundedMidis: number[];
}

export function computeDifficulty(input: DifficultyInput): number {
  let d = 0;
  d += input.span * 1.2;
  d += input.fingers * 0.8;
  if (input.barre) d += 2.5;
  d += input.interiorMutes * 2;
  if (input.minFrettedFret > 7) d += 1;
  else if (input.minFrettedFret > 3) d += 0.5;
  if (input.inversion) d += 2.5;
  // 鳴る弦が少ない形（断片的な形）はやや下げる
  d += Math.max(0, 6 - input.soundedMidis.length) * 0.6;
  // 低音域で音程が密集すると濁る（C3 未満の3度、F3 未満の2度）
  for (let i = 1; i < input.soundedMidis.length; i++) {
    const lo = input.soundedMidis[i - 1];
    const diff = input.soundedMidis[i] - lo;
    if (lo < 48 && diff <= 4) d += 1;
    else if (lo < 53 && diff <= 2) d += 1;
  }
  return Math.round(d * 10) / 10;
}

export function scoreVoicing(voicing: Voicing): number {
  return voicing.difficulty;
}

/** ボイシングで実際に鳴る音の MIDI ノート番号（昇順） */
export function voicingSoundedMidis(voicing: Voicing, tuning: Tuning): number[] {
  const result: number[] = [];
  for (const p of voicing.positions) {
    if (p.fret === null) continue;
    result.push(midi(tuning.strings[p.string - 1]) + p.fret);
  }
  return result.sort((a, b) => a - b);
}

/**
 * ボイスリーディング距離。声部を低い順に対応付けて移動半音数を合計する
 * （声部数が違う場合は差1つにつきペナルティ4）。小さいほど移行がスムーズ。
 */
export function voicingDistance(a: Voicing, b: Voicing, tuning: Tuning): number {
  const am = voicingSoundedMidis(a, tuning);
  const bm = voicingSoundedMidis(b, tuning);
  const n = Math.min(am.length, bm.length);
  let d = 0;
  for (let i = 0; i < n; i++) d += Math.abs(am[i] - bm[i]);
  return d + Math.abs(am.length - bm.length) * 4;
}

/**
 * 4声ボイシングのドロップ判定。最低声部を1オクターブ上げてクローズ
 * （1オクターブ以内）に収まるとき、その声部の位置で drop2 / drop3 を判定する。
 */
export function detectDrop(soundedMidis: number[]): 'drop2' | 'drop3' | null {
  if (soundedMidis.length !== 4) return null;
  const m = [...soundedMidis].sort((a, b) => a - b);
  if (m[3] - m[0] < 12) return null; // クローズ
  const lifted = m[0] + 12;
  const rest = [m[1], m[2], m[3], lifted].sort((a, b) => a - b);
  if (rest[3] - rest[0] >= 12) return null;
  const idx = rest.indexOf(lifted);
  if (idx === 2) return 'drop2';
  if (idx === 1) return 'drop3';
  return null;
}
