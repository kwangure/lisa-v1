const config = require("@kwangure/eslint-config-svelte");

// Work around https://github.com/babel/babel/issues/12985
delete config.rules["template-curly-spacing"];
delete config.rules["indent"];

module.exports = config;