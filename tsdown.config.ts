import { defineConfig } from 'tsdown';

export default defineConfig(() => {
  return [
    {
      entry: ['src/index.ts'],
      format: ['esm'],
      target: ['node20'],
      external: ['vite'],
      shims: true,
      clean: false,
      dts: true,
      publint: true,
      splitting: true,
    },
    {
      entry: ['src/webview/webview.ts'],
      format: ['esm'],
      target: ['node20'],
      shims: true,
      clean: false,
      dts: true,
      splitting: true,
      publint: true,
      loader: {
        '.html': 'text',
      },
    },
    {
      entry: ['src/webview/client.ts'],
      format: ['iife'],
      target: ['chrome89'],
      platform: 'browser',
      clean: false,
      dts: false,
    },
  ];
});
