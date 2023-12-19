import { defineConfig } from 'tsup';
import pkg from './package.json';

export default defineConfig(options => {
  return {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    target: ['es2021', 'node16'],
    external: ['vite'].concat(Object.keys(pkg.dependencies || {})),
    clean: !!options.watch,
    dts: true,
    splitting: true,
  };
});
