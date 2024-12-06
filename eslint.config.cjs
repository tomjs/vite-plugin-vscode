const eslint = require('@tomjs/eslint');

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = [
  ...eslint.configs.node.map(s => ({
    ...s,
    ignores: ['src/webview/client.ts'],
  })),
  ...eslint.configs.browser.map(s => ({
    ...s,
    ignores: ['src/webview/client.ts'],
  })),
];
