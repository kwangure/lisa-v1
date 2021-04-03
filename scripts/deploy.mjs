import { fileURLToPath } from "url";
import fs from "fs-extra";
import path from "path";
import { screenshot } from "./screenshot.mjs";
import { zip } from "./zip.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../");
const build = path.join(root, "build");
const dist = path.join(root, "dist");
fs.emptyDirSync(dist);
fs.ensureDir(dist);

const zipPath = path.join(dist, "package.zip");
zip(build, zipPath);

const screenshotDir = path.join(dist, "screenshots");
fs.ensureDir(screenshotDir);
screenshot(build, screenshotDir);
