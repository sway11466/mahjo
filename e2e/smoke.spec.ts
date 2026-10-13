import { test, expect, type Page } from '@playwright/test';

// 通しの1本（testing.md §5）：LP → アプリ → 役モードで8問 → 結果 → スタートへ。
// 出題はランダムなので、手の中身・正誤には依存しない（どれを選んでも通る書き方）。
// ヒント・解説の中身やハイライトの対応は UI 単体／Small テストの担当で、ここでは
// 「実ブラウザで画面がつながる・入口とアセットの URL が生きている」ことだけを見る。

const SESSION_LENGTH = 8;

/** 局の表示（東1局〜南4局）。index は 0–7 */
function roundLabel(index: number): string {
  return `${index < 4 ? '東' : '南'}${(index % 4) + 1}局`;
}

/** 画像が読み込めている（壊れた画像でない） */
async function expectImageLoaded(page: Page, selector: string) {
  const img = page.locator(selector).first();
  await expect(img).toBeVisible();
  await expect
    .poll(() => img.evaluate((el) => (el as { naturalWidth: number }).naturalWidth))
    .toBeGreaterThan(0);
}

test('LP からアプリに入り、役モードの8問を通して結果まで進める @smoke', async ({ page }) => {
  // 8問の通しは長い（回答ごとの答え合わせの溜め等）ので、既定の 30 秒では足りない。
  test.setTimeout(120_000);

  // 外部への通信（GTM 等）は遮断する。計測を汚さず、外部要因で不安定にしないため。
  const origin = new URL(test.info().project.use.baseURL!).origin;
  await page.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );

  // 同一オリジンで 4xx/5xx になった取得（入口・アセットのパス切れ）と、ページ内の例外を集める。
  const failed: string[] = [];
  page.on('response', (res) => {
    if (new URL(res.url()).origin === origin && res.status() >= 400) {
      failed.push(`${res.status()} ${res.url()}`);
    }
  });
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  // LP → アプリ
  await page.goto('./');
  await page.getByRole('link', { name: 'ゲームを始める' }).first().click();
  await expect(page).toHaveURL(/app\.html$/);

  // スタート画面 → 役モード
  const menu = page.getByRole('navigation', { name: 'メニュー' });
  await expectImageLoaded(page, '.cscreen__standee');
  await menu.getByRole('button', { name: '練習開始' }).click();
  await menu.getByRole('button', { name: '役モード' }).click();

  // あいさつ → 1問目
  await page.getByRole('button', { name: 'はじめる' }).click();
  await expectImageLoaded(page, '.stage__avatar-img');

  const board = page.getByRole('region', { name: '場の情報' });
  const choices = page.getByRole('group', { name: '回答の選択肢' }).getByRole('button');
  const line = page.locator('.stage__line');

  for (let i = 0; i < SESSION_LENGTH; i++) {
    await expect(board).toContainText(roundLabel(i));
    await expect(page.getByRole('list', { name: '手牌' })).toBeVisible();
    await expect(choices).toHaveCount(4);

    // 1問目だけ：ヒントを1段開くとセリフが変わる
    if (i === 0) {
      const before = await line.textContent();
      await page.getByRole('button', { name: 'ヒント' }).click();
      await expect(line).not.toHaveText(before ?? '');
    }

    // どれか1つ選ぶ → 少し置いて正誤が開示される（正解の選択肢に印が付く）
    await choices.first().click();
    await expect(
      page.getByRole('group', { name: '回答の選択肢' }).getByRole('button', { name: /（正解）$/ }),
    ).toBeVisible();

    const advance = i === SESSION_LENGTH - 1 ? '結果を見る' : '次の設問へ';

    // 1問目だけ：解説を最後まで送る（内訳バッジが出る）
    if (i === 0) {
      await page.getByRole('button', { name: '解説を見る' }).click();
      await expect(page.getByLabel('ここまでの内訳')).toBeVisible();
      const next = page.getByRole('button', { name: '次へ', exact: true });
      while (await next.isVisible()) await next.click();
    }

    await page.getByRole('button', { name: advance }).click();
  }

  // 結果 → スタートへ
  await expect(page.getByText(new RegExp(`${SESSION_LENGTH}問中 \\d+問正解`))).toBeVisible();
  await page.getByRole('button', { name: 'スタートへ' }).click();
  await expect(menu.getByRole('button', { name: '練習開始' })).toBeVisible();

  expect(failed).toEqual([]);
  expect(pageErrors).toEqual([]);
});
