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

test('マイナーキーでスケール種別を切り替えられる', async ({ page }) => {
  await page.goto('/?key=A&mode=minor&chords=7th');
  const table = page.getByRole('table', { name: 'ダイアトニックコード表' });
  await expect(table).toContainText('G7');
  await page.getByRole('radio', { name: 'ハーモニック' }).click();
  await expect(table).toContainText('G♯dim7');
  await expect(page).toHaveURL(/minor=harmonic/);
});
