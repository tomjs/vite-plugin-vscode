// import type { Options as TsupOptions } from 'tsup';
import type { Options as TsdownOptions } from 'tsdown';
import type { PluginOption, ResolvedConfig, UserConfig } from 'vite';
import type { ExtensionOptions, PluginOptions, WebviewOption } from './types';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { cwd } from 'node:process';
import { emptyDirSync, readFileSync, readJsonSync } from '@tomjs/node';
import merge from 'lodash.merge';
import { parse as htmlParser } from 'node-html-parser';
// import { build as tsupBuild } from 'tsup';
import { build as tsdownBuild } from 'tsdown';
import { PACKAGE_NAME, WEBVIEW_METHOD_NAME } from './constants';
import { createLogger } from './logger';
import { resolveServerUrl } from './utils';

export * from './types';

const isDev = process.env.NODE_ENV === 'development';
const logger = createLogger();

function getPkg() {
  const pkgFile = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgFile)) {
    throw new Error('Main file is not specified, and no package.json found');
  }

  const pkg = readJsonSync(pkgFile);
  if (!pkg.main) {
    throw new Error('Main file is not specified, please check package.json');
  }

  return pkg;
}

function preMergeOptions(options?: PluginOptions): PluginOptions {
  const pkg = getPkg();
  const format = pkg.type === 'module' ? 'esm' : 'cjs';

  const opts: PluginOptions = merge(
    {
      webview: true,
      recommended: true,
      debug: false,
      extension: {
        entry: 'extension/index.ts',
        outDir: 'dist-extension',
        target: format === 'esm' ? ['node20'] : ['es2019', 'node14'],
        format,
        shims: true,
        clean: true,
        dts: false,
        treeshake: !isDev,
        outExtensions() {
          return { js: '.js' };
        },
        external: ['vscode'],
      } as ExtensionOptions,
    },
    options,
  );

  const opt = opts.extension || {};

  ['entry', 'format'].forEach((prop) => {
    const value = opt[prop];
    if (!Array.isArray(value) && value) {
      opt[prop] = [value];
    }
  });
  if (isDev) {
    opt.sourcemap = opt.sourcemap ?? true;
  }
  else {
    opt.minify ??= true;
  }
  if (typeof opt.external !== 'function') {
    opt.external = (['vscode'] as (string | RegExp)[]).concat(opt.external ?? []);
  }
  else {
    const fn = opt.external;
    opt.external = function (id, parentId, isResolved) {
      if (id === 'vscode') {
        return true;
      }
      return fn.call(this, id, parentId, isResolved);
    };
  }
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
  emptyDirSync(prodCacheFolder);
  const destFile = path.join(prodCacheFolder, 'index.js');

  function handleHtmlCode(html: string) {
    const root = htmlParser(html);
    const head = root.querySelector('head')!;
    if (!head) {
      root?.insertAdjacentHTML('beforeend', '<head></head>');
    }

    const csp
      = webview?.csp
        || `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src {{cspSource}} 'unsafe-inline'; script-src 'nonce-{{nonce}}' 'unsafe-eval';">`;
    head.insertAdjacentHTML('afterbegin', csp);

    if (csp && csp.includes('{{nonce}}')) {
      const tags = {
        script: 'src',
        link: 'href',
      };

      Object.keys(tags).forEach((tag) => {
        const elements = root.querySelectorAll(tag);
        elements.forEach((element) => {
          const attr = element.getAttribute(tags[tag]);
          if (attr) {
            element.setAttribute(tags[tag], `{{baseUri}}${attr}`);
          }

          element.setAttribute('nonce', '{{nonce}}');
        });
      });
    }

    return root.removeWhitespace().toString();
  }

  const cacheCode = /* js */ `const htmlCode = {
    ${Object.keys(cache)
      .map(s => `'${s}': \`${handleHtmlCode(cache[s])}\`,`)
      .join('\n')}
  };`;

  const code = /* js */ `import { Uri } from 'vscode';

${cacheCode}

