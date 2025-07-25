import type { Options } from 'tsdown';

/**
 * vscode extension options. See [tsdown](https://tsdown.dev/) and [Config Options](https://tsdown.dev/reference/config-options) for more information.
 */
export interface ExtensionOptions
  extends Omit<
    Options,
    'entry' | 'format' | 'outDir' | 'watch'
  > {
  /**
   * The extension entry file.
   * @default "extension/index.ts"
   */
  entry?: string;
  /**
   * The output directory for the extension files. Default is `dist-extension`.
   * @default "dist-extension"
   */
  outDir?: string;
  /**
   * `tsdown` watches the current working directory by default. You can set files that need to be watched, which may improve performance.
   *
   * If no value is specified, the default value of the "recommended" parameter is ["extension"] when it is true, otherwise it defaults to "true"
   */
  watchFiles?: string | string[];
}

/**
 * vscode webview options.
 */
export interface WebviewOption {
  /**
   * The method name to inject. Default is `__getWebviewHtml__`
   */
  name?: string;
  /**
   * The CSP meta for the webview. Default is `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src {{cspSource}} 'unsafe-inline'; script-src 'nonce-{{nonce}}' 'unsafe-eval';">`
   */
  csp?: string;
}

/**
 * vite plugin options.
 */
export interface PluginOptions {
  /**
   * Recommended switch. Default is true.
   * if true, will have the following default behavior:
   * - will change the extension/webview outDir to be parallel outDir;
   * - if vite build.outDir is 'dist', will change extension/webview to 'dist/extension' and 'dist/webview'
   * @default true
   */
  recommended?: boolean;
  /**
   * Inject code into vscode extension code and web client code, so that webview can support HMR during the development stage.
   *
   * - vite serve
   *   - extension: Inject `import __getWebviewHtml__ from '@tomjs/vite-plugin-vscode/webview';` at the top of the file that calls the `__getWebviewHtml__` method
   *   - web: Add `<script>` tag to index.html and inject `@tomjs/vite-plugin-vscode/client` code
   * - vite build
   *   - extension: Inject `import __getWebviewHtml__ from '@tomjs/vite-plugin-vscode-inject';` at the top of the file that calls the `__getWebviewHtml__` method
   *
   * If is string, will set inject method name. Default is '__getWebviewHtml__'.
   *
   *
   * @example
   * extension file
   * ```ts
   *function setupHtml(webview: Webview, context: ExtensionContext) {
   *  return __getWebviewHtml__({serverUrl:WebviewHtmlOptions, webview, context});
   *}
   * ```
   */
  webview?: boolean | string | WebviewOption;
  /**
   * extension vite config.
   */
  extension?: ExtensionOptions;
  /**
   * Whether to enable devtools. Inject `<script src="http://localhost:<devtools-port>"></script>` into webview client . Default is true.
   *  - true:
   *    - react: inject `<script src="http://localhost:8097"></script>`
   *    - vue: inject `<script src="http://localhost:8098"></script>`
   * @default true
   */
  devtools?: boolean;
}
