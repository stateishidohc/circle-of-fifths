import type { Voicing } from './types';

/**
 * Phase 4 で実装するボイシング採点のプレースホルダ。
 * 難易度（ストレッチ、バレー、使用指数）と響き（低音域での3度の密集など）を採点する。
 */
export function scoreVoicing(voicing: Voicing): number {
  // TODO(Phase 4): 実装
  return voicing.difficulty;
}
