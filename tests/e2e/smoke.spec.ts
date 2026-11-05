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

test('マイナーキーでスケール種別を切り替えられる', async ({ page }) => {
  await page.goto('/?key=A&mode=minor&chords=7th');
  const table = page.getByRole('table', { name: 'ダイアトニックコード表' });
  await expect(table).toContainText('G7');
  await page.getByRole('radio', { name: 'ハーモニック' }).click();
  await expect(table).toContainText('G♯dim7');
  await expect(page).toHaveURL(/minor=harmonic/);
});
