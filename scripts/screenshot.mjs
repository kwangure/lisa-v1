import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import puppeteer from "puppeteer";

async function snapUrls(options) {
    const { page, screenshotDir, urls = []} = options;

    for (const [i, options] of Object.entries(urls)) {
        const { url, beforeSnap = () => {} } = options;
        await page.goto(url, { waitUntil: "load" });
        await beforeSnap(page);
        const start = performance.now();
        await page.screenshot({
            path: `${screenshotDir}/screenshot-${i}.png`,
        });
        const stop = performance.now();
        console.log("screenshot", i, "took", (stop - start)/1000, "secs");
    }
}

function getExtensionManifest(extensionPath) {
    const manifestPath = path.join(extensionPath, "manifest.json");
    const manifestString = fs.readFileSync(manifestPath);
    return JSON.parse(manifestString);
}

async function getExtensionId(browser, extensionName) {
    const targets = await browser.targets();
    const extensionTarget = targets.find(({ _targetInfo }) => _targetInfo.title === extensionName
        && _targetInfo.type === "background_page");
    const extensionURL = extensionTarget._targetInfo.url;
    const chromeExtRegex = /(?:chrome-extension:\/\/)(?<extensionID>\w+)\//u;
    const { groups } = chromeExtRegex.exec(extensionURL);
    const { extensionID } = groups;

    return extensionID;
}

export async function screenshot(extPath, screenshotDir) {
    const width = 960;
    const height = 600;
    const puppeteerOptions ={
        defaultViewport: { width, height },
        headless: false,
        ignoreDefaultArgs: ["--disable-extensions"],
        args: [
            "--start-maximized",
            `--load-extension=${extPath}`,
            `--window-size=${width},${height}`,
            "--force-device-scale-factor=1.33333",
        ],
    };

    const browser = await puppeteer.launch(puppeteerOptions);
    const [page] = await browser.pages();
    /* Makes resolution 1280 * 800 */
    const deviceScaleFactor = 1.3333;
    await page.setViewport({ width, height, deviceScaleFactor });

    const extensionManifest = getExtensionManifest(extPath);
    const { name: extensionName } = extensionManifest;
    const extensionID = await getExtensionId(browser, extensionName);
    const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

    await snapUrls({
        screenshotDir: screenshotDir,
        page: page,
        urls: [
            { url: "https://google.com/search?q=define+focus&aqs=chrome.0.69i59j69i57.1731j0j9" },
            {
                url: "https://google.com/search?q=define+focus&aqs=chrome.0.69i59j69i57.1731j0j9",
                beforeSnap: async (page) => {
                    await page.evaluate(() => {
                        document.querySelector("body > lisa-timer")
                            .shadowRoot.querySelector("div.content button")
                            .click();
                    });

                    await delay(1000);
                },
            },
            {
                url: `chrome-extension://${extensionID}/options/index.html`,
                beforeSnap: async () => {
                    await delay(1000);
                },
            },
        ],
    });

    await browser.close();
}
