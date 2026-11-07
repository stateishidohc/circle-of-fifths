import { useEffect, useMemo, useState } from 'react';
import type { Chord } from '../../core/chord';
import { chordName } from '../../core/chord';
import type { Notation } from '../../core/pitch';
import { STANDARD_GUITAR } from '../../core/instrument/tuning';
import { FretboardVoicingGenerator, voicingShape } from '../../core/voicing/generator';
import { voicingDistance, voicingSoundedMidis } from '../../core/voicing/scorer';
import { triadOf, triadVoicings } from '../../core/voicing/triads';
import type { Voicing } from '../../core/voicing/types';
import { play } from '../../audio/synth';
import { ChordDiagram } from './ChordDiagram';

interface Props {
  chord: Chord;
  notation: Notation;
}

const generator = new FretboardVoicingGenerator();

const TAG_FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 'open', label: 'オープン' },
  { value: 'barre', label: 'バレー' },
  { value: 'shell', label: 'シェル' },
  { value: 'drop2', label: 'ドロップ2' },
  { value: 'drop3', label: 'ドロップ3' },
  { value: 'omit5', label: '5度省略' },
] as const;

const ROOT_STRINGS = [
  { value: 0, label: '指定なし' },
  { value: 6, label: '6弦ルート' },
  { value: 5, label: '5弦ルート' },
  { value: 4, label: '4弦ルート' },
] as const;

const STRING_SETS = [
  { value: 0, label: 'すべての弦セット' },
  { value: 3, label: '1〜3弦' },
  { value: 4, label: '2〜4弦' },
  { value: 5, label: '3〜5弦' },
  { value: 6, label: '4〜6弦' },
] as const;

const PAGE = 8;

/** コードボイシング（押さえ方）の一覧パネル */
export function VoicingPanel({ chord, notation }: Props) {
  const [mode, setMode] = useState<'triads' | 'forms'>('triads');
  const [rootString, setRootString] = useState(0);
  const [tag, setTag] = useState<string>('all');
  const [stringSet, setStringSet] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);

  const name = chordName(chord, notation);
  const chordKey = chordName(chord);

  // コードが変わったら選択とページングをリセット
  useEffect(() => {
    setSelectedShape(null);
    setShowAll(false);
  }, [chordKey]);

  const formVoicings = useMemo(
    () =>
      generator.generate(chord, STANDARD_GUITAR, {
        rootString: rootString === 0 ? undefined : rootString,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chordKey, rootString],
  );

  const triads = useMemo(
    () =>
      triadVoicings(chord, STANDARD_GUITAR, {
        bassString: stringSet === 0 ? undefined : stringSet,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chordKey, stringSet],
  );

  const filtered =
    mode === 'triads'
      ? triads
      : tag === 'all'
        ? formVoicings
        : formVoicings.filter((v) => v.tags.includes(tag));
  const visible = mode === 'triads' || showAll ? filtered : filtered.slice(0, PAGE);
  const selected = selectedShape
    ? (filtered.find((v) => voicingShape(v) === selectedShape) ?? null)
    : null;

  const onSelect = (v: Voicing) => {
    setSelectedShape(voicingShape(v));
    // 軽いストラムで試聴
    play(voicingSoundedMidis(v, STANDARD_GUITAR), { mode: 'arpeggio', bpm: 320 });
  };

  const triadName = chordName(triadOf(chord), notation);

  return (
    <section className="voicing-panel" aria-label="コードボイシング">
      <h2>
        ボイシング: {name}
        <span className="voicing-count">{filtered.length}件</span>
      </h2>

      <div className="segmented" role="radiogroup" aria-label="ボイシングの種類">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'triads'}
          className={mode === 'triads' ? 'is-active' : ''}
          onClick={() => setMode('triads')}
        >
          トライアド
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'forms'}
          className={mode === 'forms' ? 'is-active' : ''}
          onClick={() => setMode('forms')}
        >
          コードフォーム
        </button>
      </div>

      {mode === 'triads' ? (
        <>
          <div className="board-controls">
            <label className="field">
              弦セット
              <select
                aria-label="弦セット"
                value={stringSet}
                onChange={(e) => setStringSet(Number(e.target.value))}
              >
                {STRING_SETS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="harmony-note">
            {chord.quality !== triadOf(chord).quality && `7度を省いた ${triadName} トライアド。`}
            隣り合う3本の弦で「基本形 → 第1転回形 → 第2転回形」とネックを上がって
            いきます。最低音がルートなら基本形、3度なら第1転回形、5度なら第2転回形です。
            タップで試聴できます。
          </p>
        </>
      ) : (
        <>
          <div className="board-controls">
            <label className="field">
              ルート弦
              <select
                aria-label="ルート弦"
                value={rootString}
                onChange={(e) => setRootString(Number(e.target.value))}
              >
                {ROOT_STRINGS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              タイプ
              <select aria-label="タイプ" value={tag} onChange={(e) => setTag(e.target.value)}>
                {TAG_FILTERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="harmony-note">
            タップで試聴。選択すると他のフォームに移動量（ボイスリーディング距離）が出ます。
          </p>
        </>
      )}

      <div className="voicing-grid">
        {visible.map((v) => {
          const shape = voicingShape(v);
          return (
            <ChordDiagram
              key={shape + v.tags.join()}
              voicing={v}
              tuning={STANDARD_GUITAR}
              selected={shape === selectedShape}
              distance={
                selected && shape !== selectedShape
                  ? voicingDistance(selected, v, STANDARD_GUITAR)
                  : null
              }
              onSelect={onSelect}
            />
          );
        })}
      </div>

      {mode === 'forms' && filtered.length > PAGE && (
        <button type="button" className="text-button" onClick={() => setShowAll((s) => !s)}>
          {showAll ? '表示を減らす' : `さらに表示（全${filtered.length}件）`}
        </button>
      )}
      {filtered.length === 0 && (
        <p className="harmony-note">条件に合うボイシングが見つかりません。</p>
      )}
    </section>
  );
}
