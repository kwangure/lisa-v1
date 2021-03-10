const config = require("@kwangure/eslint-config-svelte");

// Work around `@babel/core^7.13.0`
delete config.rules["template-curly-spacing"];
delete config.rules["indent"];

module.exports = config;