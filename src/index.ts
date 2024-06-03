import type { Plugin, ResolvedConfig, UserConfig } from 'vite';
import type { ExtensionOptions, PluginOptions, WebviewOption } from './types';
import fs from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import { parse as htmlParser } from 'node-html-parser';
import { build as tsupBuild, type Options as TsupOptions } from 'tsup';
import { PACKAGE_NAME, WEBVIEW_METHOD_NAME, WEBVIEW_PACKAGE_NAME } from './constants';
import { createLogger } from './logger';
import { emptyPath, getWebviewNpmPath, readJson, resolveServerUrl } from './utils';

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
  const pkg = getPkg();
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
        treeshake: isDev ? false : 'smallest',
        outExtension() {
          return { js: '.js' };
        },
        external: ['vscode'],
        skipNodeModulesBundle: isDev,
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

  if (!opt.skipNodeModulesBundle) {
    opt.noExternal = Object.keys(pkg.dependencies || {}).concat(
      Object.keys(pkg.peerDependencies || {}),
    );
  }

  opts.extension = opt;

  if (opts.webview !== false) {
    let name = WEBVIEW_METHOD_NAME;
    if (typeof opts.webview === 'string') {
      name = opts.webview ?? WEBVIEW_METHOD_NAME;
    }
    opts.webview = Object.assign({ name }, opts.webview);
  }

  return opts;
}

const prodCachePkgName = `${PACKAGE_NAME}-inject`;
function genProdWebviewCode(cache: Record<string, string>, webview?: WebviewOption) {
  webview = Object.assign({}, webview);

  const prodCacheFolder = path.join(cwd(), 'node_modules', prodCachePkgName);
  emptyPath(prodCacheFolder);
  const destFile = path.join(prodCacheFolder, 'index.ts');

  function handleHtmlCode(html: string) {
    const root = htmlParser(html);
    const head = root.querySelector('head')!;
    if (!head) {
      root?.insertAdjacentHTML('beforeend', '<head></head>');
    }

    const csp =
      webview?.csp ||
      `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src {{cspSource}} 'unsafe-inline'; script-src 'nonce-{{nonce}}' 'unsafe-eval';">`;
    head.insertAdjacentHTML('afterbegin', csp);

    if (csp && csp.includes('{{nonce}}')) {
      const tags = {
        script: 'src',
        link: 'href',
      };

      Object.keys(tags).forEach(tag => {
        const elements = root.querySelectorAll(tag);
        elements.forEach(element => {
          const attr = element.getAttribute(tags[tag]);
          if (attr) {
            element.setAttribute(tags[tag], `{{baseUri}}${attr}`);
          }

          element.setAttribute('nonce', '{{nonce}}');
        });
      });
    }

    return root.toString();
  }

  const cacheCode = /* js */ `const htmlCode = {
    ${Object.keys(cache)
      .map(s => `${s}: \`${handleHtmlCode(cache[s])}\`,`)
      .join('\n')}
  };`;

  const code = /* js */ `import { ExtensionContext, Uri, Webview } from 'vscode';

${cacheCode}

function uuid() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export default function getWebviewHtml(webview: Webview, context: ExtensionContext, inputName?:string){
  const nonce = uuid();
  const baseUri = webview.asWebviewUri(Uri.joinPath(context.extensionUri, (process.env.VITE_WEBVIEW_DIST || 'dist')));
  const html = htmlCode[inputName || 'index'] || '';
  return html.replaceAll('{{cspSource}}', webview.cspSource).replaceAll('{{nonce}}', nonce).replaceAll('{{baseUri}}', baseUri);
}
  `;
  fs.writeFileSync(destFile, code, { encoding: 'utf8' });

  return destFile.replaceAll('\\', '/');
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
  let webviewNpmPath: string | undefined;
  if (opts.webview) {
    webviewNpmPath = getWebviewNpmPath();
    if (!webviewNpmPath || !fs.existsSync(webviewNpmPath)) {
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
  // multiple entry index.html
  const prodHtmlCache: Record<string, string> = {};

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

          const webview = opts?.webview as WebviewOption;

          const { onSuccess: _onSuccess, ...tsupOptions } = opts.extension || {};
          await tsupBuild(
            merge(tsupOptions, {
              watch: true,
              env,
              silent: true,
              esbuildPlugins: !webview
                ? []
                : [
                    {
                      name: '@tomjs:vscode:inject',
                      setup(build) {
                        build.onLoad({ filter: /\.ts$/ }, async args => {
                          const file = fs.readFileSync(args.path, 'utf-8');
                          if (file.includes(`${webview.name}(`)) {
                            return {
                              contents:
                                `import ${webview.name} from '@tomjs/vscode-extension-webview';\n` +
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
      enforce: 'post',
      config(config) {
        return handleConfig(config);
      },
      configResolved(config) {
        buildConfig = config;
      },
      transformIndexHtml(html, ctx) {
        if (!opts.webview) {
          return html;
        }

        prodHtmlCache[ctx.chunk?.name as string] = html;
        return html;
      },
      closeBundle() {
        let webviewPath: string;

        const webview = opts?.webview as WebviewOption;
        if (webview) {
          webviewPath = genProdWebviewCode(prodHtmlCache, webview);
        }

        let outDir = buildConfig.build.outDir.replace(cwd(), '').replaceAll('\\', '/');
        if (outDir.startsWith('/')) {
          outDir = outDir.substring(1);
        }
        const env = {
          NODE_ENV: buildConfig.mode || 'production',
          VITE_WEBVIEW_DIST: outDir,
        };

        logger.info('extension build start');

        const { onSuccess: _onSuccess, ...tsupOptions } = opts.extension || {};
        tsupBuild(
          merge(tsupOptions, {
            env,
            silent: true,
            esbuildPlugins: !webview
              ? []
              : [
                  {
                    name: '@tomjs:vscode:inject',
                    setup(build) {
                      build.onLoad({ filter: /\.ts$/ }, async args => {
                        const file = fs.readFileSync(args.path, 'utf-8');
                        if (file.includes(`${webview.name}(`)) {
                          return {
                            contents: `import ${webview.name} from \`${webviewPath}\`;\n` + file,
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

              logger.info('extension build success');
            },
          }) as TsupOptions,
        );
      },
    },
  ];
}

export default useVSCodePlugin;
