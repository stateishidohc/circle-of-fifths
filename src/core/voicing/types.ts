import type { Chord } from '../chord';
import type { Tuning } from '../instrument/tuning';

/**
 * Phase 4（コードボイシング生成）用の型。Phase 1 時点では型定義と空実装のみ。
 * SPEC 5章 Phase 4 を参照。
 */

/** fret: null = ミュート、0 = 開放弦 */
export interface FretPosition {
  string: number;
  fret: number | null;
}

export interface Voicing {
  chord: Chord;
  /** 弦の数だけ（1弦から順） */
  positions: FretPosition[];
  /** 指番号 1-4, 0=開放, null=ミュート（親指は将来 'T' 拡張） */
  fingering?: (number | null)[];
  barre?: { fret: number; fromString: number; toString: number };
  /** 'open' | 'barre' | 'shell' | 'drop2' | 'drop3' | 'omit5' など */
  tags: string[];
  /** 難易度スコア（小さいほど易しい） */
  difficulty: number;
}

export interface VoicingOptions {
  /** 最大ストレッチ（フレット数）。既定 4 */
  maxStretch?: number;
  /** 使用する弦の本数の範囲 */
  minStrings?: number;
  maxStrings?: number;
  /** ルート音を置く弦（6弦/5弦/4弦ルートなど）。未指定なら制限なし */
  rootString?: number;
  /** 開放弦を使ってよいか。既定 true */
  allowOpenStrings?: boolean;
  /** 検索するフレット範囲 */
  minFret?: number;
  maxFret?: number;
  /** 返す最大件数（難易度順）。既定 120 */
  maxResults?: number;
}

export interface VoicingGenerator {
  generate(chord: Chord, tuning: Tuning, options: VoicingOptions): Voicing[];
}
