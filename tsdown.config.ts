import { defineConfig } from 'tsdown';

export default defineConfig((options) => {
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
      fixedExtension: false,
    },
    {
      entry: ['src/webview/webview.ts'],
      format: ['esm'],
      target: ['node18.19'],
      shims: true,
      clean: false,
      dts: true,
      publint: true,
      minify: !options.watch,
      loader: {
        '.html': 'text',
      },
      fixedExtension: false,
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
