import type { Key } from '../../core/key';
import { keySignatureLabel } from '../../core/key';
import type { Chord } from '../../core/chord';
import { chordName } from '../../core/chord';
import type { MinorVariant } from '../../core/diatonic';
import {
  borrowedChords,
  relatedKeys,
  secondaryDominants,
  tritoneSubstitute,
} from '../../core/harmony';
import type { Notation } from '../../core/pitch';
import { noteName } from '../../core/pitch';
import { P5, transpose } from '../../core/interval';

interface Props {
  musicKey: Key;
  minorVariant: MinorVariant;
  notation: Notation;
  onSelectKey: (key: Key) => void;
  /** コードチップのタップで指板・鍵盤にプレビュー表示する */
  onPreviewChord: (label: string, chord: Chord) => void;
}

function keyLabel(key: Key, notation: Notation): string {
  return noteName(key.tonic, notation) + (key.mode === 'minor' ? 'm' : '');
}

export function HarmonyPanel({
  musicKey,
  minorVariant,
  notation,
  onSelectKey,
  onPreviewChord,
}: Props) {
  const related = relatedKeys(musicKey);
  const secondaries = secondaryDominants(musicKey, minorVariant);
  const v7: Chord = { root: transpose(musicKey.tonic, P5), quality: '7' };
  const subV7 = tritoneSubstitute(v7);
  const borrowed = borrowedChords(musicKey);

  const relatedItems: { label: string; key: Key }[] = [
    { label: '平行調', key: related.relative },
    { label: '同主調', key: related.parallel },
    { label: '属調', key: related.dominant },
    { label: '下属調', key: related.subdominant },
  ];

  return (
    <section className="harmony-panel" aria-label="応用理論">
      <h2>応用理論</h2>

      <div className="harmony-group">
        <h3>近親調</h3>
        <div className="chip-row">
          {relatedItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="chip"
              onClick={() => onSelectKey(item.key)}
              aria-label={`${item.label} ${keyLabel(item.key, notation)} に切り替え`}
            >
              <span className="chip-sub">{item.label}</span>
              {keyLabel(item.key, notation)}
              <span className="chip-sub">{keySignatureLabel(item.key)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="harmony-group">
        <h3>セカンダリードミナント</h3>
        <div className="chip-row">
          {secondaries.map((item) => (
            <button
              key={item.label}
              type="button"
              className="chip"
              onClick={() => onPreviewChord(item.label, item.chord)}
            >
              <span className="chip-sub">{item.label}</span>
              {chordName(item.chord, notation)}
              {item.note && <span className="chip-sub">{item.note}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="harmony-group">
        <h3>裏コード</h3>
        <div className="chip-row">
          <button
            type="button"
            className="chip"
            onClick={() => onPreviewChord('subV7', subV7)}
          >
            <span className="chip-sub">V7 の裏</span>
            {chordName(subV7, notation)}
            <span className="chip-sub">（{chordName(v7, notation)} と3度・7度を共有）</span>
          </button>
        </div>
      </div>

      <div className="harmony-group">
        <h3>借用和音</h3>
        <div className="chip-row">
          {borrowed.map((item) => (
            <button
              key={item.label}
              type="button"
              className="chip"
              onClick={() => onPreviewChord(item.label, item.chord)}
            >
              <span className="chip-sub">{item.label}</span>
              {chordName(item.chord, notation)}
              {item.note && <span className="chip-sub">{item.note}</span>}
            </button>
          ))}
        </div>
        <p className="harmony-note">
          コードのチップをタップすると指板・鍵盤に構成音が表示されます。
        </p>
      </div>
    </section>
  );
}
