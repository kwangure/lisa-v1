const config = require("@kwangure/eslint-config-svelte");
const path = require("path");

config.globals = {
    ...config.globals,
    chrome: false,
};

config.rules["max-len"] = ["error", {
    code: 100, // xState objects are painful without this
    ignoreComments: true,
}];
config.rules["id-denylist"] = config
    .rules["id-denylist"]
    .filter((r) => r !== "data");

config.plugins.push("import");
config.plugins = [...(new Set(config.plugins))];

config.settings = {
    ...config.settings,
    "import/resolver": {
        alias: {
            map: [
                ["~@phase_ui", path.resolve(__dirname, "./src/common/phase_ui")],
                ["~@common", path.resolve(__dirname, "./src/common/")],
                ["~@content", path.resolve(__dirname, "./src/content/")],
                ["~@popup", path.resolve(__dirname, "./src/popup/")],
                ["~@utils", path.resolve(__dirname, "./src/utils/")],
            ],
            extensions: [".js", ".svelte", ".json"],
        },
    },
};

module.exports = config;
