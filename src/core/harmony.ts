import type { SpelledNote } from './pitch';
import { P4, P5, transpose } from './interval';
import type { Key } from './key';
import { parallelKey, relativeKey } from './key';
import type { Chord } from './chord';

/**
 * 応用理論（Phase 3 で UI に出す）。
 * TODO(Phase 3): 裏コード、借用和音（♭VII, IVm など）、アボイドノート、トライトーン。
 */

export interface RelatedKeys {
  relative: Key;
  parallel: Key;
  dominant: Key;
  subdominant: Key;
}

/** 近親調（平行調・同主調・属調・下属調） */
export function relatedKeys(key: Key): RelatedKeys {
  return {
    relative: relativeKey(key),
    parallel: parallelKey(key),
    dominant: { tonic: transpose(key.tonic, P5), mode: key.mode },
    subdominant: { tonic: transpose(key.tonic, P4), mode: key.mode },
  };
}

/** target をトニックとみなしたときの V7（セカンダリードミナント） */
export function secondaryDominantOf(target: SpelledNote): Chord {
  return { root: transpose(target, P5), quality: '7' };
}
