import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolve(pathname) {
    return path.resolve(__dirname, pathname);
}

export default {
    patootie: {
        manifest: {
            permissions: [
                "alarms",
                "activeTab",
                "webNavigation",
                "storage"
            ],
        },
        vite: () => ({
            resolve: {
                alias: {
                    "~@common": resolve("./src/common/"),
                    "~@content": resolve("./src/scripts/content/"),
                    "~@popup": resolve("./src/apps/popup/"),
                    "~@utils": resolve("./src/utils/"),
                    "~@static": resolve("./static/"),
                },
            },
        }),
    },
};
