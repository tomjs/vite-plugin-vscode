/**
 * fix code hint
 */
type UnionType<T> = T | (string & {});

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Node.js environment
     */
    NODE_ENV: UnionType<'development' | 'production'>;
    /**
     * development mode. The url of the vite dev server.
     */
    VITE_DEV_SERVER_URL?: string;
    /**
     * production mode. All js files in the dist directory, excluding index.js. It's to be a json string.
     */
    VITE_DIST_FILES?: string;
  }
}
