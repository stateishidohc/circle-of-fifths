import type { Chord, ChordRole } from '../chord';
import { chordTones } from '../chord';
import { midi, pc } from '../pitch';
import type { Tuning } from '../instrument/tuning';
import type { FretPosition, Voicing, VoicingGenerator, VoicingOptions } from './types';
import { computeDifficulty, detectDrop } from './scorer';

/**
 * 指板上のボイシング（押さえ方）の列挙。
 * 各弦に「ミュート / 開放 / スパン内のコードトーン」を割り当てて再帰的に探索し、
 * 必須音（R・3・7。dim/aug 系は5度も）が揃う実用的な形だけを返す。
 * difficulty（scorer.ts）の昇順でソートして返す。
 */

interface ToneInfo {
  role: ChordRole;
  essential: boolean;
}

const DEFAULTS: Required<Omit<VoicingOptions, 'rootString'>> = {
  maxStretch: 4,
  minStrings: 3,
  maxStrings: 6,
  allowOpenStrings: true,
  minFret: 0,
  maxFret: 12,
  maxResults: 120,
};

export class FretboardVoicingGenerator implements VoicingGenerator {
  generate(chord: Chord, tuning: Tuning, options: VoicingOptions = {}): Voicing[] {
    const opts = { ...DEFAULTS, ...options };
    const tones = chordTones(chord);
    const toneByPc = new Map<number, ToneInfo>();
    for (const t of tones) toneByPc.set(pc(t.note), { role: t.role, essential: t.essential });
    // 三和音は全音必須（5度を省くと2音になってしまう）。四和音は essential に従う
    const essentialPcs =
      toneByPc.size <= 3
        ? [...toneByPc.keys()]
        : tones.filter((t) => t.essential).map((t) => pc(t.note));
    const rootPc = pc(chord.root);
    const hasFifth = tones.some((t) => t.role === '5');
    const fifthEssential = tones.some((t) => t.role === '5' && t.essential);
    const fifthPc = tones.find((t) => t.role === '5');

    const n = tuning.strings.length;
    const openMidis = tuning.strings.map((s) => midi(s));
    const frets: (number | null)[] = Array(n).fill(null); // index i = (i+1)弦
    const results: Voicing[] = [];

    const minFretted = Math.max(1, opts.minFret);

    const finalize = () => {
      const sounded: { idx: number; fret: number; midi: number; pc: number }[] = [];
      for (let i = 0; i < n; i++) {
        const f = frets[i];
        if (f === null) continue;
        const m = openMidis[i] + f;
        sounded.push({ idx: i, fret: f, midi: m, pc: m % 12 });
      }
      if (sounded.length < opts.minStrings || sounded.length > opts.maxStrings) return;

      // 必須音がすべて鳴っているか
      const pcs = new Set(sounded.map((s) => s.pc));
      for (const e of essentialPcs) if (!pcs.has(e)) return;

      // 内側ミュートは1本まで
      const soundedIdx = sounded.map((s) => s.idx);
      const lo = Math.min(...soundedIdx);
      const hi = Math.max(...soundedIdx);
      let interiorMutes = 0;
      for (let i = lo + 1; i < hi; i++) if (frets[i] === null) interiorMutes++;
      if (interiorMutes > 1) return;

      // ベース（最低音）の条件
      const bass = sounded.reduce((a, b) => (b.midi < a.midi ? b : a));
      if (options.rootString !== undefined) {
        if (bass.idx + 1 !== options.rootString || bass.pc !== rootPc) return;
      }
      const inversion = bass.pc !== rootPc;

      // バレーと指数の判定
      const fretted = sounded.filter((s) => s.fret > 0);
      const fMin = fretted.length ? Math.min(...fretted.map((s) => s.fret)) : 0;
      const minUsers = fretted.filter((s) => s.fret === fMin);
      let barre: Voicing['barre'];
      if (fretted.length > 4 || minUsers.length >= 3) {
        // バレーは fMin を使う最も低音側の弦から1弦までを覆う
        const k = Math.max(...minUsers.map((s) => s.idx)) + 1; // 弦番号
        let coverable = true;
        for (let i = 0; i < k; i++) {
          const f = frets[i];
          if (f === null || f < fMin) {
            coverable = false;
            break;
          }
        }
        if (coverable) {
          barre = { fret: fMin, fromString: k, toString: 1 };
        } else if (fretted.length > 4) {
          return; // 指が足りない
        }
      }
      const fingers = barre
        ? 1 + fretted.filter((s) => s.fret > fMin || s.idx + 1 > barre!.fromString).length
        : fretted.length;
      if (fingers > 4) return;

      const span = fretted.length ? Math.max(...fretted.map((s) => s.fret)) - fMin : 0;
      const soundedMidis = sounded.map((s) => s.midi).sort((a, b) => a - b);

      // タグ
      const tags: string[] = [];
      if (sounded.some((s) => s.fret === 0)) tags.push('open');
      if (barre) tags.push('barre');
      const roles = new Set(sounded.map((s) => toneByPc.get(s.pc)!.role));
      if (sounded.length === 3 && roles.size === 3 && roles.has('R') && roles.has('3') && roles.has('7')) {
        tags.push('shell');
      }
      if (hasFifth && !fifthEssential && fifthPc && !pcs.has(pc(fifthPc.note))) tags.push('omit5');
      if (inversion) tags.push('inversion');
      const drop = detectDrop(soundedMidis);
      if (drop) tags.push(drop);

      const difficulty = computeDifficulty({
        span,
        fingers,
        barre: !!barre,
        interiorMutes,
        inversion,
        minFrettedFret: fMin,
        soundedMidis,
      });

      const positions: FretPosition[] = frets.map((f, i) => ({ string: i + 1, fret: f }));
      results.push({ chord, positions, barre, tags, difficulty });
    };

    // 低音弦（インデックス大）から高音弦へ探索
    const rec = (i: number, minF: number, maxF: number) => {
      if (i < 0) {
        finalize();
        return;
      }
      frets[i] = null;
      rec(i - 1, minF, maxF);
      for (let f = opts.allowOpenStrings ? 0 : minFretted; f <= opts.maxFret; f++) {
        if (f !== 0 && f < minFretted) continue;
        if (!toneByPc.has((openMidis[i] + f) % 12)) continue;
        let nMin = minF;
        let nMax = maxF;
        if (f > 0) {
          nMin = Math.min(nMin, f);
          nMax = Math.max(nMax, f);
          if (nMax - nMin > opts.maxStretch - 1) continue;
        }
        frets[i] = f;
        rec(i - 1, nMin, nMax);
      }
      frets[i] = null;
    };
    rec(n - 1, Infinity, -Infinity);

    results.sort((a, b) => a.difficulty - b.difficulty);
    return results.slice(0, opts.maxResults);
  }
}

/** "x32010" のような形の文字列（低音弦から）。デバッグ・テスト・表示用 */
export function voicingShape(voicing: Voicing): string {
  return [...voicing.positions]
    .sort((a, b) => b.string - a.string)
    .map((p) => (p.fret === null ? 'x' : p.fret >= 10 ? `(${p.fret})` : String(p.fret)))
    .join('');
}
