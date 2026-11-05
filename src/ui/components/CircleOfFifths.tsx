import { useEffect, useRef, useState } from 'react';
import type { Key } from '../../core/key';
import { CIRCLE_OF_FIFTHS, circleIndexOf, keySignatureLabel } from '../../core/key';
import type { HarmonicFunction } from '../../core/diatonic';
import type { Notation, SpelledNote } from '../../core/pitch';
import { noteName } from '../../core/pitch';

interface Props {
  selectedKey: Key;
  notation: Notation;
  onSelect: (key: Key) => void;
}

const SECTOR = 30; // 1ポジションの角度
const R_OUTER = 168;
const R_MID = 118;
const R_INNER = 72;
const LABEL_OUTER = 145;
const LABEL_INNER = 95;

/** 選択キーから見た各ポジション・リングの機能（ダイアトニックの扇形） */
function functionAt(
  selected: Key,
  index: number,
  ring: 'major' | 'minor',
): HarmonicFunction | null {
  const k = circleIndexOf(selected);
  const rel = (index - k + 12) % 12;
  const selRing = selected.mode === 'major' ? 'major' : 'minor';
  if (rel === 0) {
    if (ring === selRing) return 'T'; // I / Im
    return ring === 'major' ? 'T' : 'T'; // 平行調（vi / ♭III）もトニック群
  }
  if (rel === 11) return 'SD'; // IV・ii / IVm・♭VI
  if (rel === 1) {
    if (selected.mode === 'major') return ring === 'major' ? 'D' : 'T'; // V / iii
    return 'D'; // Vm・♭VII
  }
  return null;
}

function polar(angleDeg: number, r: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}

/** 扇形（アニュラスセグメント）のパス。angle はセクター中心、幅 SECTOR */
function sectorPath(centerAngle: number, rIn: number, rOut: number): string {
  const a0 = centerAngle - SECTOR / 2;
  const a1 = centerAngle + SECTOR / 2;
  const [x0o, y0o] = polar(a0, rOut);
  const [x1o, y1o] = polar(a1, rOut);
  const [x0i, y0i] = polar(a0, rIn);
  const [x1i, y1i] = polar(a1, rIn);
  return [
    `M ${x0o} ${y0o}`,
    `A ${rOut} ${rOut} 0 0 1 ${x1o} ${y1o}`,
    `L ${x1i} ${y1i}`,
    `A ${rIn} ${rIn} 0 0 0 ${x0i} ${y0i}`,
    'Z',
  ].join(' ');
}

