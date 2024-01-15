export {}; // Make this a module

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
      VITE_DIST_FILES?: string;
    }
  }

  /**
   *  `[vite serve]` Get the html of the development webview.
   * @param options serverUrl: The url of the vite dev server.
   */
  function __getWebviewHtml__(options?: string | { serverUrl: string }): string;
}
