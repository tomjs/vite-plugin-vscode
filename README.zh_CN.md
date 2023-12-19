# @tomjs/vite-plugin-vscode

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-vscode)](https://www.npmjs.com/package/@tomjs/vite-plugin-vscode) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-vscode) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-vscode) [![Docs](https://www.paka.dev/badges/v0/cute.svg)](https://www.paka.dev/npm/@tomjs/vite-plugin-vscode)

[English](./README.md) | **中文**

> [vscode extension](https://code.visualstudio.com/api) 的 [vite](https://cn.vitejs.dev/) 插件，支持 `esm` 和 `cjs`。

给 vscode 扩展代码和 web 客户端代码中注入 [@tomjs/vscode-extension-webview](https://github.com/tomgao365/vscode-extension-webview)，可以让 webview 在开发阶段支持 `HMR`

## 特性

- 使用 [tsup](https://github.com/egoist/tsup) 快速构建 `main` 和 `preload`
- 配置简单，专注业务
- 支持 `esm`和 `cjs`
- 支持 webview `HMR`
- 支持 `vue` 和 `react` 等其他 `vite` 支持的[框架](https://cn.vitejs.dev/guide/#trying-vite-online)

## 安装

```bash
# pnpm
pnpm add @tomjs/vite-plugin-vscode -D

# yarn
yarn add @tomjs/vite-plugin-vscode -D

# npm
npm i @tomjs/vite-plugin-vscode --save-dev
```

## 使用说明

### 推荐约定

#### 目录结构

- 推荐 `extension` 和 页面 `src` 代码目录结构

```
|--extension      // extension code
|  |--index.ts
|--src            // front-end code
|  |--App.vue
|  |--main.ts
```

- 零配置，默认 dist 输出目录

```
|--dist
|  |--extension
|  |  |--index.js
|  |  |--index.js.map
|  |--webview
|  |  |--index.html
```

#### 默认配置和行为

详细查看 [PluginOptions](#pluginoptions) 和 `recommended` 参数说明

### extension

代码片段，更多配置看示例

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
      return __getWebviewHtml({ serverUrl: process.env.VITE_DEV_SERVER_URL });
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

## 文档

- [paka.dev](https://paka.dev) 提供的 [API文档](https://paka.dev/npm/@tomjs/vite-plugin-vscode).
- [unpkg.com](https://www.unpkg.com/) 提供的 [index.d.ts](https://www.unpkg.com/browse/@tomjs/vite-plugin-vscode/dist/index.d.ts).

## 参数

### PluginOptions

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| recommended | `boolean` | `true` | 这个选项是为了提供推荐的默认参数和行为 |
| extension | [ExtensionOptions](#ExtensionOptions) |  | vscode extension 可选配置 |
| webview | `boolean` | `false` | 在vscode扩展代码和Web客户端代码中注入[@tomjs/vscode-extension-webview](https://github.com/tomgao365/vscode-extension-webview)，以便webview在开发阶段可以支持HMR。 |

**Notice**

`recommended` 选项用于设置默认配置和行为，几乎可以达到零配置使用，默认为 `true` 。如果你要自定义配置，请设置它为`false`。以下默认的前提条件是使用推荐的 [项目结构](#目录结构)。

- 输出目录根据 `vite` 的 `build.outDir` 参数， 将 `extension`、`src` 分别输出到 `dist/extension`、`dist/webview`

- 其他待实现的行为

### ExtensionOptions

继承自 [tsup](https://tsup.egoist.dev/) 的 [Options](https://paka.dev/npm/tsup)，添加了一些默认值，方便使用。

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| entry | `string` | `extension/index.ts` | 入口文件 |
| outDir | `string` | `dist-extension/main` | 输出文件夹 |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined` | 构建成功后运行的回调函数 |

### 补充说明

- `extension` 未配置相关参数时的默认值

| 参数      | 开发模式默认值 | 生产模式默认值 |
| --------- | -------------- | -------------- |
| sourcemap | `true`         | `false`        |
| minify    | `false`        | `true`         |

## 环境变量

`vscode extension` 使用

| 变量                  | 描述                  |
| --------------------- | --------------------- |
| `VITE_DEV_SERVER_URL` | Vite 开发服务器的 URL |

## Debug

通过 `vscode` 运行 `Debug Extension` 调试，调试工具参考 [官方文档](https://code.visualstudio.com/docs/editor/debugging)

`launch.json` 配置如下：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/dist/extension/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

`tasks.json` 配置如下：

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
