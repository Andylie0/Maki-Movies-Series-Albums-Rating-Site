import { test, expect } from '@playwright/test';

test('should display welcome message', async ({ page }) => {
        await page.goto(`https://localhost:5173/`)
        await expect(page.getByText('Welcome to Maki!')).toBeVisible()
    })

test.describe('Authenticated Journal Actions', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`FRONTEND LOG: ${msg.text()}`));
        await page.goto('https://localhost:5173/');

        await page.fill('input[placeholder*="username" i]', 'system_admin');
        await page.fill('input[placeholder*="password" i]', '1');

        await page.click('button.login-button');

        await page.waitForURL('**/journal*');
    });

    test('delete an item', async ({ page }) =>
    {
        await page.goto(`https://localhost:5173/journal`)
        const rows = await page.locator('.table-row')
        const initialCount = await rows.count()
        await rows.locator('.delete-button').first().click()
        await rows.locator('.delete-button').first().click()
        await expect(rows).toHaveCount(initialCount - 1)
    })

    test('search filters movies', async ({ page }) => {
        await page.goto(`https://localhost:5173/journal`)
        await page.fill('.page-input', 'Matrix')
        const rows = await page.locator('.table-row')
        await expect(rows).toHaveCount(1)
    })
})
