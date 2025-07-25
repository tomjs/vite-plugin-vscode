import type { ExtensionContext } from 'vscode';
import { initExtension } from '@tomjs/vscode';
import { commands } from 'vscode';
import { MainPanel } from './views/panel';

export function activate(context: ExtensionContext) {
  initExtension(context);

  context.subscriptions.push(
    commands.registerCommand('hello-world.showHelloWorld', async () => {
      MainPanel.render(context);
    }),
  );
}

export function deactivate() {}
