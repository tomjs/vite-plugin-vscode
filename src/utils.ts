import type { AddressInfo } from 'node:net';
import type { ViteDevServer } from 'vite';
import fs from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { cwd } from 'node:process';
import execa from 'execa';
import { PACKAGE_NAME, WEBVIEW_PACKAGE_NAME } from './constants';

export function readJson(path: string) {
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  }
}
export function writeJson(path: string, data: any) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}

export function emptyPath(dest: string) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }
  fs.mkdirSync(dest, { recursive: true });
}

export const getNodeExternal = (externals?: (string | RegExp)[]) => {
  const modules: (string | RegExp)[] = builtinModules.filter(
    x => !/^_|^(internal|v8|node-inspect|fsevents)\/|\//.test(x),
  );

  const external = Array.isArray(externals) ? externals : [];
  return [
    ...new Set(modules.concat(modules.map(s => `node:${s}`)).concat(['vscode', ...external])),
  ];
};

export function hasArrayValue(value: any) {
  return Array.isArray(value) && value.length > 0;
}

export function mergeExternal(
  modules: string[],
  noExternals?: (string | RegExp)[],
  externals?: (string | RegExp)[],
) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return modules;
  }
  let list = [...modules];
  if (Array.isArray(noExternals) && noExternals.length > 0) {
    list = list.filter(x => !noExternals.includes(x));
  }

  if (Array.isArray(externals) && externals.length > 0) {
    list = list.filter(x => externals.includes(x));
  }

  return list;
}

export function getBooleanValue(value?: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    return;
  }

  if (['true', 'false'].includes(value)) {
    return value === 'true';
  }

  if (['1', '0'].includes(value)) {
    return value === '1';
  }

  return;
}

/**
 * @see https://github.com/vitejs/vite/blob/v4.0.1/packages/vite/src/node/constants.ts#L137-L147
 */
export function resolveHostname(hostname: string) {
  const loopbackHosts = new Set([
    'localhost',
    '127.0.0.1',
    '::1',
    '0000:0000:0000:0000:0000:0000:0000:0001',
  ]);
  const wildcardHosts = new Set(['0.0.0.0', '::', '0000:0000:0000:0000:0000:0000:0000:0000']);

  return loopbackHosts.has(hostname) || wildcardHosts.has(hostname) ? 'localhost' : hostname;
}

export function resolveServerUrl(server: ViteDevServer) {
  const addressInfo = server.httpServer!.address();
  const isAddressInfo = (x: any): x is AddressInfo => x?.address;

  if (isAddressInfo(addressInfo)) {
    const { address, port } = addressInfo;
    const hostname = resolveHostname(address);

    const options = server.config.server;
    const protocol = options.https ? 'https' : 'http';
    const devBase = server.config.base;

    const path = typeof options.open === 'string' ? options.open : devBase;
    const url = path.startsWith('http') ? path : `${protocol}://${hostname}:${port}${path}`;

    return url;
  }
}

function getWebviewPnpmPath() {
  try {
    const res = execa.sync('pnpm', ['list', '--dev', '--depth=1', '--json'], {});
    if (res.stdout) {
      const list = JSON.parse(res.stdout.trim());
      if (list.length === 0) {
        return;
      }
      const self = (list[0].devDependencies || {})[PACKAGE_NAME];
      if (!self) {
        return;
      }

      const dep = self.dependencies[WEBVIEW_PACKAGE_NAME];
      if (dep) {
        return dep.path;
      }
    }
  } catch {}
}

export function getWebviewNpmPath() {
  const npmPath = path.join(cwd(), 'node_modules', WEBVIEW_PACKAGE_NAME);

  if (fs.existsSync(npmPath)) {
    return npmPath;
  }

  // Temporary solution
  return getWebviewPnpmPath();
}
