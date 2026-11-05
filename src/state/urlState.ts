import type { Key } from '../core/key';
import { DEFAULT_KEY, keyTonicParam, parseKeyParam } from '../core/key';
import type { MinorVariant } from '../core/diatonic';
import type { Notation } from '../core/pitch';

/**
 * アプリ状態と URL クエリの相互変換。
 * 例: ?key=Eb&mode=major&view=diatonic&chords=7th&minor=harmonic
 * レッスン記事から特定の画面にリンクするための公開インターフェースなので、
 * パラメータ名を変えるときは互換性に注意。
 */
export interface AppState {
  key: Key;
  chords: 'triad' | '7th';
  minorVariant: MinorVariant;
  notation: Notation;
}

export const DEFAULT_STATE: AppState = {
  key: DEFAULT_KEY,
  chords: 'triad',
  minorVariant: 'natural',
  notation: 'english',
};

export function stateFromSearch(search: string): AppState {
  const p = new URLSearchParams(search);
  const key = parseKeyParam(p.get('key'), p.get('mode')) ?? DEFAULT_KEY;
  const chords = p.get('chords') === '7th' ? '7th' : 'triad';
  const mv = p.get('minor');
  const minorVariant: MinorVariant = mv === 'harmonic' || mv === 'melodic' ? mv : 'natural';
  const notation: Notation = p.get('notation') === 'doremi' ? 'doremi' : 'english';
  return { key, chords, minorVariant, notation };
}

export function searchFromState(state: AppState): string {
  const p = new URLSearchParams();
  p.set('key', keyTonicParam(state.key));
  p.set('mode', state.key.mode);
  p.set('view', 'diatonic');
  if (state.chords !== 'triad') p.set('chords', state.chords);
  if (state.minorVariant !== 'natural') p.set('minor', state.minorVariant);
  if (state.notation !== 'english') p.set('notation', state.notation);
  return '?' + p.toString();
}
