import { useEffect, useRef, useState } from 'react';
import type { Key } from './core/key';
import { pc, noteName } from './core/pitch';
import type { SpelledNote } from './core/pitch';
import type { Chord } from './core/chord';
import { chordName, chordTones } from './core/chord';
import { SCALES, SCALE_ORDER, scaleNotes, scaleTones } from './core/scale';
import type { ScaleType } from './core/scale';
import { diatonicChords, diatonicScaleType } from './core/diatonic';
import { avoidNotes, tritonePair } from './core/harmony';
import { STANDARD_GUITAR } from './core/instrument/tuning';
import { CAGED_SHAPES, cagedPositions } from './core/instrument/positions';
import type { CagedShape } from './core/instrument/positions';
import { play, playDuration, stopAll } from './audio/synth';
import type { PlayMode } from './audio/synth';
import { scaleRunMidis, stackChordMidis } from './audio/arrange';
import { CircleOfFifths } from './ui/components/CircleOfFifths';
import { DiatonicTable } from './ui/components/DiatonicTable';
import { FretboardView } from './ui/components/FretboardView';
import type { ToneHighlight } from './ui/components/FretboardView';
import { KeyboardView } from './ui/components/KeyboardView';
import { HarmonyPanel } from './ui/components/HarmonyPanel';
import { VoicingPanel } from './ui/components/VoicingPanel';
import { GuideModal } from './ui/components/GuideModal';
import type { AppState } from './state/urlState';
import { FRET_CHOICES, effectiveScaleType, searchFromState, stateFromSearch } from './state/urlState';

const BPM_CHOICES = [60, 80, 100, 120, 140, 160, 180];

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
  /** 応用理論パネルからのプレビュー表示（URL には載せない一時状態） */
  const [preview, setPreview] = useState<{ label: string; chord: Chord } | null>(null);
  const [bpm, setBpm] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const playTimer = useRef<number | null>(null);

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

  const setKey = (key: Key) => {
    setPreview(null);
    setState((s) => ({ ...s, key }));
  };

  // 指板・鍵盤のハイライト（プレビュー > 選択コード > スケール）
  const scaleType = effectiveScaleType(state);
  const rows = diatonicChords(state.key, {
    seventh: state.chords === '7th',
    minorVariant: state.minorVariant,
  });
  const selectedRow = state.selectedChord !== null ? rows[state.selectedChord - 1] : null;
  const displayedChord = preview?.chord ?? selectedRow?.chord ?? null;
  const toneText = (note: SpelledNote, degreeLabel: string) =>
    state.labels === 'degree' ? degreeLabel : noteName(note, state.notation);
  const highlights: ToneHighlight[] = displayedChord
    ? chordTones(displayedChord).map((t) => ({
        pc: pc(t.note),
        text: toneText(t.note, t.label),
        isRoot: t.role === 'R',
        role: t.role,
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

  const boardTitle = preview
    ? `コードトーン: ${preview.label}（${chordName(preview.chord, state.notation)}）`
    : selectedRow
      ? `コードトーン: ${selectedRow.roman}（${chordName(selectedRow.chord, state.notation)}）`
      : `${noteName(state.key.tonic, state.notation)} ${SCALES[scaleType].nameJa}`;

  // 表示中コードのアボイドノートとトライトーン
  const keyScale = scaleNotes(
    state.key.tonic,
    diatonicScaleType(state.key.mode, state.minorVariant),
  );
  const avoid = displayedChord ? avoidNotes(displayedChord, keyScale) : [];
  const tritone = displayedChord ? tritonePair(displayedChord) : null;

  const startPlay = (mode: PlayMode) => {
    const midis = displayedChord
      ? stackChordMidis(chordTones(displayedChord).map((t) => t.note))
      : scaleRunMidis(scaleTones(state.key.tonic, scaleType).map((t) => t.note));
    play(midis, { mode, bpm });
    setPlaying(true);
    if (playTimer.current) window.clearTimeout(playTimer.current);
    playTimer.current = window.setTimeout(
      () => setPlaying(false),
      playDuration(midis.length, { mode, bpm }) * 1000,
    );
  };

  const stopPlay = () => {
    stopAll();
    setPlaying(false);
    if (playTimer.current) window.clearTimeout(playTimer.current);
  };

  const clearChordDisplay = () => {
    setPreview(null);
    setState((s) => ({ ...s, selectedChord: null }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>5度圏</h1>
        <button type="button" className="guide-button" onClick={() => setGuideOpen(true)}>
          使い方
        </button>
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
          onSelectChord={(selectedChord) => {
            setPreview(null);
            setState((s) => ({ ...s, selectedChord }));
          }}
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
            {(selectedRow || preview) && (
              <button type="button" className="text-button" onClick={clearChordDisplay}>
                スケール表示に戻す
              </button>
            )}
          </div>

          {displayedChord && (
            <p className="role-legend" aria-label="構成音の色分け">
              <span className="role-chip role-R">R ルート</span>
              <span className="role-chip role-3">3度</span>
              <span className="role-chip role-5">5度</span>
              {chordTones(displayedChord).some((t) => t.role === '7') && (
                <span className="role-chip role-7">7度</span>
              )}
            </p>
          )}

          {displayedChord && (
            <p className="chord-info">
              {tritone && (
                <span className="info-chip info-tritone">
                  トライトーン: {noteName(tritone[0], state.notation)}–
                  {noteName(tritone[1], state.notation)}
                </span>
              )}
              <span className="info-chip">
                アボイドノート:{' '}
                {avoid.length > 0
                  ? avoid.map((n) => noteName(n, state.notation)).join(' ')
                  : 'なし'}
              </span>
            </p>
          )}

          <div className="board-controls playback">
            {displayedChord ? (
              <>
                <button type="button" className="play-button" onClick={() => startPlay('chord')}>
                  ♪ 同時に鳴らす
                </button>
                <button type="button" className="play-button" onClick={() => startPlay('arpeggio')}>
                  ♪ アルペジオ
                </button>
              </>
            ) : (
              <button type="button" className="play-button" onClick={() => startPlay('sequence')}>
                ♪ スケール再生（上行・下行）
              </button>
            )}
            {playing && (
              <button type="button" className="play-button is-stop" onClick={stopPlay}>
                ■ 停止
              </button>
            )}
            <label className="field">
              テンポ
              <select
                aria-label="テンポ"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
              >
                {BPM_CHOICES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
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

        {displayedChord && <VoicingPanel chord={displayedChord} notation={state.notation} />}

        <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

        <HarmonyPanel
          musicKey={state.key}
          minorVariant={state.minorVariant}
          notation={state.notation}
          onSelectKey={setKey}
          onPreviewChord={(label, chord) => {
            setState((s) => ({ ...s, selectedChord: null }));
            setPreview({ label, chord });
          }}
        />
      </main>
    </div>
  );
}
