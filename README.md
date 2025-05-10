# @tomjs/vite-plugin-vscode

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-vscode)](https://www.npmjs.com/package/@tomjs/vite-plugin-vscode) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-vscode) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-vscode) [![jsDocs.io](https://img.shields.io/badge/jsDocs.io-reference-blue)](https://www.jsdocs.io/package/@tomjs/vite-plugin-vscode)

**English** | [中文](./README.zh_CN.md)

> Use `vue`/`react` to develop [vscode extension webview](https://code.visualstudio.com/api/references/vscode-api#WebviewPanel), supporting `esm` and `cjs`.

In development mode, inject the same code of [@tomjs/vscode-extension-webview](https://github.com/tomjs/vscode-extension-webview) into `vscode extension code` and `web page code`, use To support `HMR`; during production build, the final generated `index.html` code is injected into `vscode extension code` to reduce the workload.

## Features

- Use [tsup](https://github.com/egoist/tsup) to quickly build `extension code`
- Simple configuration, focus on business
- Support `esm` and `cjs`
- Support ESM extension (vscode `v1.100.0+`)
- Support webview `HMR`
- Support `acquireVsCodeApi` of [@types/vscode-webview](https://www.npmjs.com/package/@types/vscode-webview)
- Support [Multi-Page App](https://vitejs.dev/guide/build.html#multi-page-app)
- Supports `vue` and `react` and other [frameworks](https://cn.vitejs.dev/guide/#trying-vite-online) supported by `vite`

### ESM extension

The NodeJS extension host now (`v1.100.0+`) supports extensions that use JavaScript-modules (ESM). All it needs is the `"type": "module"` entry in your extension's `package.json` file. With that, the JavaScript code can use `import` and `export` statements, including the special module `import('vscode')`.

## Install

```bash
# pnpm
pnpm add @tomjs/vite-plugin-vscode -D

# yarn
yarn add @tomjs/vite-plugin-vscode -D

# npm
npm i @tomjs/vite-plugin-vscode -D
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
panel.webview.html = __getWebviewHtml__({
  // vite dev mode
  serverUrl: process.env.VITE_DEV_SERVER_URL,
  // vite prod mode
  webview,
  context,
  inputName: 'index',
  injectCode: `<script>window.__FLAG1__=666;window.__FLAG2__=888;</script>`,
});
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

### **getWebviewHtml**

See [vue-import](./examples/vue-import) example

- `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import path from 'node:path';
import vscode from '@tomjs/vite-plugin-vscode';

export default defineConfig({
  plugins: [vscode()],
  build: {
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
__getWebviewHtml__({
  // vite dev mode
  serverUrl: process.env.VITE_DEV_SERVER_URL,
  // vite prod mode
  webview,
  context,
});
```

- page two

```ts
__getWebviewHtml__({
  // vite dev mode
  serverUrl: `${process.env.VITE_DEV_SERVER_URL}/index2.html`,
  // vite prod mode
  webview,
  context,
  inputName: 'index2',
});
```

- A single page uses different parameters to achieve different functions

```ts
__getWebviewHtml__({
  // vite dev mode
  serverUrl: `${process.env.VITE_DEV_SERVER_URL}?id=666`,
  // vite prod mode
  webview,
  context,
  injectCode: `<script>window.__id__=666;</script>`,
});
```

**getWebviewHtml** Description

```ts
interface WebviewHtmlOptions {
  /**
   * `[vite serve]` The url of the vite dev server. Please use `process.env.VITE_DEV_SERVER_URL`
   */
  serverUrl?: string;
  /**
   * `[vite build]` The Webview instance of the extension.
   */
  webview: Webview;
  /**
   * `[vite build]` The ExtensionContext instance of the extension.
   */
  context: ExtensionContext;
  /**
   * `[vite build]` vite build.rollupOptions.input name. Default is `index`.
   */
  inputName?: string;
  /**
   * `[vite build]` Inject code into the afterbegin of the head element.
   */
  injectCode?: string;
}

/**
 * Gets the html of webview
 */
function __getWebviewHtml__(options?: WebviewHtmlOptions): string;
```

### Warning

When using the `acquireVsCodeApi().getState()` method of [@types/vscode-webview](https://www.npmjs.com/package/@types/vscode-webview), you must use `await` to call it. Since `acquireVsCodeApi` is a simulated implementation of this method by the plugin, it is inconsistent with the original method. I am very sorry. If you have other solutions, please share them. Thank you very much.

```ts
const value = await acquireVsCodeApi().getState();
```

## Documentation

- [index.d.ts](https://www.unpkg.com/browse/@tomjs/vite-plugin-vscode/dist/index.d.ts) provided by [unpkg.com](https://www.unpkg.com).

## Parameters

### PluginOptions

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| recommended | `boolean` | `true` | This option is intended to provide recommended default parameters and behavior. |
| extension | [ExtensionOptions](#ExtensionOptions) |  | Configuration options for the vscode extension. |
| webview | `boolean` \| `string` \| [WebviewOption](#WebviewOption) | `__getWebviewHtml__` | Inject html code |
| devtools | `boolean` | `true` | Inject script code for [react-devtools](https://github.com/facebook/react/tree/main/packages/react-devtools) or [vue-devtools](https://devtools.vuejs.org/guide/standalone) debugging |

#### Notice

The `recommended` option is used to set the default configuration and behavior, which can be used with almost zero configuration. The default is `true`. If you want to customize the configuration, set it to `false`. The following default prerequisites are to use the recommended [project structure](#directory-structure).

- The output directory is based on the `build.outDir` parameter of `vite`, and outputs `extension` and `src` to `dist/extension` and `dist/webview` respectively.
- Other behaviors to be implemented

#### Webview

Inject [@tomjs/vscode-extension-webview](https://github.com/tomjs/vscode-extension-webview) into vscode extension code and web client code, so that `webview` can support `HMR` during the development stage.

- vite serve
  - extension: Inject `import __getWebviewHtml__ from '@tomjs/vite-plugin-vscode/webview';` at the top of the file that calls the `__getWebviewHtml__` method
  - web: Add `<script>` tag to index.html and inject `@tomjs/vite-plugin-vscode/client` code
- vite build
  - extension: Inject `import __getWebviewHtml__ from '@tomjs/vite-plugin-vscode-inject';` at the top of the file that calls the `__getWebviewHtml__` method

If is string, will set inject method name. Default is `__getWebviewHtml__`.

#### devtools

During development, support standalone development tool applications for `react` and `vue`, enabled by default.

- `react`: inject `<script src="http://localhost:8097"></script>`, support [react-devtools](https://github.com/facebook/react/tree/main/packages/react-devtools)
- `vue`: inject `<script src="http://localhost:8098"></script>`, support [vue-devtools](https://devtools.vuejs.org/guide/standalone)

### ExtensionOptions

Based on [Options](https://paka.dev/npm/tsup) of [tsup](https://tsup.egoist.dev/), some default values are added for ease of use.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| entry | `string` | `extension/index.ts` | The vscode extension entry file. |
| outDir | `string` | `dist-extension/main` | The output directory for the vscode extension file |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined` | A function that will be executed after the build succeeds. |

### WebviewOption

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| name | `string` | `__getWebviewHtml__` | The inject method name |
| csp | `string` | `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src {{cspSource}} 'unsafe-inline'; script-src 'nonce-{{nonce}}' 'unsafe-eval';">` | The `CSP` meta for the webview |

- `{{cspSource}}`: [webview.cspSource](https://code.visualstudio.com/api/references/vscode-api#Webview)
- `{{nonce}}`: uuid

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
- [vue-esm](./examples/vue-esm): Simple vue (ESM Extension) example.
- [vue-import](./examples/vue-import): Dynamic import() and multi-page examples.

## Related

- [@tomjs/vscode](https://npmjs.com/package/@tomjs/vscode): Some utilities to simplify the development of [VSCode Extensions](https://marketplace.visualstudio.com/VSCode).
- [@tomjs/vscode-dev](https://npmjs.com/package/@tomjs/vscode-dev): Some development tools to simplify the development of [vscode extensions](https://marketplace.visualstudio.com/VSCode).
- [@tomjs/vscode-webview](https://npmjs.com/package/@tomjs/vscode-webview): Optimize the `postMessage` issue between `webview` page and [vscode extensions](https://marketplace.visualstudio.com/VSCode)

## Important Notes

### v4.0.0

**Breaking Updates:**

- Merge the `__getWebviewHtml__` method for development and production into one, see [getWebviewHtml](#getwebviewhtml)

### v3.0.0

**Breaking Updates:**

- The simulated `acquireVsCodeApi` is consistent with the `acquireVsCodeApi` of [@types/vscode-webview](https://www.npmjs.com/package/@types/vscode-webview), and `sessionStorage.getItem` and `sessionStorage.setItem` are used to implement `getState` and `setState`.
