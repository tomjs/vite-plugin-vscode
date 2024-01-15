import { commands, ExtensionContext } from 'vscode';
import { MainPanel } from './panels/MainPanel';

export function activate(context: ExtensionContext) {
  // Create the show hello world command
  const showHelloWorldCommand = commands.registerCommand('hello-world.showHelloWorld', async () => {
    MainPanel.render(context.extensionUri);
  });

  // Add command to the extension context
  context.subscriptions.push(showHelloWorldCommand);
}

export function deactivate() {}
