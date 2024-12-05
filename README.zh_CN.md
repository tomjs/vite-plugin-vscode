# @tomjs/vite-plugin-vscode

[![npm](https://img.shields.io/npm/v/@tomjs/vite-plugin-vscode)](https://www.npmjs.com/package/@tomjs/vite-plugin-vscode) ![node-current (scoped)](https://img.shields.io/node/v/@tomjs/vite-plugin-vscode) ![NPM](https://img.shields.io/npm/l/@tomjs/vite-plugin-vscode) [![jsDocs.io](https://img.shields.io/badge/jsDocs.io-reference-blue)](https://www.jsdocs.io/package/@tomjs/vite-plugin-vscode)

[English](./README.md) | **中文**

> 用 `vue`/`react` 来开发 [vscode extension webview](https://code.visualstudio.com/api/references/vscode-api#WebviewPanel) ，支持 `esm` 和 `cjs`。

在开发模式时，给 `vscode 扩展代码` 和 `web 页面代码`中注入 [@tomjs/vscode-extension-webview](https://github.com/tomjs/vscode-extension-webview) 相同的代码，用来支持 `HMR`；生产构建时，将最终生成的`index.html` 代码注入到 `vscode 扩展代码` 中，减少工作量。

## 特性

- 使用 [tsup](https://github.com/egoist/tsup) 快速构建 `扩展代码`
- 配置简单，专注业务
- 支持 `esm`和 `cjs`
- 支持 webview `HMR`
- 支持 [@types/vscode-webview](https://www.npmjs.com/package/@types/vscode-webview) 的 `acquireVsCodeApi`
- 支持[多页面应用](https://cn.vitejs.dev/guide/build.html#multi-page-app)
- 支持 `vue` 、`react` 等其他 `vite` 支持的[框架](https://cn.vitejs.dev/guide/#trying-vite-online)

## 安装

```bash
# pnpm
pnpm add @tomjs/vite-plugin-vscode -D

# yarn
yarn add @tomjs/vite-plugin-vscode -D

# npm
npm i @tomjs/vite-plugin-vscode -D
```

## 使用说明

### 推荐约定

设置 `recommended` 参数会修改一些预置配置，详细查看 [PluginOptions](#pluginoptions) 和 `recommended` 参数说明。

#### 目录结构

- 默认情况下，`recommended:true` 会根据如下目录结构作为约定

```
|--extension      // extension code
|  |--index.ts
|--src            // front-end code
|  |--App.vue
|  |--main.ts
|--index.html
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

- 如果你想修改 `extension` 源码目录为 `src`，可以设置 `{ extension: { entry: 'src/index.ts' } }`

```
|--src            // extension code
|  |--index.ts
|--webview        // front-end code
|  |--App.vue
|  |--main.ts
|--index.html
```

### extension

代码片段，更多配置看示例

```ts
const panel = window.createWebviewPanel('showHelloWorld', 'Hello World', ViewColumn.One, {
  enableScripts: true,
  localResourceRoots: [Uri.joinPath(extensionUri, 'dist/webview')],
});

// vite 开发模式和生产模式注入不同的webview代码，减少开发工作
function getHtml(webview: Webview, context: ExtensionContext) {
  process.env.VITE_DEV_SERVER_URL
    ? __getWebviewHtml__(process.env.VITE_DEV_SERVER_URL)
    : __getWebviewHtml__(webview, context);
}

panel.webview.html = getHtml(webview, context);
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
    // 修改扩展源码入口路径，同时修改`index.html`入口文件路径
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

可查看 [vue-import](./examples/vue-import) 示例

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
      // 也可自定义名称
      // input:{
      //   'index': path.resolve(__dirname, 'index.html'),
      //   'index2': path.resolve(__dirname, 'index2.html'),
      // }
    },
  },
});
```

- 页面一

```ts
process.env.VITE_DEV_SERVER_URL
  ? __getWebviewHtml__(process.env.VITE_DEV_SERVER_URL)
  : __getWebviewHtml__(webview, context);
```

- 页面二

```ts
process.env.VITE_DEV_SERVER_URL
  ? __getWebviewHtml__(`${process.env.VITE_DEV_SERVER_URL}/index2.html`)
  : __getWebviewHtml__(webview, context, 'index2');
```

**getWebviewHtml** 说明

```ts
/**
 *  `[vite serve]` 在开发模式获取webview的html
 * @param options serverUrl: vite开发服务器的url
 */
function __getWebviewHtml__(options?: string | { serverUrl: string }): string;

/**
 *   `[vite build]` 在生产模式获取webview的html
 * @param webview 扩展的 Webview 实例
 * @param context 扩展的 ExtensionContext 实例
 * @param inputName vite build.rollupOptions.input 设置的名称. 默认 `index`.
 */
function __getWebviewHtml__(
  webview: Webview,
  context: ExtensionContext,
  inputName?: string,
): string;
```

### 警告

使用 [@types/vscode-webview](https://www.npmjs.com/package/@types/vscode-webview) 的 `acquireVsCodeApi().getState()` 方法时，要使用 `await` 调用。由于 `acquireVsCodeApi` 是插件对该方法的模拟实现，故与原方法出现不一致性，非常抱歉。如果有其他方案，请分享，非常感谢。

```ts
const value = await acquireVsCodeApi().getState();
```

## 文档

- [unpkg.com](https://www.unpkg.com/) 提供的 [index.d.ts](https://www.unpkg.com/browse/@tomjs/vite-plugin-vscode/dist/index.d.ts).

## 参数

### PluginOptions

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| recommended | `boolean` | `true` | 这个选项是为了提供推荐的默认参数和行为 |
| extension | [ExtensionOptions](#ExtensionOptions) |  | vscode extension 可选配置 |
| webview | `boolean` \| `string` \| [WebviewOption](#WebviewOption) | `__getWebviewHtml__` | 注入 html 代码 |
| devtools | `boolean` | `true` | 注入 script 代码用于 [react-devtools](https://github.com/facebook/react/tree/main/packages/react-devtools) 或 [vue-devtools](https://devtools.vuejs.org/guide/standalone) 调试 |

#### Notice

`recommended` 选项用于设置默认配置和行为，几乎可以达到零配置使用，默认为 `true` 。如果你要自定义配置，请设置它为`false`。以下默认的前提条件是使用推荐的 [项目结构](#目录结构)。

- 输出目录根据 `vite` 的 `build.outDir` 参数， 将 `extension`、`src` 分别输出到 `dist/extension`、`dist/webview`

- 其他待实现的行为

#### Webview

在 vscode 扩展代码和 web 客户端代码中注入 [@tomjs/vscode-extension-webview](https://github.com/tomjs/vscode-extension-webview)，使 `webview` 在开发阶段能够支持 `HMR`。

- vite serve
  - extension: 在调用 `__getWebviewHtml__` 方法的文件顶部注入 `import __getWebviewHtml__ from '@tomjs/vscode-extension-webview';`
  - web: 在 index.html 中添加 `<script>` 标签，注入 `@tomjs/vscode-extension-webview/client` 代码
- vite build
  - extension: 在调用 `__getWebviewHtml__` 方法的文件顶部注入 `import __getWebviewHtml__ from '@tomjs/vite-plugin-vscode-inject';`

如果为字符串，则设置注入方法名，默认为 `__getWebviewHtml__`。

#### devtools

开发阶段，支持 `react` 和 `vue` 的独立开发工具应用，默认开启。

- `react`: 注入 `<script src="http://localhost:8097"></script>`，支持 [react-devtools](https://github.com/facebook/react/tree/main/packages/react-devtools)
- `vue`: 注入 `<script src="http://localhost:8098"></script>`，支持 [vue-devtools](https://devtools.vuejs.org/guide/standalone)

### ExtensionOptions

继承自 [tsup](https://tsup.egoist.dev/) 的 [Options](https://paka.dev/npm/tsup)，添加了一些默认值，方便使用。

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| entry | `string` | `extension/index.ts` | 入口文件 |
| outDir | `string` | `dist-extension/main` | 输出文件夹 |
| onSuccess | `() => Promise<void \| undefined \| (() => void \| Promise<void>)>` | `undefined` | 构建成功后运行的回调函数 |

### WebviewOption

| 参数名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| name | `string` | `__getWebviewHtml__` | 注入的方法名 |
| csp | `string` | `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src {{cspSource}} 'unsafe-inline'; script-src 'nonce-{{nonce}}' 'unsafe-eval';">` | webview 的 `CSP` |

- `{{cspSource}}`: [webview.cspSource](https://code.visualstudio.com/api/references/vscode-api#Webview)
- `{{nonce}}`: uuid

### 补充说明

- `extension` 未配置相关参数时的默认值

| 参数      | 开发模式默认值 | 生产模式默认值 |
| --------- | -------------- | -------------- |
| sourcemap | `true`         | `false`        |
| minify    | `false`        | `true`         |

## 环境变量

`vscode extension` 使用

- `development` 模式

| 变量                  | 描述                |
| --------------------- | ------------------- |
| `VITE_DEV_SERVER_URL` | vite开发服务器的url |

- `production` 模式

| 变量                | 描述                      |
| ------------------- | ------------------------- |
| `VITE_WEBVIEW_DIST` | vite webview 页面输出路径 |

## Debug

### 扩展调试

通过 `vscode` 运行 `Debug Extension` 调试，调试工具参考 [官方文档](https://code.visualstudio.com/docs/editor/debugging)

`launch.json` 配置如下：

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

### 网页调试

可以使用 [react-devtools](https://github.com/facebook/react/tree/main/packages/react-devtools) 和 [vue-devtools](https://devtools.vuejs.org/guide/standalone) 的独立应用调试 `webview`

## 示例

先执行以下命令安装依赖，并生成库文件：

```bash
pnpm install
pnpm build
```

打开 [examples](./examples) 目录，有 `vue` 和 `react` 示例。

- [react](./examples/react)：简单的 react 示例。
- [vue](./examples/vue)：简单的 vue 示例。
- [vue-import](./examples/vue-import)：动态 import() 和多页面示例。

## 关联

- [@tomjs/vscode](https://npmjs.com/package/@tomjs/vscode): 一些实用工具，用于简化 [vscode 扩展](https://marketplace.visualstudio.com/VSCode) 的开发。
- [@tomjs/vscode-dev](https://npmjs.com/package/@tomjs/vscode-dev): 一些开发工具，用于简化 [vscode 扩展](https://marketplace.visualstudio.com/VSCode) 的开发。
- [@tomjs/vscode-webview](https://npmjs.com/package/@tomjs/vscode-webview): 优化 `webview` 页面与 [vscode 扩展](https://marketplace.visualstudio.com/VSCode) 的 `postMessage` 问题

## 重要说明

### v3.0.0

**破坏性更新：**

- 模拟的 `acquireVsCodeApi` 与 [@types/vscode-webview](https://www.npmjs.com/package/@types/vscode-webview) 的 `acquireVsCodeApi` 保持一致，改用 `sessionStorage.getItem` 和 `sessionStorage.setItem` 来实现 `getState` 和 `setState`。
