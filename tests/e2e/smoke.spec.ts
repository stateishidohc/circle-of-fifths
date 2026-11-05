import { expect, test } from '@playwright/test';

test('初期表示は C メジャーのダイアトニック', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '5度圏' })).toBeVisible();
  const table = page.getByRole('table', { name: 'ダイアトニックコード表' });
  await expect(table).toBeVisible();
  await expect(table.locator('tbody tr')).toHaveCount(7);
  await expect(table).toContainText('Bdim');
});

test('5度圏のキーをタップするとコード表が切り替わる', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'E♭ メジャー（3♭）' }).click();
  const table = page.getByRole('table', { name: 'ダイアトニックコード表' });
  await expect(table).toContainText('A♭');
  await expect(page).toHaveURL(/key=Eb/);
});

test('URL から状態が再現される', async ({ page }) => {
  await page.goto('/?key=F%23&mode=major&view=diatonic&chords=7th');
  const table = page.getByRole('table', { name: 'ダイアトニックコード表' });
  await expect(table).toContainText('E♯m7♭5');
});

test('コードをタップすると指板・鍵盤にコードトーンが表示される', async ({ page }) => {
  await page.goto('/?key=C&mode=major&chords=7th');
  await page.getByRole('button', { name: 'G7 を指板と鍵盤に表示' }).click();
  await expect(page.getByRole('heading', { name: /コードトーン: V7/ })).toBeVisible();
  await expect(page).toHaveURL(/chord=5/);
  await page.getByRole('button', { name: 'スケール表示に戻す' }).click();
  await expect(page.getByRole('heading', { name: /C メジャー（イオニアン）/ })).toBeVisible();
});

test('スケール選択とポジション絞り込みが URL に反映される', async ({ page }) => {
  await page.goto('/?key=A&mode=minor&scale=blues&labels=degree&pos=E');
  await expect(page.getByRole('heading', { name: 'A ブルース' })).toBeVisible();
  await expect(page.getByLabel('スケール', { exact: true })).toHaveValue('blues');
  await expect(page.getByLabel('ポジション', { exact: true })).toHaveValue('E');
  await expect(page.getByRole('img', { name: /ギター指板/ })).toBeVisible();
  await expect(page.getByRole('img', { name: '鍵盤（2オクターブ）' })).toBeVisible();
});

test('近親調チップでキーを切り替えられる', async ({ page }) => {
  await page.goto('/?key=C&mode=major');
  await page.getByRole('button', { name: '平行調 Am に切り替え' }).click();
  await expect(page).toHaveURL(/key=A&mode=minor/);
  const table = page.getByRole('table', { name: 'ダイアトニックコード表' });
  await expect(table).toContainText('Bdim');
});

test('セカンダリードミナントのプレビューとトライトーン・アボイド表示', async ({ page }) => {
  await page.goto('/?key=C&mode=major');
  await page.getByRole('button', { name: /V7\/II/ }).first().click();
  await expect(page.getByRole('heading', { name: /コードトーン: V7\/II（A7）/ })).toBeVisible();
  await expect(page.getByText(/トライトーン: C♯–G/)).toBeVisible();
  // ダイアトニック表のアボイド列（Imaj7 の行に F）
  await page.goto('/?key=C&mode=major&chords=7th');
  const row = page.getByRole('row', { name: /Imaj7/ });
  await expect(row).toContainText('F');
});

test('スケール再生ボタンで再生が始まり停止できる', async ({ page }) => {
  await page.goto('/?key=C&mode=major');
  await page.getByRole('button', { name: '♪ スケール再生（上行・下行）' }).click();
  const stop = page.getByRole('button', { name: '■ 停止' });
  await expect(stop).toBeVisible();
  await stop.click();
  await expect(stop).not.toBeVisible();
});

test('マイナーキーでスケール種別を切り替えられる', async ({ page }) => {
  await page.goto('/?key=A&mode=minor&chords=7th');
  const table = page.getByRole('table', { name: 'ダイアトニックコード表' });
  await expect(table).toContainText('G7');
  await page.getByRole('radio', { name: 'ハーモニック' }).click();
  await expect(table).toContainText('G♯dim7');
  await expect(page).toHaveURL(/minor=harmonic/);
});
