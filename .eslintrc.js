module.exports = {
    "env": {
        "browser": true,
        "es6": true,
    },
    "plugins": [
        "svelte3",
    ],
    "extends": [
        "eslint:recommended",
    ],
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module",
        "ecmaFeatures": {
            "modules": true,
        }
    },
    "overrides": [
        {
            "files": ['**/*.svelte'],
            "processor": 'svelte3/svelte3'
        }
    ],
    "settings": {
        "svelte3/ignore-styles": () => true,

    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "comma-dangle": ["error", "always-multiline"],
        "no-trailing-spaces": "error",
    }
};