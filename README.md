# @tomjs/vite-plugin-vscode

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-vscode)](https://www.npmjs.com/package/@tomjs/vite-plugin-vscode) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-vscode) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-vscode) [![Docs](https://www.paka.dev/badges/v0/cute.svg)](https://www.paka.dev/npm/@tomjs/vite-plugin-vscode)

**English** | [中文](./README.zh_CN.md)

> Use `vue`/`react` to develop [vscode extension webview](https://code.visualstudio.com/api/references/vscode-api#WebviewPanel), supporting `esm` and `cjs`.

In development mode, inject the code of [@tomjs/vscode-extension-webview](https://github.com/tomjs/vscode-extension-webview) into `vscode extension code` and `web page code`, use To support `HMR`; during production build, the final generated `index.html` code is injected into `vscode extension code` to reduce the workload.

## Features

- Use [tsup](https://github.com/egoist/tsup) to quickly build `extension code`
- Simple configuration, focus on business
- Support `esm` and `cjs`
- Support webview `HMR`
- Support [Multi-Page App](https://vitejs.dev/guide/build.html#multi-page-app)
- Supports `vue` and `react` and other [frameworks](https://cn.vitejs.dev/guide/#trying-vite-online) supported by `vite`

## Install

```bash
# pnpm
pnpm add @tomjs/vite-plugin-vscode -D

# yarn
yarn add @tomjs/vite-plugin-vscode -D

# npm
npm i @tomjs/vite-plugin-vscode --save-dev
```

## Usage

### Recommended

Setting `recommended` will modify some preset configurations. See [PluginOptions](#pluginoptions) and `recommended` parameter descriptions in detail.

#### Directory Structure

- By default, `recommended:true` will be based on the following directory structure as a convention.

```
|--extension      // extension code
|  |--index.ts
|--src            // front-end code
|  |--App.vue
|  |--main.ts
|--index.html
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

- If you want to modify the `extension` source code directory to `src`, you can set `{ extension: { entry: 'src/index.ts' } }`

```
|--src            // extension code
|  |--index.ts
|--webview        // front-end code
|  |--App.vue
|  |--main.ts
|--index.html
```

### extension

code snippet, more code see examples

```ts
const panel = window.createWebviewPanel('showHelloWorld', 'Hello World', ViewColumn.One, {
  enableScripts: true,
  localResourceRoots: [Uri.joinPath(extensionUri, 'dist/webview')],
});

// Vite development mode and production mode inject different webview codes to reduce development work
panel.webview.html = process.env.VITE_DEV_SERVER_URL
  ? __getWebviewHtml__(process.env.VITE_DEV_SERVER_URL)
  : __getWebviewHtml__(webview, context);
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
    // Modify the extension source code entry path, and also modify the `index.html` entry file path
    // vscode({ extension: { entry: 'src/index.ts' } }),
  ],
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
});
```

### Multi-page application

See [vue-import](./examples/vue-import) example

- `vite.config.ts`

```ts
import path from 'node:path';
import vscode from '@tomjs/vite-plugin-vscode';

export default defineConfig({
  build: {
    plugins: [vscode()]
    rollupOptions: {
      // https://cn.vitejs.dev/guide/build.html#multi-page-app
      input: [path.resolve(__dirname, 'index.html'), path.resolve(__dirname, 'index2.html')],
      // You can also customize the name
      // input:{
      //   'index': path.resolve(__dirname, 'index.html'),
      //   'index2': path.resolve(__dirname, 'index2.html'),
      // }
    },
  },
});
```

- page one

```ts
process.env.VITE_DEV_SERVER_URL
  ? __getWebviewHtml__(process.env.VITE_DEV_SERVER_URL)
  : __getWebviewHtml__(webview, context);
```

- page two

```ts
process.env.VITE_DEV_SERVER_URL
  ? __getWebviewHtml__(`${process.env.VITE_DEV_SERVER_URL}/index2.html`)
  : __getWebviewHtml__(webview, context, 'index2');
```

**getWebviewHtml** Description

```ts
/**
 *  `[vite serve]` Gets the html of webview in development mode.
 * @param options serverUrl: The url of the vite dev server.
 */
function __getWebviewHtml__(options?: string | { serverUrl: string }): string;

/**
 *  `[vite build]` Gets the html of webview in production mode.
 * @param webview The WebviewPanel instance of the extension.
 * @param context The ExtensionContext instance of the extension.
 * @param inputName vite build.rollupOptions.input name. Default is `index`.
 */
function __getWebviewHtml__(
  webview: Webview,
  context: ExtensionContext,
  inputName?: string,
): string;
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

| Variable              | Description                    |
| --------------------- | ------------------------------ |
| `VITE_DEV_SERVER_URL` | The url of the vite dev server |

- `production` mode

| Variable            | Description                   |
| ------------------- | ----------------------------- |
| `VITE_WEBVIEW_DIST` | vite webview page output path |

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
      "preLaunchTask": "npm: dev"
    },
    {
      "name": "Preview Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/dist/extension/*.js"],
      "preLaunchTask": "npm: build"
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
    },
    {
      "type": "npm",
      "script": "build",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "problemMatcher": []
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

- [react](./examples/react): Simple react example.
- [vue](./examples/vue): Simple vue example.
- [vue-import](./examples/vue-import): Dynamic import() and multi-page examples.
