import type { PitchClass } from '../../core/pitch';
import { roleClass } from '../toneRoles';
import type { ToneHighlight } from './FretboardView';

interface Props {
  highlights: ToneHighlight[];
}

const WK_W = 32;
const WK_H = 108;
const BK_W = 19;
const BK_H = 66;
const OCTAVES = 2;

const WHITE_PCS: PitchClass[] = [0, 2, 4, 5, 7, 9, 11];
/** 黒鍵: [直前の白鍵インデックス, ピッチクラス] */
const BLACK_KEYS: [number, PitchClass][] = [
  [0, 1],
  [1, 3],
  [3, 6],
  [4, 8],
  [5, 10],
];

/** 鍵盤ビュー（2オクターブ） */
export function KeyboardView({ highlights }: Props) {
  const byPc = new Map(highlights.map((h) => [h.pc, h]));
  const width = OCTAVES * 7 * WK_W;
  const height = WK_H + 2;

  const octaves = Array.from({ length: OCTAVES }, (_, o) => o);

  return (
    <svg
      className="keyboard"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="鍵盤（2オクターブ）"
    >
      {octaves.map((o) =>
        WHITE_PCS.map((pc, wi) => {
          const x = (o * 7 + wi) * WK_W;
          const h = byPc.get(pc);
          return (
            <g key={`${o}-${pc}`}>
              <rect className="kb-white" x={x} y="1" width={WK_W} height={WK_H} rx="3" />
              {h && (
                <g className={`kb-note ${roleClass(h.role)} ${h.isRoot ? 'is-root' : ''}`}>
                  <circle cx={x + WK_W / 2} cy={WK_H - 15} r="10" />
                  <text x={x + WK_W / 2} y={WK_H - 15}>
                    {h.text}
                  </text>
                </g>
              )}
            </g>
          );
        }),
      )}
      {octaves.map((o) =>
        BLACK_KEYS.map(([wi, pc]) => {
          const x = (o * 7 + wi + 1) * WK_W - BK_W / 2;
          const h = byPc.get(pc);
          return (
            <g key={`${o}-${pc}`}>
              <rect className="kb-black" x={x} y="1" width={BK_W} height={BK_H} rx="2.5" />
              {h && (
                <g className={`kb-note on-black ${roleClass(h.role)} ${h.isRoot ? 'is-root' : ''}`}>
                  <circle cx={x + BK_W / 2} cy={BK_H - 12} r="8.5" />
                  <text x={x + BK_W / 2} y={BK_H - 12}>
                    {h.text}
                  </text>
                </g>
              )}
            </g>
          );
        }),
      )}
    </svg>
  );
}
