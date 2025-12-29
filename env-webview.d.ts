/**
 * Inject some methods such as `getWebviewHtml`
 */
declare module 'virtual:vscode' {
  import type { ExtensionContext, Webview } from 'vscode';

  export interface WebviewHtmlOptions {
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
   * Get the html of the webview.
   *
   * @param options
   */
  export const getWebviewHtml: (options?: WebviewHtmlOptions) => string;

  export default getWebviewHtml;
}