function shortestDelta(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function nameWithAlt(main: SpelledNote, alt: SpelledNote | undefined, notation: Notation): string {
  return alt ? `${noteName(main, notation)}/${noteName(alt, notation)}` : noteName(main, notation);
}

export function CircleOfFifths({ selectedKey, notation, onSelect }: Props) {
  const selectedIndex = circleIndexOf(selectedKey);
  const [rotation, setRotation] = useState(() => -SECTOR * selectedIndex);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef({ active: false, moved: false, startPointer: 0, startRotation: 0 });
  const anim = useRef<number | null>(null);
  const rotationRef = useRef(rotation);
  rotationRef.current = rotation;

  // 選んだキーが 12時に来るよう回転アニメーション
  useEffect(() => {
    if (drag.current.active) return;
    const from = rotationRef.current;
    const delta = shortestDelta(((from % 360) + 360) % 360, ((-SECTOR * selectedIndex) % 360 + 360) % 360);
    if (Math.abs(delta) < 0.5) return;
    const start = performance.now();
    const DURATION = 350;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const ease = 1 - Math.pow(1 - t, 3);
      setRotation(from + delta * ease);
      if (t < 1) anim.current = requestAnimationFrame(tick);
    };
    if (anim.current) cancelAnimationFrame(anim.current);
    anim.current = requestAnimationFrame(tick);
    return () => {
      if (anim.current) cancelAnimationFrame(anim.current);
    };
  }, [selectedIndex]);

  const pointerAngle = (e: React.PointerEvent): number => {
    const rect = svgRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (anim.current) cancelAnimationFrame(anim.current);
    drag.current = {
      active: true,
      moved: false,
      startPointer: pointerAngle(e),
      startRotation: rotationRef.current,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const delta = shortestDelta(drag.current.startPointer, pointerAngle(e));
    if (Math.abs(delta) > 4) drag.current.moved = true;
    setRotation(drag.current.startRotation + delta);
  };

  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (drag.current.moved) {
      // いちばん上に来たポジションのキーを選ぶ（リングは現在のモードを維持）
      const topIndex = ((Math.round(-rotationRef.current / SECTOR) % 12) + 12) % 12;
      const pos = CIRCLE_OF_FIFTHS[topIndex];
      onSelect(
        selectedKey.mode === 'major'
          ? { tonic: pos.major, mode: 'major' }
          : { tonic: pos.minor, mode: 'minor' },
      );
    }
  };

  const selectSector = (index: number, ring: 'major' | 'minor') => {
    if (drag.current.moved) return;
    const pos = CIRCLE_OF_FIFTHS[index];
    onSelect(
      ring === 'major' ? { tonic: pos.major, mode: 'major' } : { tonic: pos.minor, mode: 'minor' },
    );
  };

  const isSelected = (index: number, ring: 'major' | 'minor') => {
    if (index !== selectedIndex) return false;
    if (ring !== selectedKey.mode) return false;
    return true;
  };

  return (
    <svg
      ref={svgRef}
      className="circle-of-fifths"
      viewBox="-185 -185 370 370"
      role="group"
      aria-label="5度圏。外周が長調、内周が平行短調"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <circle className="cof-bg" cx="0" cy="0" r={R_OUTER + 10} />
      <g transform={`rotate(${rotation})`}>
        {CIRCLE_OF_FIFTHS.map((pos) => {
          const angle = pos.index * SECTOR;
          const upright = -angle - rotation;
          const sigLabel =
            pos.signature === 0 ? '♮' : pos.signature > 0 ? `${pos.signature}♯` : `${-pos.signature}♭`;
          return (
            <g key={pos.index} transform={`rotate(${angle})`}>
              {(['major', 'minor'] as const).map((ring) => {
                const func = functionAt(selectedKey, pos.index, ring);
                const selected = isSelected(pos.index, ring);
                const tonic = ring === 'major' ? pos.major : pos.minor;
                const alt = ring === 'major' ? pos.majorAlt : pos.minorAlt;
                const labelR = ring === 'major' ? LABEL_OUTER : LABEL_INNER;
                const rIn = ring === 'major' ? R_MID : R_INNER;
                const rOut = ring === 'major' ? R_OUTER : R_MID;
                const label =
                  ring === 'major'
                    ? `${nameWithAlt(tonic, alt, notation)} メジャー（${sigLabel}）`
                    : `${nameWithAlt(tonic, alt, notation)} マイナー`;
                return (
                  <g
                    key={ring}
                    role="button"
                    tabIndex={0}
                    aria-label={label}
                    aria-pressed={selected}
                    className={[
                      'cof-sector',
                      func ? `f-${func}` : '',
                      selected ? 'is-selected' : '',
                    ].join(' ')}
                    onClick={() => selectSector(pos.index, ring)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectSector(pos.index, ring);
                      }
                    }}
                  >
                    <path d={sectorPath(0, rIn, rOut)} />
                    <g transform={`translate(${polar(0, labelR)[0]} ${polar(0, labelR)[1]})`}>
                      <g transform={`rotate(${upright})`}>
                        <text className={ring === 'major' ? 'cof-label-major' : 'cof-label-minor'}>
                          <tspan x="0" dy={ring === 'major' ? '-0.15em' : '0.1em'}>
                            {noteName(tonic, notation)}
                            {ring === 'minor' ? 'm' : ''}
                            {ring === 'major' && alt ? `/${noteName(alt, notation)}` : ''}
                          </tspan>
                          {ring === 'major' && (
                            <tspan x="0" dy="1.25em" className="cof-sig">
                              {sigLabel}
                            </tspan>
                          )}
                        </text>
                      </g>
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
      {/* 12時の目印 */}
      <path className="cof-pointer" d={`M -7 ${-R_OUTER - 9} L 7 ${-R_OUTER - 9} L 0 ${-R_OUTER + 3} Z`} />
      <g className="cof-center" aria-live="polite">
        <text y="-10" className="cof-center-key">
          {noteName(selectedKey.tonic, notation)}
          {selectedKey.mode === 'minor' ? 'm' : ''}
        </text>
        <text y="16" className="cof-center-mode">
          {selectedKey.mode === 'major' ? 'メジャー' : 'マイナー'}
        </text>
        <text y="38" className="cof-center-sig">
          調号 {keySignatureLabel(selectedKey)}
        </text>
      </g>
    </svg>
  );
}
