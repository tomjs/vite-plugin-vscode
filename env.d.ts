/// <reference types="./env-webview.d.ts" />
import type { WebviewHtmlOptions } from 'virtual:vscode';

// Make this a module
export {};
declare global {
  /**
   * fix code hint
   */
  type UnionType<T> = T | (string & {});

  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Node.js environment
       */
      NODE_ENV: UnionType<'development' | 'production'>;
      /**
       * `[vite serve]` The url of the vite dev server.
       */
      VITE_DEV_SERVER_URL?: string;
      /**
       * `[vite build]` All js files in the dist directory, excluding index.js. It's to be a json string.
       */
      VITE_WEBVIEW_DIST?: string;
    }
  }

  /**
   * Gets the html of webview. It's deprecated. Please use `import { getWebviewHtml } from 'virtual:vscode';`.
   *
   * @example
   *  import type { ExtensionContext, Webview } from 'vscode';
   *  import { getWebviewHtml } from 'virtual:vscode';
   *  import { window } from 'vscode';
   *
   *  export class WebviewHelper {
   *    public static setupHtml(webview: Webview, context: ExtensionContext) {
   *      return getWebviewHtml({
   *        serverUrl: process.env.VITE_DEV_SERVER_URL,
   *        webview,
   *        context,
   *        injectCode: `<script>window.__FLAG1__=666;window.__FLAG2__=888;</script>`,
   *    });
   *  }
   *
   * @deprecated
   */
  function __getWebviewHtml__(options?: WebviewHtmlOptions): string;
}
