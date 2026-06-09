import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  {
    label: 'desktop',
    context: {
      viewport: { width: 1440, height: 900 },
      isMobile: false,
      hasTouch: false,
    },
  },
  {
    label: 'mobile',
    context: {
      viewport: { width: 393, height: 851 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    },
  },
] as const;

test('captures styled component screenshots with mocked data', async ({ browser, baseURL }, testInfo) => {
  const url = `${baseURL ?? 'http://localhost:4173'}/?visualTest=1`;

  for (const item of VIEWPORTS) {
    const context = await browser.newContext({
      ...item.context,
      permissions: ['camera'],
    });
    const page = await context.newPage();

    await page.goto(url);
    await expect(page.getByTestId('visual-test-root')).toBeVisible();

    const screenshotPath = testInfo.outputPath(`visual-components-${item.label}.png`);
    const image = await page.screenshot({ path: screenshotPath, fullPage: true });
    expect(image.byteLength).toBeGreaterThan(1000);

    await context.close();
  }
});
