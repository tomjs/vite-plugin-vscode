import { defineConfig } from '@tomjs/eslint';

export default defineConfig({
  rules: {
    'no-console': 'off',
    'n/prefer-global/process': 'off',
  },
});
