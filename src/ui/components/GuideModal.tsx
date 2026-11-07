import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** 使い方ガイド（5度圏の読み方、転回形・ドロップなどの用語解説） */
export function GuideModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="guide-overlay" onClick={onClose}>
      <div
        className="guide-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="使い方ガイド"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="guide-header">
          <h2>使い方ガイド</h2>
          <button type="button" className="text-button" onClick={onClose}>
            閉じる ✕
          </button>
        </header>

        <section>
          <h3>5度圏とは？</h3>
          <p>
            12個のキーを「完全5度」ずつ（C → G → D → A …）時計回りに並べた円です。
            <strong>外周が長調（メジャーキー）、内周がその平行短調（マイナーキー）</strong>。
            右隣に進むほど ♯ が1つ増え、左隣に進むほど ♭ が1つ増えます（各キーの下の
            小さい数字が調号）。
          </p>
          <ul>
            <li>
              <strong>タップでキーを選択</strong>：外周をタップすると長調、内周をタップすると
              短調が選ばれ、そのキーが12時の位置に回転します。円をドラッグして回すこともできます。
            </li>
            <li>
              <strong>隣同士は「近い」キー</strong>：共通音が多く、転調やコード借用がスムーズです。
              選択キーの左隣＝下属調（IV）、右隣＝属調（V）、内外の同じ位置＝平行調。
            </li>
            <li>
              <strong>色の付いた扇形がダイアトニック</strong>：選択キーとその左右、および対応する
              内周の3つ——合計6つの「おとなりさん」が、そのキーのダイアトニックコードの主要メンバー
              です。キーが変わっても扇形の形は同じなので、「形」で覚えられます。
            </li>
          </ul>
          <p>
            例：C メジャーを選ぶと、C（I）の左に F（IV）、右に G（V）、内周に Am（VIm）・
            Dm（IIm）・Em（IIIm）が並び、T（トニック）・SD（サブドミナント）・D（ドミナント）の
            機能色で塗られます。
          </p>
        </section>

        <section>
          <h3>ダイアトニックコード表と機能</h3>
          <p>
            選んだキーの音階（スケール）の上に1つ飛ばしで音を重ねてできる7つのコードが
            「ダイアトニックコード」。表の<strong>機能</strong>列は曲の中での役割です：
          </p>
          <ul>
            <li>
              <span className="func-badge f-T">T</span> トニック＝安定・着地（I, IIIm, VIm）
            </li>
            <li>
              <span className="func-badge f-SD">SD</span> サブドミナント＝やや浮遊・展開（IIm, IV）
            </li>
            <li>
              <span className="func-badge f-D">D</span> ドミナント＝緊張 → トニックへ解決したがる
              （V, VIIm7♭5）
            </li>
          </ul>
          <p>
            <strong>回避</strong>列はアボイドノート（コードの上でメロディや
            テンションとして伸ばすと濁りやすい音。経過音として通るのは問題ありません）。
            V7 に含まれる<strong>トライトーン</strong>（3度と7度の間の増4度。例：G7 の B–F）が
            「解決したい」緊張を生み、これが T へ進む力の正体です。
          </p>
        </section>

        <section>
          <h3>指板・鍵盤ビュー</h3>
          <ul>
            <li>コード表のコード名をタップ → そのコードの構成音が指板と鍵盤に表示されます。</li>
            <li>「音名／度数」でラベルを切替。度数表示（R, ♭3, 5, ♭7…）は形で覚えるのに便利。</li>
            <li>
              「ポジション」で CAGED の5つのフレット窓に絞れます。C→A→G→E→D の5つの
              フォームの連なりで指板全体が埋まる、という見方です。
            </li>
          </ul>
        </section>

        <section>
          <h3>トライアドと転回形（インバージョン）</h3>
          <p>
            トライアドはルート（R）・3度・5度の3音でできた和音の最小単位。
            <strong>どの音を一番下（最低音）にするか</strong>で呼び名が変わります：
          </p>
          <ul>
            <li>
              <strong>基本形</strong>：R が最低音（下から R–3–5）
            </li>
            <li>
              <strong>第1転回形</strong>：3度が最低音（下から 3–5–R）
            </li>
            <li>
              <strong>第2転回形</strong>：5度が最低音（下から 5–R–3）
            </li>
          </ul>
          <p>
            ボイシングパネルの「トライアド」タブは、隣り合う3本の弦ごとに
            基本形→第1転回→第2転回の形を並べています。弦セットを1つ固定して、
            同じコードをネックに沿って3つの形で弾き上がる練習をすると、指板のどこでも
            コードが見えるようになります。Δ7 や 7th コードの伴奏でも、まずこの
            R-3-5 トライアドだけで十分機能します（m7♭5 にはディミニッシュトライアド）。
          </p>
        </section>

        <section>
          <h3>クローズとドロップ（drop 2 / drop 3）</h3>
          <p>
            4和音（例：Cmaj7 = C E G B）を1オクターブ以内にぎゅっと積んだ形を
            <strong>クローズボイシング</strong>と呼びます。ピアノなら簡単ですが、
            ギターでは指が届かないことが多いので、声部を1つ下げて広げます：
          </p>
          <ul>
            <li>
              <strong>ドロップ2</strong>：クローズの<strong>上から2番目</strong>の音を
              1オクターブ下げた形。ギターで最も使われる4和音の形（中4本・上4本の弦など）。
            </li>
            <li>
              <strong>ドロップ3</strong>：上から3番目を1オクターブ下げた形。
              6弦ルート＋飛び弦の形になりやすい。
            </li>
            <li>
              <strong>シェル</strong>：5度を省いて R・3度・7度だけにした省エネの形。
              コードの性格（メジャー/マイナー/セブンス）は 3度と7度が決めるので、
              これだけで響きは十分伝わります。
            </li>
          </ul>
          <p>
            「コードフォーム」タブのタグ（オープン／バレー／シェル／ドロップ2…）で
            絞り込めます。フォームを1つ選ぶと、他のフォームに「移動量」が表示されます。
            数字が小さいほど指も響きもスムーズにつながる（ボイスリーディングが良い）形です。
          </p>
        </section>

        <section>
          <h3>構成音の色分け</h3>
          <p className="role-legend">
            <span className="role-chip role-R">R ルート</span>
            <span className="role-chip role-3">3度</span>
            <span className="role-chip role-5">5度</span>
            <span className="role-chip role-7">7度</span>
          </p>
          <p>
            指板・鍵盤・ダイアグラムの丸は役割ごとに色分けされています。
            <strong>3度</strong>はメジャー/マイナーの性格、<strong>7度</strong>は
            セブンスの性格を決める大事な音。転回形を見分けるときは
            「一番下の色」に注目してください。
          </p>
        </section>

        <footer className="guide-footer">
          <button type="button" className="play-button" onClick={onClose}>
            閉じる
          </button>
        </footer>
      </div>
    </div>
  );
}
