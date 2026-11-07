import type { Chord, ChordQuality } from '../chord';
import { chordTones } from '../chord';
import { midi, pc } from '../pitch';
import type { Tuning } from '../instrument/tuning';
import type { FretPosition, Voicing } from './types';
import { computeDifficulty } from './scorer';

/**
 * 隣接3本弦セット上のクローズ・トライアド（転回形付き）。
 * 教材でよくある「弦セットごとに基本形→第1転回→第2転回とネックを上がる」
 * 練習のための形を列挙する。7th コードには R-3-5 のトライアドを当てる
 * （Δ7/7 → メジャー、m7 → マイナー、m7♭5 → ディミニッシュ）。
 */

export interface TriadVoicing extends Voicing {
  /** 0=基本形（ルートが最低音）, 1=第1転回形, 2=第2転回形 */
  inversion: number;
  /** 弦セット（低音弦から。例: [3,2,1] = 1〜3弦） */
  stringSet: number[];
}

/** 7th コード → 土台のトライアド品質 */
const TRIAD_OF: Partial<Record<ChordQuality, ChordQuality>> = {
  maj: 'maj',
  maj7: 'maj',
  '7': 'maj',
  add9: 'maj',
  min: 'min',
  m7: 'min',
  mM7: 'min',
  dim: 'dim',
  m7b5: 'dim',
  dim7: 'dim',
  aug: 'aug',
  augMaj7: 'aug',
  sus4: 'sus4',
};

const INVERSION_TAGS = ['root-position', '1st-inversion', '2nd-inversion'] as const;

export function triadOf(chord: Chord): Chord {
  return { root: chord.root, quality: TRIAD_OF[chord.quality] ?? 'maj' };
}

export interface TriadOptions {
  maxFret?: number;
  /** 最低音弦の弦番号で弦セットを絞る（3=1〜3弦, 4=2〜4弦, 5=3〜5弦, 6=4〜6弦） */
  bassString?: number;
}

export function triadVoicings(
  chord: Chord,
  tuning: Tuning,
  options: TriadOptions = {},
): TriadVoicing[] {
  const { maxFret = 15, bassString } = options;
  const triad = triadOf(chord);
  const tones = chordTones(triad);
  if (tones.length !== 3) return [];
  const pcs = tones.map((t) => pc(t.note));
  const n = tuning.strings.length;
  const out: TriadVoicing[] = [];

  // 最低音弦 idx は 2..n-1（その上の2本とセット）
  for (let low = 2; low < n; low++) {
    const stringNumbers = [low + 1, low, low - 1]; // 低音弦→高音弦
    if (bassString !== undefined && low + 1 !== bassString) continue;
    const opens = [low, low - 1, low - 2].map((i) => midi(tuning.strings[i]));

    for (let inv = 0; inv < 3; inv++) {
      const order = [pcs[inv], pcs[(inv + 1) % 3], pcs[(inv + 2) % 3]];
      for (let fb = 0; fb <= maxFret; fb++) {
        if ((((opens[0] + fb) % 12) + 12) % 12 !== order[0]) continue;
        // クローズ・ボイシング: 各声部は直前の声部のすぐ上の音
        const midis = [opens[0] + fb];
        const frets = [fb];
        let ok = true;
        for (let v = 1; v < 3; v++) {
          let m = opens[v] + ((((order[v] - opens[v]) % 12) + 12) % 12);
          while (m <= midis[v - 1]) m += 12;
          const fret = m - opens[v];
          if (fret > maxFret) {
            ok = false;
            break;
          }
          midis.push(m);
          frets.push(fret);
        }
        if (!ok) continue;
        // クローズ（1オクターブ以内）でない形は除外（弦の音域の都合で声部が飛ぶことがある）
        if (midis[2] - midis[0] >= 12) continue;
        const frettedOnly = frets.filter((f) => f > 0);
        const fMin = frettedOnly.length ? Math.min(...frettedOnly) : 0;
        const span = frettedOnly.length ? Math.max(...frettedOnly) - fMin : 0;
        if (span > 3) continue;

        const positions: FretPosition[] = Array.from({ length: n }, (_, i) => ({
          string: i + 1,
          fret: null,
        }));
        stringNumbers.forEach((s, v) => {
          positions[s - 1] = { string: s, fret: frets[v] };
        });

        const difficulty = computeDifficulty({
          span,
          fingers: frettedOnly.length,
          barre: false,
          interiorMutes: 0,
          inversion: inv !== 0,
          minFrettedFret: fMin,
          soundedMidis: midis,
        });

        out.push({
          chord: triad,
          positions,
          tags: ['triad', INVERSION_TAGS[inv]],
          difficulty,
          inversion: inv,
          stringSet: stringNumbers,
        });
      }
    }
  }

  // 弦セット（高音側が先）→ フレット位置の順
  return out.sort((a, b) => {
    if (a.stringSet[0] !== b.stringSet[0]) return a.stringSet[0] - b.stringSet[0];
    const fa = Math.min(...a.positions.filter((p) => p.fret !== null).map((p) => p.fret!));
    const fb = Math.min(...b.positions.filter((p) => p.fret !== null).map((p) => p.fret!));
    return fa - fb;
  });
}
