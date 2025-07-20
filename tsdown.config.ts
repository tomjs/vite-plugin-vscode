import { defineConfig } from 'tsdown';

export default defineConfig(() => {
  return [
    {
      entry: ['src/index.ts'],
      format: ['esm', 'cjs'],
      target: ['es2021', 'node16'],
      external: ['vite'],
      shims: true,
      clean: false,
      dts: true,
      splitting: true,
    },
    {
      entry: ['src/webview/webview.ts'],
      format: ['esm', 'cjs'],
      target: ['es2020', 'node14'],
      shims: true,
      clean: false,
      dts: true,
      splitting: true,
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
