import type { SpelledNote } from './pitch';
import { semitonesBetween } from './interval';
import type { Key } from './key';
import { lineOfFifths } from './key';
import type { ScaleType } from './scale';
import { scaleNotes } from './scale';
import type { Chord, ChordQuality } from './chord';
import { QUALITY_SUFFIX } from './chord';

/** 機能和声。T=トニック, SD=サブドミナント, D=ドミナント */
export type HarmonicFunction = 'T' | 'SD' | 'D';

export type MinorVariant = 'natural' | 'harmonic' | 'melodic';

export interface DiatonicChord {
  /** 1-7 */
  degree: number;
  /** ディグリーネーム（例: "IIm7", "♭IIImaj7"） */
  roman: string;
  chord: Chord;
  quality: ChordQuality;
  notes: SpelledNote[];
  func: HarmonicFunction;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

// 機能の割り当て（流派差あり。CLAUDE.md「表記の規約」参照）
const FUNCTIONS_MAJOR: HarmonicFunction[] = ['T', 'SD', 'T', 'SD', 'D', 'T', 'D'];
const FUNCTIONS_MINOR: HarmonicFunction[] = ['T', 'SD', 'T', 'SD', 'D', 'SD', 'D'];

function triadQuality(third: number, fifth: number): ChordQuality {
  if (third === 4 && fifth === 7) return 'maj';
  if (third === 3 && fifth === 7) return 'min';
  if (third === 3 && fifth === 6) return 'dim';
  if (third === 4 && fifth === 8) return 'aug';
  throw new Error(`unknown triad: 3rd=${third}, 5th=${fifth}`);
}

function seventhQuality(third: number, fifth: number, seventh: number): ChordQuality {
  if (third === 4 && fifth === 7 && seventh === 11) return 'maj7';
  if (third === 4 && fifth === 7 && seventh === 10) return '7';
  if (third === 3 && fifth === 7 && seventh === 10) return 'm7';
  if (third === 3 && fifth === 7 && seventh === 11) return 'mM7';
  if (third === 3 && fifth === 6 && seventh === 10) return 'm7b5';
  if (third === 3 && fifth === 6 && seventh === 9) return 'dim7';
  if (third === 4 && fifth === 8 && seventh === 11) return 'augMaj7';
  throw new Error(`unknown seventh chord: 3rd=${third}, 5th=${fifth}, 7th=${seventh}`);
}

/**
 * ディグリーの臨時記号プレフィックス。
 * 同主長調のメジャースケールを基準にした相対表記（♭III, ♭VI, ♭VII …）。
 */
function degreePrefix(scaleNote: SpelledNote, majorScaleNote: SpelledNote): string {
  const diff = (lineOfFifths(scaleNote) - lineOfFifths(majorScaleNote)) / 7;
  if (!Number.isInteger(diff)) {
    throw new Error('degreePrefix: letter がメジャースケールと一致していません');
  }
  if (diff === 0) return '';
  return diff > 0 ? '♯'.repeat(diff) : '♭'.repeat(-diff);
}

export interface DiatonicOptions {
  /** true なら四和音（セブンス）、false なら三和音 */
  seventh: boolean;
  /** 短調のバリアント（長調では無視） */
  minorVariant: MinorVariant;
}

const MINOR_SCALE: Record<MinorVariant, ScaleType> = {
  natural: 'naturalMinor',
  harmonic: 'harmonicMinor',
  melodic: 'melodicMinor',
};

/** キーのダイアトニックコード（7つ）を返す */
export function diatonicChords(key: Key, options: DiatonicOptions): DiatonicChord[] {
  const scaleType: ScaleType = key.mode === 'major' ? 'major' : MINOR_SCALE[options.minorVariant];
  const scale = scaleNotes(key.tonic, scaleType);
  const majorScale = scaleNotes(key.tonic, 'major');
  const functions = key.mode === 'major' ? FUNCTIONS_MAJOR : FUNCTIONS_MINOR;

  return scale.map((root, i) => {
    const notes = [root, scale[(i + 2) % 7], scale[(i + 4) % 7]];
    if (options.seventh) notes.push(scale[(i + 6) % 7]);

    const third = semitonesBetween(root, notes[1]);
    const fifth = semitonesBetween(root, notes[2]);
    const quality = options.seventh
      ? seventhQuality(third, fifth, semitonesBetween(root, notes[3]))
      : triadQuality(third, fifth);

    const roman = degreePrefix(root, majorScale[i]) + ROMAN[i] + QUALITY_SUFFIX[quality];

    return {
      degree: i + 1,
      roman,
      chord: { root, quality },
      quality,
      notes,
      func: functions[i],
    };
  });
}
