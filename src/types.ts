import type { Options } from 'tsdown';

/**
 * vscode extension options. See [tsup](https://tsup.egoist.dev/) and [API Doc](https://paka.dev/npm/tsup) for more information.
 */
export interface ExtensionOptions
  extends Omit<
    Options,
    'entry' | 'format' | 'outDir' | 'watch' | 'onSuccess' | 'skipNodeModulesBundle'
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
   * The bundle format. Currently only supports cjs.
   */
  format?: 'cjs';
  /**
   * Skip dependencies and peerDependencies bundle. Default is false.
   */
  skipNodeModulesBundle?: boolean;
  /**
   * A function that will be executed after the build succeeds.
   */
  onSuccess?: () => Promise<void | undefined | (() => void | Promise<void>)>;
}

/**
 * vscode webview options.
 */
export interface WebviewOption {
  /**
   * The method name to inject. Default is '__getWebviewHtml__'
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
   * will change the extension/webview outDir to be parallel outDir;
   * eg. if vite build.outDir is 'dist', will change extension/webview to 'dist/extension' and 'dist/webview'
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
