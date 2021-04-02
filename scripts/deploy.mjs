import { fileURLToPath } from "url";
import path from "path";
import { zip } from "./zip.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "../", "dist");

zip("build/", `${dist}/package.zip`);
