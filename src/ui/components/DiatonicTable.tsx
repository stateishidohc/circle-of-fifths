import type { Key } from '../../core/key';
import type { MinorVariant } from '../../core/diatonic';
import { diatonicChords, diatonicScaleType } from '../../core/diatonic';
import { chordName } from '../../core/chord';
import { avoidNotes } from '../../core/harmony';
import { scaleNotes } from '../../core/scale';
import type { Notation } from '../../core/pitch';
import { noteName } from '../../core/pitch';

interface Props {
  musicKey: Key;
  chords: 'triad' | '7th';
  minorVariant: MinorVariant;
  notation: Notation;
  /** 選択中のコード（degree 1-7）。タップでトグル */
  selectedDegree: number | null;
  onSelectChord: (degree: number | null) => void;
}

const FUNC_LABEL = { T: 'トニック', SD: 'サブドミナント', D: 'ドミナント' } as const;

export function DiatonicTable({
  musicKey,
  chords,
  minorVariant,
  notation,
  selectedDegree,
  onSelectChord,
}: Props) {
  const rows = diatonicChords(musicKey, { seventh: chords === '7th', minorVariant });
  const keyScale = scaleNotes(musicKey.tonic, diatonicScaleType(musicKey.mode, minorVariant));
  return (
    <table className="diatonic-table" aria-label="ダイアトニックコード表">
      <thead>
        <tr>
          <th scope="col">度数</th>
          <th scope="col">コード</th>
          <th scope="col">構成音</th>
          <th scope="col">機能</th>
          <th scope="col">
            <abbr title="アボイドノート">回避</abbr>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const selected = row.degree === selectedDegree;
          return (
            <tr key={row.degree} className={selected ? 'is-selected' : ''}>
              <td className="dt-roman">{row.roman}</td>
              <td className="dt-chord">
                <button
                  type="button"
                  className="dt-chord-btn"
                  aria-pressed={selected}
                  aria-label={`${chordName(row.chord, notation)} を指板と鍵盤に表示`}
                  onClick={() => onSelectChord(selected ? null : row.degree)}
                >
                  {chordName(row.chord, notation)}
                </button>
              </td>
              <td className="dt-notes">{row.notes.map((n) => noteName(n, notation)).join(' ')}</td>
              <td>
                <span className={`func-badge f-${row.func}`} title={FUNC_LABEL[row.func]}>
                  {row.func}
                </span>
              </td>
              <td className="dt-avoid">
                {avoidNotes(row.chord, keyScale)
                  .map((n) => noteName(n, notation))
                  .join(' ') || '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
