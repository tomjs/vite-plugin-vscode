import type { Options } from 'tsup';

export interface ExtensionOptions
  extends Omit<Options, 'entry' | 'format' | 'outDir' | 'watch' | 'onSuccess'> {
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
   * A function that will be executed after the build succeeds.
   */
  onSuccess?: () => Promise<void | undefined | (() => void | Promise<void>)>;
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
   * Inject [@tomjs/vscode-extension-webview](https://github.com/tomgao365/vscode-extension-webview) into vscode extension code and web client code, so that webview can support HMR during the development stage.
   *
   * * extension: Inject `import getDevWebviewHtml from '@tomjs/vscode-extension-webview';` above the file that calls the `getDevWebviewHtml` method
   * * web: Add `<script>` tag to index.html and inject `@tomjs/vscode-extension-webview/client` code
   *
   * If is string, will set inject method name. Default is 'getDevWebviewHtml'.
   *
   * @example
   * extension file
   * ```ts
   * if(process.env.VITE_DEV_SERVER_URL){
   *   webview.html = getDevWebviewHtml(process.env.VITE_DEV_SERVER_URL)
   * } else {
   *  webview.html = `<html></html>`
   * }
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
  webview?: boolean | string;
  /**
   * extension vite config.
   */
  extension?: ExtensionOptions;
}
