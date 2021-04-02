import { fileURLToPath } from "url";
import fs from "fs-extra";
import path from "path";
import { zip } from "./zip.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "../", "dist");

fs.ensureDirSync(dist);
fs.emptyDirSync(dist);
zip("build/", `${dist}/package.zip`);
