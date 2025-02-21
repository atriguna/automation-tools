import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { expect } from '@playwright/test';

export async function POST(req: Request) {
    try {
        const { url, steps, headless } = await req.json();
        const sessionId = uuidv4();
        const folderPath = path.join(process.cwd(), 'public/screenshots', sessionId);
        
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const browser = await chromium.launch({ headless });
        const page = await browser.newPage();
        const stepResults: any[] = [];

        const cleanXPath = (xpath: string) => xpath.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

        try {
            await page.goto(url);
            await page.waitForLoadState('networkidle');

            for (let i = 0; i < steps.length; i++) {
                const { action, xpath, value } = steps[i];
                try {
                    switch (action) {
                        case 'click':
                            const button = page.locator(`xpath=${xpath}`);
                            await expect(button).toBeVisible();
                            await button.click();
                            break;
                        case 'fill':
                            const input = page.locator(`xpath=${xpath}`);
                            await expect(input).toBeVisible();
                            await input.fill(value);
                            break;
                        case 'wait':
                            await page.waitForSelector(`xpath=${xpath}`, { timeout: parseInt(value) || 5000 });
                            break;
                        case 'validate':
                            const cleanXpath = cleanXPath(xpath);
                            const expected = page.locator(`xpath=${cleanXpath}`);
                            if (value) {
                                await expect(expected).toContainText(value);
                            } else {
                                await expect(expected).toBeVisible();
                            }
                            break;
                        case 'assert-url':
                            await expect(page).toHaveURL(value);
                            break;
                        case 'select':
                            const dropdown = page.locator(`xpath=${xpath}`);
                            await expect(dropdown).toBeVisible();
                            await dropdown.selectOption({ label: value });
                            break;
                        case 'scroll':
                            await page.locator(`xpath=${xpath}`).scrollIntoViewIfNeeded();
                            break;
                             
                        default:
                            throw new Error(`Unknown action: ${action}`);
                    }

                    const screenshotPath = path.join(folderPath, `step-${i + 1}.png`);
                    await page.screenshot({ path: screenshotPath });

                    stepResults.push({
                        action,
                        xpath,
                        value,
                        status: 'sukses',
                        screenshotUrl: `/screenshots/${sessionId}/step-${i + 1}.png`,
                    });
                } catch (stepError: any) {
                    const screenshotPath = path.join(folderPath, `step-${i + 1}-error.png`);
                    await page.screenshot({ path: screenshotPath });

                    stepResults.push({
                        action,
                        xpath,
                        value,
                        status: 'gagal',
                        error: stepError.message,
                        screenshotUrl: `/screenshots/${sessionId}/step-${i + 1}-error.png`,
                    });
                }
            }

            const resultHtml = `
                <html>
                    <body>
                        <h1>Automation Report</h1>
                        <p>URL: ${url}</p>
                        ${stepResults.map((step, index) => `
                            <div>
                                <p><strong>Step ${index + 1}:</strong> ${step.action} - ${step.xpath} - <span style="color: ${step.status === 'sukses' ? 'green' : 'red'};">${step.status}</span></p>
                                ${step.error ? `<p style="color: red;">Error: ${step.error}</p>` : ''}
                                <img src="${step.screenshotUrl}" width="300" />
                            </div>
                        `).join('')}
                    </body>
                </html>
            `;
            fs.writeFileSync(path.join(folderPath, 'result.html'), resultHtml);

            return NextResponse.json({
                status: 'success',
                message: 'Automation completed!',
                reportUrl: `/screenshots/${sessionId}/result.html`,
                stepResults,
            });

        } finally {
            await browser.close();
        }

    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
