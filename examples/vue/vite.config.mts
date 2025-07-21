import vscode from '@tomjs/vite-plugin-vscode';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag.startsWith('vscode-'),
        },
      },
    }),
    vscode({
      webview: {
        // csp: '<meta http-equiv="Content-Security-Policy" />',
      },
    }),
  ],
});
