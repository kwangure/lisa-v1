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
    const width = 1280;
    const height = 800;
    const puppeteerOptions ={
        defaultViewport: { width, height },
        headless: false,
        ignoreDefaultArgs: ["--disable-extensions"],
        args: [
            "--start-maximized",
            `--load-extension=${extPath}`,
            `--window-size=${width},${height}`,
        ],
    };

    const browser = await puppeteer.launch(puppeteerOptions);
    const [page] = await browser.pages();

    const extensionManifest = getExtensionManifest(extPath);
    const { name: extensionName } = extensionManifest;
    const extensionID = await getExtensionId(browser, extensionName);

    await snapUrls({
        screenshotDir: screenshotDir,
        page: page,
        urls: [
            { url: "https://google.com/search?q=define+focus&aqs=chrome.0.69i59j69i57.1731j0j9" },
            {
                url: "https://google.com/search?q=define+focus&aqs=chrome.0.69i59j69i57.1731j0j9",
                beforeSnap: async (page) => {
                    await page.evaluate(() => {
                        document.body.insertAdjacentHTML(
                            "beforeEnd",
                            "<div style=\"width: 100%;\
                                height: 100vh;\
                                background: linear-gradient(155deg, black, transparent 95%);\
                                position: absolute;\
                                z-index: 200;\
                                opacity: 0.8;\
                                top: 0; left: 0;\">\
                            </div>"
                        );
                    });

                    await page.evaluate(() => {
                        document.querySelector("body > lisa-timer")
                            .shadowRoot.querySelector("div.content button")
                            .click();
                    });
                },
            },
            { url: `chrome-extension://${extensionID}/options/index.html` },
        ],
    });

    await browser.close();
}
