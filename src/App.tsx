import { useEffect, useState } from 'react';
import type { Key } from './core/key';
import { pc, noteName } from './core/pitch';
import type { SpelledNote } from './core/pitch';
import { chordName, chordTones } from './core/chord';
import { SCALES, SCALE_ORDER, scaleTones } from './core/scale';
import type { ScaleType } from './core/scale';
import { STANDARD_GUITAR } from './core/instrument/tuning';
import { CAGED_SHAPES, cagedPositions } from './core/instrument/positions';
import type { CagedShape } from './core/instrument/positions';
import { diatonicChords } from './core/diatonic';
import { CircleOfFifths } from './ui/components/CircleOfFifths';
import { DiatonicTable } from './ui/components/DiatonicTable';
import { FretboardView } from './ui/components/FretboardView';
import type { ToneHighlight } from './ui/components/FretboardView';
import { KeyboardView } from './ui/components/KeyboardView';
import type { AppState } from './state/urlState';
import { FRET_CHOICES, effectiveScaleType, searchFromState, stateFromSearch } from './state/urlState';

function Segmented<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={props.label}>
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={props.value === o.value}
          className={props.value === o.value ? 'is-active' : ''}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(() => stateFromSearch(window.location.search));

  // 状態 → URL（共有・再現用）
  useEffect(() => {
    const search = searchFromState(state);
    if (search !== window.location.search) {
      history.replaceState(null, '', search + window.location.hash);
    }
  }, [state]);

  // 戻る/進むで URL → 状態
  useEffect(() => {
    const onPop = () => setState(stateFromSearch(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setKey = (key: Key) => setState((s) => ({ ...s, key }));

  // 指板・鍵盤のハイライト（コード選択中はコードトーン、それ以外はスケール）
  const scaleType = effectiveScaleType(state);
  const rows = diatonicChords(state.key, {
    seventh: state.chords === '7th',
    minorVariant: state.minorVariant,
  });
  const selectedRow = state.selectedChord !== null ? rows[state.selectedChord - 1] : null;
  const toneText = (note: SpelledNote, degreeLabel: string) =>
    state.labels === 'degree' ? degreeLabel : noteName(note, state.notation);
  const highlights: ToneHighlight[] = selectedRow
    ? chordTones(selectedRow.chord).map((t) => ({
        pc: pc(t.note),
        text: toneText(t.note, t.label),
        isRoot: t.role === 'R',
      }))
    : scaleTones(state.key.tonic, scaleType).map((t) => ({
        pc: pc(t.note),
        text: toneText(t.note, t.label),
        isRoot: t.isRoot,
      }));
  const windows =
    state.caged === 'all'
      ? null
      : cagedPositions(STANDARD_GUITAR, pc(state.key.tonic), state.maxFret).filter(
          (w) => w.shape === state.caged,
        );

  const boardTitle = selectedRow
    ? `コードトーン: ${selectedRow.roman}（${chordName(selectedRow.chord, state.notation)}）`
    : `${noteName(state.key.tonic, state.notation)} ${SCALES[scaleType].nameJa}`;

  return (
    <div className="app">
      <header className="app-header">
        <h1>5度圏</h1>
        <Segmented
          label="音名表記"
          value={state.notation}
          options={[
            { value: 'english', label: 'CDE' },
            { value: 'doremi', label: 'ドレミ' },
          ]}
          onChange={(notation) => setState((s) => ({ ...s, notation }))}
        />
      </header>

      <main>
        <CircleOfFifths selectedKey={state.key} notation={state.notation} onSelect={setKey} />

        <div className="controls">
          <Segmented
            label="コードの種類"
            value={state.chords}
            options={[
              { value: 'triad', label: '三和音' },
              { value: '7th', label: '四和音' },
            ]}
            onChange={(chords) => setState((s) => ({ ...s, chords }))}
          />
          {state.key.mode === 'minor' && (
            <Segmented
              label="マイナースケールの種類"
              value={state.minorVariant}
              options={[
                { value: 'natural', label: 'ナチュラル' },
                { value: 'harmonic', label: 'ハーモニック' },
                { value: 'melodic', label: 'メロディック' },
              ]}
              onChange={(minorVariant) => setState((s) => ({ ...s, minorVariant }))}
            />
          )}
        </div>

        <DiatonicTable
          musicKey={state.key}
          chords={state.chords}
          minorVariant={state.minorVariant}
          notation={state.notation}
          selectedDegree={state.selectedChord}
          onSelectChord={(selectedChord) => setState((s) => ({ ...s, selectedChord }))}
        />

        <p className="legend">
          <span className="func-badge f-T">T</span> トニック
          <span className="func-badge f-SD">SD</span> サブドミナント
          <span className="func-badge f-D">D</span> ドミナント
          コードをタップすると指板・鍵盤に表示
        </p>

        <section className="board-section" aria-label="指板と鍵盤">
          <div className="board-header">
            <h2>{boardTitle}</h2>
            {selectedRow && (
              <button
                type="button"
                className="text-button"
                onClick={() => setState((s) => ({ ...s, selectedChord: null }))}
              >
                スケール表示に戻す
              </button>
            )}
          </div>

          <div className="board-controls">
            <label className="field">
              スケール
              <select
                aria-label="スケール"
                value={state.scale}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    scale: e.target.value as ScaleType | 'auto',
                    selectedChord: null,
                  }))
                }
              >
                <option value="auto">キーに追従</option>
                {SCALE_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {SCALES[t].nameJa}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              ポジション
              <select
                aria-label="ポジション"
                value={state.caged}
                onChange={(e) =>
                  setState((s) => ({ ...s, caged: e.target.value as CagedShape | 'all' }))
                }
              >
                <option value="all">全体</option>
                {CAGED_SHAPES.map((c) => (
                  <option key={c} value={c}>
                    {c} シェイプ
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              フレット数
              <select
                aria-label="フレット数"
                value={state.maxFret}
                onChange={(e) => setState((s) => ({ ...s, maxFret: Number(e.target.value) }))}
              >
                {FRET_CHOICES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <Segmented
              label="ラベル表示"
              value={state.labels}
              options={[
                { value: 'name', label: '音名' },
                { value: 'degree', label: '度数' },
              ]}
              onChange={(labels) => setState((s) => ({ ...s, labels }))}
            />
            <label className="field checkbox">
              <input
                type="checkbox"
                checked={state.lefty}
                onChange={(e) => setState((s) => ({ ...s, lefty: e.target.checked }))}
              />
              左利き表示
            </label>
          </div>

          <FretboardView
            tuning={STANDARD_GUITAR}
            highlights={highlights}
            maxFret={state.maxFret}
            lefty={state.lefty}
            windows={windows}
          />
          <KeyboardView highlights={highlights} />
        </section>
      </main>
    </div>
  );
}