function uuid() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export default function getWebviewHtml(options){
  const { webview, context, inputName, injectCode } = options || {};
  const nonce = uuid();
  const baseUri = webview.asWebviewUri(Uri.joinPath(context.extensionUri, (process.env.VITE_WEBVIEW_DIST || 'dist')));
  let html = htmlCode[inputName || 'index'] || '';
  if (injectCode) {
    html = html.replace('<head>', '<head>'+ injectCode);
  }

  return html.replaceAll('{{cspSource}}', webview.cspSource).replaceAll('{{nonce}}', nonce).replaceAll('{{baseUri}}', baseUri);
}
  `;
  fs.writeFileSync(destFile, code, { encoding: 'utf8' });

  return fixWindowsPath(destFile);
}

function fixWindowsPath(webviewPath: string) {
  if (os.platform() === 'win32') {
    webviewPath = webviewPath.replaceAll('\\', '/');
  }
  return webviewPath;
}

export function useVSCodePlugin(options?: PluginOptions): PluginOption {
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
    }
    else {
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

  let devWebviewClient: string;
  if (opts.webview) {
    devWebviewClient = readFileSync(path.join(__dirname, 'client.iife.js'));
  }

  let resolvedConfig: ResolvedConfig;
  // multiple entry index.html
  const prodHtmlCache: Record<string, string> = {};

  let devtoolsFlag = false;

  return [
    {
      name: '@tomjs:vscode',
      apply: 'serve',
      config(config) {
        return handleConfig(config);
      },
      configResolved(config) {
        resolvedConfig = config;
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

          const { onSuccess: _onSuccess, ...tsdownOptions } = opts.extension || {};
          await tsdownBuild(
            merge(tsdownOptions, {
              watch: true,
              env,
              silent: true,
              plugins: !webview
                ? []
                : [
                    {
                      name: '@tomjs:vscode:inject',
                      transform(code) {
                        if (code.includes(`${webview.name}(`)) {
                          return `import ${webview.name} from '${PACKAGE_NAME}/webview';\n${code}`;
                        }
                        return code;
                      },
                    },
                  ],
              async onSuccess() {
                if (typeof _onSuccess === 'function') {
                  await _onSuccess();
                }

                if (buildCount++ > 1) {
                  logger.info('extension rebuild success');
                }
                else {
                  logger.info('extension build success');
                }
              },
            } as TsdownOptions),
          );
        });
      },
      transformIndexHtml(html) {
        if (!opts.webview) {
          return html;
        }

        if (opts.devtools ?? true) {
          let port: number | undefined;
          if (
            resolvedConfig.plugins.find(s =>
              ['vite:react-refresh', 'vite:react-swc'].includes(s.name),
            )
          ) {
            port = 8097;
          }
          else if (resolvedConfig.plugins.find(s => ['vite:vue', 'vite:vue2'].includes(s.name))) {
            port = 8098;
          }

          if (port) {
            html = html.replace(
              /<head>/i,
              `<head><script src="http://localhost:${port}"></script>`,
            );
          }
          else if (!devtoolsFlag) {
            devtoolsFlag = true;
            logger.warn('Only support react-devtools and vue-devtools!');
          }
        }

        return html.replace(/<\/title>/i, `</title><script>${devWebviewClient}</script>`);
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
        resolvedConfig = config;
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

        let outDir = resolvedConfig.build.outDir.replace(cwd(), '').replaceAll('\\', '/');
        if (outDir.startsWith('/')) {
          outDir = outDir.substring(1);
        }
        const env = {
          NODE_ENV: resolvedConfig.mode || 'production',
          VITE_WEBVIEW_DIST: outDir,
        };

        logger.info('extension build start');

        const { onSuccess: _onSuccess, ...tsupOptions } = opts.extension || {};
        tsdownBuild(
          merge(tsupOptions, {
            env,
            silent: true,
            plugins: !webview
              ? []
              : [
                  {
                    name: '@tomjs:vscode:inject',
                    transform(code) {
                      if (code.includes(`${webview.name}(`)) {
                        return `import ${webview.name} from "${webviewPath}";\n${code}`;
                      }
                      return code;
                    },
                  },
                ],
            async onSuccess() {
              if (typeof _onSuccess === 'function') {
                await _onSuccess();
              }
              logger.info('extension build success');
            },
          } as TsdownOptions),
        );
      },
    },
  ];
}

export default useVSCodePlugin;
