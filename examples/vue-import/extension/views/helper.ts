import { Disposable, ExtensionContext, Webview, window } from 'vscode';

export class WebviewHelper {
  public static setupHtml(webview: Webview, context: ExtensionContext) {
    return process.env.VITE_DEV_SERVER_URL
      ? __getWebviewHtml__(process.env.VITE_DEV_SERVER_URL)
      : __getWebviewHtml__(webview, context);
  }

  public static setupHtml2(webview: Webview, context: ExtensionContext) {
    return process.env.VITE_DEV_SERVER_URL
      ? __getWebviewHtml__(`${process.env.VITE_DEV_SERVER_URL}/index2.html`)
      : __getWebviewHtml__(webview, context, 'index2');
  }

  public static setupWebviewHooks(webview: Webview, disposables: Disposable[]) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;
        console.log(`command: ${command}`);
        switch (command) {
          case 'hello':
            window.showInformationMessage(text);
            return;
        }
      },
      undefined,
      disposables,
    );
  }
}
