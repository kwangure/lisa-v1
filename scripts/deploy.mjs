import { fileURLToPath } from "url";
import path from "path";
import { zip } from "./zip.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../");

zip("dist/", `${root}/dist.zip`);
