import { chordTones } from '../../core/chord';
import { pc } from '../../core/pitch';
import type { Tuning } from '../../core/instrument/tuning';
import type { Voicing } from '../../core/voicing/types';
import { voicingShape } from '../../core/voicing/generator';

interface Props {
  voicing: Voicing;
  tuning: Tuning;
  selected: boolean;
  /** 選択中ボイシングからの移動量（ボイスリーディング距離）。null なら非表示 */
  distance: number | null;
  onSelect: (voicing: Voicing) => void;
}

const SP = 17; // 弦間隔
const ROW = 19; // フレット間隔
const LEFT = 15;
const TOP = 30;
const ROWS = 4;

const TAG_LABELS: Record<string, string> = {
  open: 'オープン',
  barre: 'バレー',
  shell: 'シェル',
  drop2: 'ドロップ2',
  drop3: 'ドロップ3',
  omit5: '5度省略',
  inversion: '転回形',
};

/** 縦型コードダイアグラム（左=低音弦） */
export function ChordDiagram({ voicing, tuning, selected, distance, onSelect }: Props) {
  const n = tuning.strings.length;
  const labelByPc = new Map<number, { label: string; isRoot: boolean }>();
  for (const t of chordTones(voicing.chord)) {
    labelByPc.set(pc(t.note), { label: t.label, isRoot: t.role === 'R' });
  }

  const fretted = voicing.positions.filter((p) => p.fret !== null && p.fret > 0);
  const maxFret = fretted.length ? Math.max(...fretted.map((p) => p.fret!)) : 0;
  const minFret = fretted.length ? Math.min(...fretted.map((p) => p.fret!)) : 1;
  const startFret = maxFret <= ROWS ? 1 : minFret;
  const showNut = startFret === 1;

  const x = (string: number) => LEFT + (n - string) * SP;
  const fretY = (fret: number) => TOP + (fret - startFret + 0.5) * ROW;
  const width = LEFT * 2 + (n - 1) * SP + (showNut ? 0 : 22);
  const height = TOP + ROWS * ROW + 8;
  const shape = voicingShape(voicing);

  return (
    <button
      type="button"
      className={`chord-diagram ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      aria-label={`ボイシング ${shape} を再生`}
      onClick={() => onSelect(voicing)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
        {/* 弦 */}
        {Array.from({ length: n }, (_, i) => i + 1).map((s) => (
          <line
            key={s}
            className="cd-string"
            x1={x(s)}
            y1={TOP}
            x2={x(s)}
            y2={TOP + ROWS * ROW}
          />
        ))}
        {/* フレット */}
        {Array.from({ length: ROWS + 1 }, (_, i) => (
          <line
            key={i}
            className={i === 0 && showNut ? 'cd-nut' : 'cd-fret'}
            x1={x(n)}
            y1={TOP + i * ROW}
            x2={x(1)}
            y2={TOP + i * ROW}
          />
        ))}
        {!showNut && (
          <text className="cd-pos" x={x(1) + 6} y={TOP + ROW * 0.5}>
            {startFret}fr
          </text>
        )}
        {/* バレー */}
        {voicing.barre && (
          <rect
            className="cd-barre"
            x={x(voicing.barre.fromString) - 6}
            y={fretY(voicing.barre.fret) - 7}
            width={x(voicing.barre.toString) - x(voicing.barre.fromString) + 12}
            height={14}
            rx={7}
          />
        )}
        {/* 各弦のマーク */}
        {voicing.positions.map((p) => {
          const cx = x(p.string);
          if (p.fret === null) {
            return (
              <text key={p.string} className="cd-mute" x={cx} y={TOP - 18}>
                ×
              </text>
            );
          }
          if (p.fret === 0) {
            return (
              <circle key={p.string} className="cd-open" cx={cx} cy={TOP - 21} r={4.5} />
            );
          }
          const tonePc =
            (((tuning.strings[p.string - 1].pc + p.fret) % 12) + 12) % 12;
          const info = labelByPc.get(tonePc);
          return (
            <g key={p.string} className={`cd-dot ${info?.isRoot ? 'is-root' : ''}`}>
              <circle cx={cx} cy={fretY(p.fret)} r={7.5} />
              <text x={cx} y={fretY(p.fret)}>
                {info?.label}
              </text>
            </g>
          );
        })}
      </svg>
      <span className="cd-caption">
        <span className="cd-shape">{shape}</span>
        <span className="cd-tags">
          {voicing.tags.map((t) => TAG_LABELS[t] ?? t).join('・') || '　'}
        </span>
        <span className="cd-meta">
          難易度 {voicing.difficulty}
          {distance !== null && ` ・移動 ${distance}`}
        </span>
      </span>
    </button>
  );
}
