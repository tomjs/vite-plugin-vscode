import type { InlineConfig } from 'tsdown';

/**
 * vscode extension options. See [tsdown](https://tsdown.dev/) and [Config Options](https://tsdown.dev/reference/config-options) for more information.
 */
export interface ExtensionOptions
  extends Omit<
    InlineConfig,
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
   * During development, inject code into both `vscode extension code` and `web page` code to support `HMR`;
   *
   * During production builds, inject the final generated `index.html` code into the `vscode extension code` to minimize manual effort.
   *
   * @example
   * extension file
   * ```ts
   *import {getWebviewHtml} from 'virtual:vscode';
   *
   *function setupHtml(webview: Webview, context: ExtensionContext) {
   *  return getWebviewHtml({serverUrl:process.env.VITE_DEV_SERVER_URL, webview, context});
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
