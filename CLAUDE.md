# circle-of-fifths — 5度圏 音楽理論アプリ

ギター学習用の 5度圏 Web アプリ。詳細仕様は [docs/SPEC.md](docs/SPEC.md)。

## コマンド

```bash
npm run dev        # 開発サーバー
npm test           # Vitest（理論コアの単体テスト）
npm run test:e2e   # Playwright スモークテスト
npm run lint       # ESLint
npm run build      # tsc -b && vite build
```

## 設計方針（必読）

- **`src/core/` は純粋 TypeScript**。React・DOM・UI 層を import しない（ESLint の
  `no-restricted-imports` で担保）。理論の判断はすべて core に置き、UI は描画だけ。
- 音高計算は `PitchClass`（0–11 の数値）で行い、**表示用の綴り**（F♯ / G♭、E♯、C♭ など）は
  `SpelledNote`（letter + accidental）で別に持つ。綴りは度数（letter の歩数）＋半音数から
  機械的に導出する（`interval.ts` の `transpose`）。
- 調号は「五度線 (line of fifths)」のインデックスで計算する（C=0、♯方向 +1、♭方向 −1。
  短調は −3）。
- Phase 4（ボイシング）拡張のため、`Chord`/`ChordTone`/`Tuning`/`fretboard.ts` の型は
  `src/core/voicing/types.ts` と互換に保つこと。壊す変更をするときは SPEC 5章 Phase 4 を確認。

## 表記の規約（オーナー確認済み 2026-11-05。変える場合は core の定数を変更）

- ハーフディミニッシュは **m7♭5** 表記（IIm7♭5。ø は使わない）。
- 短調のディグリーはメジャースケール基準の相対表記（Im, IIm♭5(dim), ♭III, IVm, Vm, ♭VI, ♭VII）。
- dim トライアドのサフィックスは `dim`、セブンスは `m7♭5` / `dim7`。
- 機能: 長調 [T, SD, T, SD, D, T, D] / 短調 [T, SD, T, SD, D, SD, D]。
- 音名は英語表記が既定。ドレミ表記はオプション（`notation` 設定）。

## URL 同期

`?key=Eb&mode=minor&view=diatonic&chords=7th&minor=harmonic` の形。
`key` は ASCII（`#`/`b`）。状態は `src/state/urlState.ts` で一元管理。

## テスト

- 全24キー（長調12・短調12、F♯/G♭ の両綴り含む）の調号・スケール・ダイアトニックを
  `tests/core/` で網羅する。期待値はテーブル直書き（外部ライブラリに依存しない）。
- UI 変更時は Playwright のスモーク（`tests/e2e/`）が通ること。

## デプロイ

GitHub Actions（`.github/workflows/ci.yml`）で lint + test + build。
GitHub Pages へのデプロイはリポジトリ作成後に `VITE_BASE=/<repo>/` を設定して有効化する。
