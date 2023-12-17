import type { Plugin } from 'vite';
import type { PluginOptions } from './types';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';

function preMergeOptions(options?: PluginOptions): PluginOptions {
  const opts: PluginOptions = merge({ webview: true }, cloneDeep(options));

  return opts;
}

export function useVSCodePlugin(options?: PluginOptions): Plugin {
  const opts = preMergeOptions(options);
  console.log(opts);

  return {
    name: '@tomjs:vscode',
  };
}

export default useVSCodePlugin;
