module.exports = {
    globals: {
        chrome: false,
    },
    extends: [
        "@kwangure/eslint-config-svelte",
    ],
    plugins: [
        "import",
    ],
    settings: {
        "import/resolver": {
            alias: {
                map: [
                    ["~@phase_ui", "./src/common/phase_ui"],
                    ["~@common", "./src/common/"],
                    ["~@content", "./src/content/"],
                    ["~@popup", "./src/popup/"],
                    ["~@utils", "./src/utils/"],
                ],
                extensions: [".js", ".svelte", ".json"],
            },
        },
    },
    rules: {
        "max-len": ["error", {
            code: 100, // xState objects are painful without this
            ignoreComments: true,
        }],
        "id-denylist": ["error", "err", "e", "cb", "callback"],
    },
};
