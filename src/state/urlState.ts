import type { Key } from '../core/key';
import { DEFAULT_KEY, keyTonicParam, parseKeyParam } from '../core/key';
import type { MinorVariant } from '../core/diatonic';
import type { Notation } from '../core/pitch';
import type { ScaleType } from '../core/scale';
import { SCALES } from '../core/scale';
import type { CagedShape } from '../core/instrument/positions';
import { CAGED_SHAPES } from '../core/instrument/positions';

/**
 * アプリ状態と URL クエリの相互変換。
 * 例: ?key=Eb&mode=major&view=diatonic&chords=7th&scale=blues&labels=degree&pos=E&chord=5
 * レッスン記事から特定の画面にリンクするための公開インターフェースなので、
 * パラメータ名を変えるときは互換性に注意。
 */
export interface AppState {
  key: Key;
  chords: 'triad' | '7th';
  minorVariant: MinorVariant;
  notation: Notation;
  /** 指板・鍵盤に表示するスケール。'auto' はキーのモードに追従 */
  scale: ScaleType | 'auto';
  /** 指板・鍵盤のラベル表示（音名 / 度数） */
  labels: 'name' | 'degree';
  lefty: boolean;
  maxFret: number;
  /** CAGED ポジション絞り込み。'all' は全体表示 */
  caged: CagedShape | 'all';
  /** ダイアトニック表で選択中のコード（1-7）。null ならスケール表示 */
  selectedChord: number | null;
}

export const FRET_CHOICES = [12, 15, 18, 21] as const;

export const DEFAULT_STATE: AppState = {
  key: DEFAULT_KEY,
  chords: 'triad',
  minorVariant: 'natural',
  notation: 'english',
  scale: 'auto',
  labels: 'name',
  lefty: false,
  maxFret: 15,
  caged: 'all',
  selectedChord: null,
};

/** 'auto' を解決した、指板・鍵盤に実際に表示するスケール */
export function effectiveScaleType(state: AppState): ScaleType {
  if (state.scale !== 'auto') return state.scale;
  if (state.key.mode === 'major') return 'major';
  return state.minorVariant === 'harmonic'
    ? 'harmonicMinor'
    : state.minorVariant === 'melodic'
      ? 'melodicMinor'
      : 'naturalMinor';
}

export function stateFromSearch(search: string): AppState {
  const p = new URLSearchParams(search);
  const key = parseKeyParam(p.get('key'), p.get('mode')) ?? DEFAULT_KEY;
  const chords = p.get('chords') === '7th' ? '7th' : 'triad';
  const mv = p.get('minor');
  const minorVariant: MinorVariant = mv === 'harmonic' || mv === 'melodic' ? mv : 'natural';
  const notation: Notation = p.get('notation') === 'doremi' ? 'doremi' : 'english';
  const scaleParam = p.get('scale');
  const scale: ScaleType | 'auto' =
    scaleParam && scaleParam in SCALES ? (scaleParam as ScaleType) : 'auto';
  const labels = p.get('labels') === 'degree' ? 'degree' : 'name';
  const lefty = p.get('lefty') === '1';
  const fretParam = Number(p.get('frets'));
  const maxFret = (FRET_CHOICES as readonly number[]).includes(fretParam)
    ? fretParam
    : DEFAULT_STATE.maxFret;
  const posParam = p.get('pos');
  const caged: CagedShape | 'all' = (CAGED_SHAPES as readonly string[]).includes(posParam ?? '')
    ? (posParam as CagedShape)
    : 'all';
  const chordParam = Number(p.get('chord'));
  const selectedChord =
    Number.isInteger(chordParam) && chordParam >= 1 && chordParam <= 7 ? chordParam : null;
  return {
    key,
    chords,
    minorVariant,
    notation,
    scale,
    labels,
    lefty,
    maxFret,
    caged,
    selectedChord,
  };
}

export function searchFromState(state: AppState): string {
  const p = new URLSearchParams();
  p.set('key', keyTonicParam(state.key));
  p.set('mode', state.key.mode);
  p.set('view', 'diatonic');
  if (state.chords !== 'triad') p.set('chords', state.chords);
  if (state.minorVariant !== 'natural') p.set('minor', state.minorVariant);
  if (state.notation !== 'english') p.set('notation', state.notation);
  if (state.scale !== 'auto') p.set('scale', state.scale);
  if (state.labels !== 'name') p.set('labels', state.labels);
  if (state.lefty) p.set('lefty', '1');
  if (state.maxFret !== DEFAULT_STATE.maxFret) p.set('frets', String(state.maxFret));
  if (state.caged !== 'all') p.set('pos', state.caged);
  if (state.selectedChord !== null) p.set('chord', String(state.selectedChord));
  return '?' + p.toString();
}
