import { useEffect, useState } from 'react';
import type { Key } from './core/key';
import { CircleOfFifths } from './ui/components/CircleOfFifths';
import { DiatonicTable } from './ui/components/DiatonicTable';
import type { AppState } from './state/urlState';
import { searchFromState, stateFromSearch } from './state/urlState';

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
        />

        <p className="legend">
          <span className="func-badge f-T">T</span> トニック
          <span className="func-badge f-SD">SD</span> サブドミナント
          <span className="func-badge f-D">D</span> ドミナント
        </p>
      </main>
    </div>
  );
}
