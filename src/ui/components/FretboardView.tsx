import type { PitchClass } from '../../core/pitch';
import { midi } from '../../core/pitch';
import type { Tuning } from '../../core/instrument/tuning';
import type { PositionWindow } from '../../core/instrument/positions';

export interface ToneHighlight {
  pc: PitchClass;
  /** 表示テキスト（音名または度数。表示モードは上流で決める） */
  text: string;
  isRoot: boolean;
}

interface Props {
  tuning: Tuning;
  highlights: ToneHighlight[];
  maxFret: number;
  lefty: boolean;
  /** CAGED 窓。null なら全体表示 */
  windows: PositionWindow[] | null;
}

const FRET_W = 54;
const STR_GAP = 26;
const NUT_X = 64;
const TOP = 20;

const INLAY_SINGLE = [3, 5, 7, 9, 15, 17, 21];
const FRET_NUMBERS = [3, 5, 7, 9, 12, 15, 18, 21];

/** ギター指板ビュー（横向き・1弦が上）。スマホでは横スクロールする */
export function FretboardView({ tuning, highlights, maxFret, lefty, windows }: Props) {
  const nStrings = tuning.strings.length;
  const width = NUT_X + maxFret * FRET_W + 14;
  const height = TOP + (nStrings - 1) * STR_GAP + 36;
  const midY = TOP + ((nStrings - 1) * STR_GAP) / 2;
  const mx = (x: number) => (lefty ? width - x : x);
  const byPc = new Map(highlights.map((h) => [h.pc, h]));

  const fretX = (f: number) => mx(NUT_X + f * FRET_W); // フレットバーの位置
  const noteX = (f: number) => (f === 0 ? mx(NUT_X - 24) : mx(NUT_X + (f - 0.5) * FRET_W));
  const inWindow = (f: number) =>
    windows === null || windows.some((w) => f >= w.minFret && f <= w.maxFret);

  return (
    <div className="fretboard-scroll">
      <svg
        className="fretboard"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`ギター指板（${tuning.name}、0〜${maxFret}フレット）`}
      >
        {/* CAGED 窓の背景 */}
        {windows?.map((w, i) => {
          const x0 = w.minFret === 0 ? mx(NUT_X - 48) : fretX(w.minFret - 1);
          const x1 = fretX(w.maxFret);
          return (
            <rect
              key={i}
              className="fb-window"
              x={Math.min(x0, x1)}
              y={TOP - 14}
              width={Math.abs(x1 - x0)}
              height={(nStrings - 1) * STR_GAP + 28}
              rx="8"
            />
          );
        })}
        {/* ナットとフレット */}
        <line className="fb-nut" x1={fretX(0)} y1={TOP - 10} x2={fretX(0)} y2={TOP + (nStrings - 1) * STR_GAP + 10} />
        {Array.from({ length: maxFret }, (_, i) => i + 1).map((f) => (
          <line
            key={f}
            className="fb-fret"
            x1={fretX(f)}
            y1={TOP - 8}
            x2={fretX(f)}
            y2={TOP + (nStrings - 1) * STR_GAP + 8}
          />
        ))}
        {/* ポジションマーク */}
        {INLAY_SINGLE.filter((f) => f <= maxFret).map((f) => (
          <circle key={f} className="fb-inlay" cx={noteX(f)} cy={midY} r="4.5" />
        ))}
        {12 <= maxFret && (
          <>
            <circle className="fb-inlay" cx={noteX(12)} cy={midY - STR_GAP * 1.5} r="4.5" />
            <circle className="fb-inlay" cx={noteX(12)} cy={midY + STR_GAP * 1.5} r="4.5" />
          </>
        )}
        {/* 弦 */}
        {tuning.strings.map((_, i) => (
          <line
            key={i}
            className="fb-string"
            x1={mx(NUT_X - 46)}
            y1={TOP + i * STR_GAP}
            x2={fretX(maxFret)}
            y2={TOP + i * STR_GAP}
            strokeWidth={0.8 + i * 0.3}
          />
        ))}
        {/* フレット番号 */}
        {FRET_NUMBERS.filter((f) => f <= maxFret).map((f) => (
          <text key={f} className="fb-fret-number" x={noteX(f)} y={height - 8}>
            {f}
          </text>
        ))}
        {/* ハイライト音 */}
        {tuning.strings.map((open, si) =>
          Array.from({ length: maxFret + 1 }, (_, f) => {
            const tonePc = ((midi(open) + f) % 12) as PitchClass;
            const h = byPc.get(tonePc);
            if (!h) return null;
            const y = TOP + si * STR_GAP;
            return (
              <g
                key={`${si}-${f}`}
                className={`fb-note ${h.isRoot ? 'is-root' : ''}`}
                opacity={inWindow(f) ? 1 : 0.16}
              >
                <circle cx={noteX(f)} cy={y} r="10.5" />
                <text x={noteX(f)} y={y}>
                  {h.text}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
