import type { Plugin, ResolvedConfig, UserConfig } from 'vite';
import type { ExtensionOptions, PluginOptions } from './types';
import fs from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import { build as tsupBuild, type Options as TsupOptions } from 'tsup';
import { WEBVIEW_METHOD_NAME, WEBVIEW_PACKAGE_NAME } from './constants';
import { createLogger } from './logger';
import { readJson, resolveServerUrl } from './utils';

const isDev = process.env.NODE_ENV === 'development';
const logger = createLogger();

function getPkg() {
  const pkgFile = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgFile)) {
    throw new Error('Main file is not specified, and no package.json found');
  }

  const pkg = readJson(pkgFile);
  if (!pkg.main) {
    throw new Error('Main file is not specified, please check package.json');
  }

  return pkg;
}

function preMergeOptions(options?: PluginOptions): PluginOptions {
  getPkg();

  const opts: PluginOptions = merge(
    {
      webview: true,
      recommended: true,
      debug: false,
      extension: {
        entry: 'extension/index.ts',
        outDir: 'dist-extension',
        target: ['es2019', 'node14'],
        format: 'cjs',
        shims: true,
        clean: true,
        dts: false,
        treeshake: !!isDev,
        outExtension() {
          return { js: '.js' };
        },
        external: ['vscode'],
      } as ExtensionOptions,
    },
    cloneDeep(options),
  );

  const opt = opts.extension || {};

  ['entry', 'format'].forEach(prop => {
    const value = opt[prop];
    if (!Array.isArray(value) && value) {
      opt[prop] = [value];
    }
  });
  if (isDev) {
    opt.sourcemap = opt.sourcemap ?? true;
  } else {
    opt.minify ??= true;
  }

  opt.external = (['vscode', WEBVIEW_PACKAGE_NAME] as (string | RegExp)[]).concat(
    opt.external ?? [],
  );

  opts.extension = opt;

  if (opts.webview === true) {
    opts.webview = WEBVIEW_METHOD_NAME;
  }
  opts.webview = opts.webview ?? WEBVIEW_METHOD_NAME;

  return opts;
}

function readAllFiles(dir: string): string[] {
  return fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file);
    const isDir = fs.statSync(name).isDirectory();
    return isDir ? [...files, ...readAllFiles(name)] : [...files, name];
  }, [] as string[]);
}

export function useVSCodePlugin(options?: PluginOptions): Plugin[] {
  const opts = preMergeOptions(options);

  const handleConfig = (config: UserConfig): UserConfig => {
    let outDir = config?.build?.outDir || 'dist';
    opts.extension ??= {};
    if (opts.recommended) {
      opts.extension.outDir = path.resolve(outDir, 'extension');
      outDir = path.resolve(outDir, 'webview');
    }

    // assets
    const assetsDir = config?.build?.assetsDir || 'assets';
    const output = {
      chunkFileNames: `${assetsDir}/[name].js`,
      entryFileNames: `${assetsDir}/[name].js`,
      assetFileNames: `${assetsDir}/[name].[ext]`,
    };

    let rollupOutput = config?.build?.rollupOptions?.output ?? {};
    if (Array.isArray(rollupOutput)) {
      rollupOutput.map(s => Object.assign(s, output));
    } else {
      rollupOutput = Object.assign({}, rollupOutput, output);
    }

    return {
      build: {
        outDir,
        sourcemap: isDev ? true : config?.build?.sourcemap,
        rollupOptions: {
          output: rollupOutput,
        },
      },
    };
  };

  let webviewClient: string;
  let webviewNpmPath: string;
  if (opts.webview) {
    webviewNpmPath = path.join(cwd(), 'node_modules', WEBVIEW_PACKAGE_NAME, '/dist');
    if (!fs.existsSync(webviewNpmPath)) {
      logger.warn(`[${WEBVIEW_PACKAGE_NAME}] is not installed, please install it first!`);
    } else {
      const fileName = 'client.global.js';
      const clientFile = path.join(webviewNpmPath, fileName);
      if (!fs.existsSync(clientFile)) {
        logger.warn(`[${fileName}] is does not exist, please update the package!`);
      } else {
        webviewClient = fs.readFileSync(clientFile, 'utf-8');
      }
    }
  }

  let buildConfig: ResolvedConfig;

  return [
    {
      name: '@tomjs:vscode',
      apply: 'serve',
      config(config) {
        return handleConfig(config);
      },
      configureServer(server) {
        if (!server || !server.httpServer) {
          return;
        }
        server.httpServer?.once('listening', async () => {
          const env = {
            NODE_ENV: server.config.mode || 'development',
            VITE_DEV_SERVER_URL: resolveServerUrl(server),
          };

          logger.info('extension build start');

          let buildCount = 0;

          const { onSuccess: _onSuccess, ...tsupOptions } = opts.extension || {};
          await tsupBuild(
            merge(tsupOptions, {
              watch: true,
              env,
              silent: true,
              esbuildPlugins: [
                {
                  name: '@tomjs:vscode:inject',
                  setup(build) {
                    build.onLoad({ filter: /\.ts$/ }, async args => {
                      const file = fs.readFileSync(args.path, 'utf-8');
                      if (file.includes(`${opts.webview}(`)) {
                        return {
                          contents:
                            `import ${opts.webview} from '@tomjs/vscode-extension-webview';\n` +
                            file,
                          loader: 'ts',
                        };
                      }

                      return {};
                    });
                  },
                },
              ],
              async onSuccess() {
                if (typeof _onSuccess === 'function') {
                  await _onSuccess();
                }

                if (buildCount++ > 1) {
                  logger.info('extension rebuild success');
                } else {
                  logger.info('extension build success');
                }
              },
            } as TsupOptions),
          );
        });
      },
      transformIndexHtml(html) {
        if (!opts.webview || !webviewClient) {
          return html;
        }

        return html.replace(/<\/title>/i, `</title><script>${webviewClient}</script>`);
      },
    },
    {
      name: '@tomjs:vscode',
      apply: 'build',
      config(config) {
        return handleConfig(config);
      },
      configResolved(config) {
        buildConfig = config;
      },
      closeBundle() {
        // merge file
        const { outDir } = buildConfig.build;
        const cwd = process.cwd();
        const allFiles = readAllFiles(outDir)
          .filter(file => file.endsWith('.js') && !file.endsWith('index.js'))
          .map(s => s.replace(cwd, '').replaceAll('\\', '/').substring(1));

        const { onSuccess: _onSuccess, ...tsupOptions } = opts.extension || {};
        tsupBuild(
          merge(tsupOptions, {
            env: {
              VITE_DIST_FILES: JSON.stringify(allFiles),
            },
            async onSuccess() {
              if (typeof _onSuccess === 'function') {
                await _onSuccess();
              }
            },
          }) as TsupOptions,
        );
      },
    },
  ];
}

export default useVSCodePlugin;
