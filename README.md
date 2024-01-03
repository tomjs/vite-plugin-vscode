# @tomjs/vite-plugin-vscode

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-vscode)](https://www.npmjs.com/package/@tomjs/vite-plugin-vscode) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-vscode) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-vscode) [![Docs](https://www.paka.dev/badges/v0/cute.svg)](https://www.paka.dev/npm/@tomjs/vite-plugin-vscode)

**English** | [中文](./README.zh_CN.md)

> The [vite](https://cn.vitejs.dev/) plugin for [vscode extension](https://code.visualstudio.com/api), supports `esm` and `cjs`.

Inject [@tomjs/vscode-extension-webview](https://github.com/tomjs/vscode-extension-webview) into vscode extension code and web client code, so that webview can support HMR during the development stage.

## Features

- Fast build `extension` with [tsup](https://github.com/egoist/tsup)
- Little configuration, focus on business
- Support `esm` and `cjs`
- Support webview `HMR`
- Support `vue` and `react` and other [frameworks](https://vitejs.dev/guide/#trying-vite-online) supported by `vite`

## Install

```bash
# pnpm
pnpm add @tomjs/vite-plugin-vscode -D

# yarn
yarn add @tomjs/vite-plugin-vscode -D

# npm
npm i @tomjs/vite-plugin-vscode --save-dev
```

If you use `pnpm` and enable `webview` debugging, you need to additionally install the dependency [@tomjs/vscode-extension-webview](https://github.com/tomjs/vscode-extension-webview)

```bash
pnpm add @tomjs/vscode-extension-webview -D
```

## Usage

### Recommended Agreement

#### Directory Structure

- Recommend `extension` and page `src` code directory structure

```
|--extension      // extension code
|  |--index.ts
|--src            // front-end code
|  |--App.vue
|  |--main.ts
```

- Zero configuration, default dist output directory

```
|--dist
|  |--extension
|  |  |--index.js
|  |  |--index.js.map
|  |--webview
|  |  |--index.html
```

#### Default configuration and behavior

See [PluginOptions](#pluginoptions) and `recommended` parameter descriptions in detail

### extension

code snippet, more code see examples

```ts
const panel = window.createWebviewPanel('showHelloWorld', 'Hello World', ViewColumn.One, {
  enableScripts: true,
  localResourceRoots: [Uri.joinPath(extensionUri, 'dist/webview')],
});
```

```ts
private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the Vue build output
    const stylesUri = getUri(webview, extensionUri, ['dist', 'webview', 'assets', 'index.css']);
    // The JS file from the Vue build output
    const scriptUri = getUri(webview, extensionUri, ['dist', 'webview', 'assets', 'index.js']);

    const nonce = uuid();

    if (process.env.VITE_DEV_SERVER_URL) {
      // @ts-ignore
      return __getWebviewHtml__({ serverUrl: process.env.VITE_DEV_SERVER_URL });
    }

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <script type="module" crossorigin nonce="${nonce}" src="${scriptUri}"></script>
          <link rel="stylesheet" crossorigin href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="app"></div>
        </body>
      </html>
    `;
  }
```

- `package.json`

```json
{
  "main": "dist/extension/index.js"
}
```

### vue

- `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import vscode from '@tomjs/vite-plugin-vscode';
import vue from '@vitejs/plugin-vue';

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
    vscode(),
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
```

### react

- `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import vscode from '@tomjs/vite-plugin-vscode';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vscode()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
```

## Documentation

- [API Documentation](https://paka.dev/npm/@tomjs/vite-plugin-vscode) provided by [paka.dev](https://paka.dev).
- [index.d.ts](https://www.unpkg.com/browse/@tomjs/vite-plugin-vscode/dist/index.d.ts) provided by [unpkg.com](https://www.unpkg.com).

## Parameters

### PluginOptions

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| recommended | `boolean` | `true` | This option is intended to provide recommended default parameters and behavior. |
| extension | [ExtensionOptions](#ExtensionOptions) |  | Configuration options for the vscode extension. |
| webview | `boolean` | `false` | Inject [@tomjs/vscode-extension-webview](https://github.com/tomjs/vscode-extension-webview) into vscode extension code and web client code, so that webview can support HMR during the development stage. |

**Notice**

The `recommended` option is used to set the default configuration and behavior, which can be used with almost zero configuration. The default is `true`. If you want to customize the configuration, set it to `false`. The following default prerequisites are to use the recommended [project structure](#directory-structure).

- The output directory is based on the `build.outDir` parameter of `vite`, and outputs `extension` and `src` to `dist/extension` and `dist/webview` respectively.
- Other behaviors to be implemented

### ExtensionOptions

Based on [Options](https://paka.dev/npm/tsup) of [tsup](https://tsup.egoist.dev/), some default values are added for ease of use.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| entry | `string` | `extension/index.ts` | The vscode extension entry file. |
| outDir | `string` | `dist-extension/main` | The output directory for the vscode extension file |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined` | A function that will be executed after the build succeeds. |

### Additional Information

- Default values for `extension` when the relevant parameters are not configured

| Parameter | Development Mode Default | Production Mode Default |
| --------- | ------------------------ | ----------------------- |
| sourcemap | `true`                   | `false`                 |
| minify    | `false`                  | `true`                  |

## Environment Variables

### Vite plugin variables

`vscode extension` use.

- `development` mode

| Variable              | Description                     |
| --------------------- | ------------------------------- |
| `VITE_DEV_SERVER_URL` | The url of the vite dev server. |

- `production` mode

| Variable | Description |
| --- | --- |
| `VITE_DIST_FILES` | All js files in the dist directory, excluding index.js. It's to be a json string. |

## Debug

Run `Debug Extension` through `vscode` to debug. For debugging tools, refer to [Official Documentation](https://code.visualstudio.com/docs/editor/debugging)

`launch.json` is configured as follows:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/dist/extension/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

`tasks.json` is configured as follows:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "npm",
      "script": "dev",
      "problemMatcher": {
        "owner": "typescript",
        "fileLocation": "relative",
        "pattern": {
          "regexp": "^([a-zA-Z]\\:/?([\\w\\-]/?)+\\.\\w+):(\\d+):(\\d+): (ERROR|WARNING)\\: (.*)$",
          "file": 1,
          "line": 3,
          "column": 4,
          "code": 5,
          "message": 6
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "^.*extension build start*$",
          "endsPattern": "^.*extension (build|rebuild) success.*$"
        }
      },
      "isBackground": true,
      "presentation": {
        "reveal": "never"
      },
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

## Examples

First execute the following command to install dependencies and generate library files:

```bash
pnpm install
pnpm build
```

Open the [examples](./examples) directory, there are `vue` and `react` examples.

- [react](./examples/react): simple react example.
- [vue](./examples/vue): simple vue example.
- [vue-import](./examples/vue-import): dynamic import() example.
