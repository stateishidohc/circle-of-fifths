import type { Key } from '../../core/key';
import type { MinorVariant } from '../../core/diatonic';
import { diatonicChords } from '../../core/diatonic';
import { chordName } from '../../core/chord';
import type { Notation } from '../../core/pitch';
import { noteName } from '../../core/pitch';

interface Props {
  musicKey: Key;
  chords: 'triad' | '7th';
  minorVariant: MinorVariant;
  notation: Notation;
}

const FUNC_LABEL = { T: 'トニック', SD: 'サブドミナント', D: 'ドミナント' } as const;

export function DiatonicTable({ musicKey, chords, minorVariant, notation }: Props) {
  const rows = diatonicChords(musicKey, { seventh: chords === '7th', minorVariant });
  return (
    <table className="diatonic-table" aria-label="ダイアトニックコード表">
      <thead>
        <tr>
          <th scope="col">度数</th>
          <th scope="col">コード</th>
          <th scope="col">構成音</th>
          <th scope="col">機能</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.degree}>
            <td className="dt-roman">{row.roman}</td>
            <td className="dt-chord">{chordName(row.chord, notation)}</td>
            <td className="dt-notes">{row.notes.map((n) => noteName(n, notation)).join(' ')}</td>
            <td>
              <span className={`func-badge f-${row.func}`} title={FUNC_LABEL[row.func]}>
                {row.func}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
