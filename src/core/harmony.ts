import type { SpelledNote } from './pitch';
import { pc } from './pitch';
import { A4, P4, P5, d5, transpose } from './interval';
import type { Key } from './key';
import { parallelKey, relativeKey } from './key';
import type { Chord } from './chord';
import { chordTones } from './chord';
import type { MinorVariant } from './diatonic';
import { diatonicChords } from './diatonic';

/**
 * 応用理論（Phase 3）。近親調・セカンダリードミナント・裏コード・借用和音・
 * アボイドノート・トライトーン。
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

/**
 * ドミナント7th の裏コード（subV7。ルートが三全音先）。
 * 綴りは減5度/増4度のうち臨時記号が簡単な方を選ぶ（例: B♭7 の裏は F♭7 でなく E7。
 * 同数なら ♭II 表記の慣例に合わせてフラット側）。
 */
export function tritoneSubstitute(dominant: Chord): Chord {
  const flat = transpose(dominant.root, d5);
  const sharp = transpose(dominant.root, A4);
  const root = Math.abs(sharp.accidental) < Math.abs(flat.accidental) ? sharp : flat;
  return { root, quality: '7' };
}

export interface LabeledChord {
  /** 表示ラベル（V7/II, ♭VII, IVm など） */
  label: string;
  chord: Chord;
  /** 補足（解決先など） */
  note?: string;
}

/** ディグリー表記からコード品質サフィックスを除いた数字部分（IIm → II） */
function numeralOf(roman: string): string {
  return roman.replace(/(dim|aug|m)$/u, '');
}

/**
 * セカンダリードミナント一覧。II〜VI 度（dim/aug 上は除く）をターゲットに
 * V7/x を返す。
 */
export function secondaryDominants(key: Key, minorVariant: MinorVariant): LabeledChord[] {
  const rows = diatonicChords(key, { seventh: false, minorVariant });
  return rows
    .filter((r) => r.degree >= 2 && r.degree <= 6)
    .filter((r) => r.quality === 'maj' || r.quality === 'min')
    .map((r) => ({
      label: `V7/${numeralOf(r.roman)}`,
      chord: secondaryDominantOf(r.chord.root),
      note: `→ ${numeralOf(r.roman)}`,
    }));
}

/** よく使われる借用和音（同主調からの借用） */
export function borrowedChords(key: Key): LabeledChord[] {
  const t = key.tonic;
  if (key.mode === 'major') {
    // 同主短調からの借用（サブドミナントマイナー系）
    return [
      { label: 'IVm', chord: { root: transpose(t, P4), quality: 'min' } },
      { label: '♭VII', chord: { root: transpose(t, { degree: 7, semitones: 10 }), quality: 'maj' } },
      { label: '♭VI', chord: { root: transpose(t, { degree: 6, semitones: 8 }), quality: 'maj' } },
      { label: '♭III', chord: { root: transpose(t, { degree: 3, semitones: 3 }), quality: 'maj' } },
      { label: 'IIm7♭5', chord: { root: transpose(t, { degree: 2, semitones: 2 }), quality: 'm7b5' } },
    ];
  }
  // 同主長調からの借用
  return [
    { label: 'I', chord: { root: t, quality: 'maj' }, note: 'ピカルディ' },
    { label: 'IV', chord: { root: transpose(t, P4), quality: 'maj' }, note: 'ドリアンのIV' },
  ];
}

/**
 * アボイドノート。「コードトーンの半音上にあるスケール音」という古典的な
 * 定義で機械的に求める（CLAUDE.md「表記の規約」参照）。
 * 例: C メジャーの Imaj7 → F、V7(G7) → C。IIm7 と IVmaj7 はなし。
 */
export function avoidNotes(chord: Chord, scale: SpelledNote[]): SpelledNote[] {
  const tonePcs = new Set<number>(chordTones(chord).map((t) => pc(t.note)));
  return scale.filter((n) => !tonePcs.has(pc(n)) && tonePcs.has((pc(n) + 11) % 12));
}

/** コードに含まれるトライトーン（半音6つ離れた2音）。なければ null */
export function tritonePair(chord: Chord): [SpelledNote, SpelledNote] | null {
  const tones = chordTones(chord).map((t) => t.note);
  for (let i = 0; i < tones.length; i++) {
    for (let j = i + 1; j < tones.length; j++) {
      if ((pc(tones[j]) - pc(tones[i]) + 12) % 12 === 6) return [tones[i], tones[j]];
    }
  }
  return null;
}
