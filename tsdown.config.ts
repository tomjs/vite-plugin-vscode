import { defineConfig } from 'tsdown';

export default defineConfig(() => {
  return [
    {
      entry: ['src/index.ts'],
      format: ['esm'],
      target: ['node18.19'],
      external: ['vite'],
      shims: true,
      clean: false,
      dts: true,
      publint: true,
    },
    {
      entry: ['src/webview/webview.ts'],
      format: ['esm'],
      target: ['node18.19'],
      shims: true,
      clean: false,
      dts: true,
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
