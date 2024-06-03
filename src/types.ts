import type { Options } from 'tsup';

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
   * * will change the extension/webview outDir to be parallel outDir;
   * eg. if vite build.outDir is 'dist', will change extension/webview to 'dist/extension' and 'dist/webview'
   * @default true
   */
  recommended?: boolean;
  /**
   * Inject [@tomjs/vscode-extension-webview](https://github.com/tomjs/vscode-extension-webview) into vscode extension code and web client code, so that webview can support HMR during the development stage.
   *
   * * vite serve
   *    * extension: Inject `import __getWebviewHtml__ from '@tomjs/vscode-extension-webview';` above the file that calls the `__getWebviewHtml__` method
   *    * web: Add `<script>` tag to index.html and inject `@tomjs/vscode-extension-webview/client` code
   * * vite build
   *    * extension: Inject `import __getWebviewHtml__ from '@tomjs/vite-plugin-vscode-inject';` above the file that calls the `__getWebviewHtml__` method
   *
   * If is string, will set inject method name. Default is '__getWebviewHtml__'.
   *
   * @example
   * extension file
   * ```ts
   *function setupHtml(webview: Webview, context: ExtensionContext) {
   *  if (process.env.VITE_DEV_SERVER_URL) {
   *    return __getWebviewHtml__(process.env.VITE_DEV_SERVER_URL);
   *  }
   *  return __getWebviewHtml__(webview, context);
   *}
   * ```
   * webview client
   * ```html
   * <html>
   *  <head>
   *    <script>inject code</script>
   *  </head>
   * </html>
   * ```
   */
  webview?: boolean | string | WebviewOption;
  /**
   * extension vite config.
   */
  extension?: ExtensionOptions;
}
