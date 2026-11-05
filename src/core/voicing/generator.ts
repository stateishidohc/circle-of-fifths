import type { Chord } from '../chord';
import type { Tuning } from '../instrument/tuning';
import type { Voicing, VoicingGenerator, VoicingOptions } from './types';

/**
 * Phase 4 で実装するボイシング生成器のプレースホルダ。
 * chordTones()（役割・essential フラグ付き）と fretboard.ts の positionsOfPc() を
 * 組み合わせて候補を列挙し、scorer.ts で並べ替える設計。
 */
export class StubVoicingGenerator implements VoicingGenerator {
  generate(_chord: Chord, _tuning: Tuning, _options: VoicingOptions): Voicing[] {
    // TODO(Phase 4): 実装
    return [];
  }
}
