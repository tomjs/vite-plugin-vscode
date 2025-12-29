import type { Disposable, ExtensionContext, Webview } from 'vscode';
import { getWebviewHtml } from 'virtual:vscode';
import { window } from 'vscode';

export class WebviewHelper {
  public static setupHtml(webview: Webview, context: ExtensionContext) {
    return getWebviewHtml({
      serverUrl: process.env.VITE_DEV_SERVER_URL,
      webview,
      context,
    });
  }

  public static setupWebviewHooks(webview: Webview, disposables: Disposable[]) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const type = message.type;
        const data = message.data;
        console.log(`type: ${type}`);
        switch (type) {
          case 'hello':
            window.showInformationMessage(data);
        }
      },
      undefined,
      disposables,
    );
  }
}
