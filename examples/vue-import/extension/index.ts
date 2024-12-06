import type { ExtensionContext } from 'vscode';
import { commands } from 'vscode';
import { MainPanel, MainPanel2 } from './views';

export function activate(context: ExtensionContext) {
  // Add command to the extension context
  context.subscriptions.push(
    commands.registerCommand('hello-world.showPage1', async () => {
      MainPanel.render(context);
    }),
  );
  context.subscriptions.push(
    commands.registerCommand('hello-world.showPage2', async () => {
      MainPanel2.render(context);
    }),
  );
}

export function deactivate() {}
