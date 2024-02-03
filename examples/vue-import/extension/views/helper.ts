import { Disposable, ExtensionContext, Webview, window } from 'vscode';

export function uuid() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export class WebviewHelper {
  public static setupHtml(webview: Webview, context: ExtensionContext) {
    console.log(process.env.NODE_ENV, process.env.VITE_WEBVIEW_DIST);
    return process.env.VITE_DEV_SERVER_URL
      ? __getWebviewHtml__(process.env.VITE_DEV_SERVER_URL)
      : __getWebviewHtml__(webview, context);
  }

  public static setupHtml2(webview: Webview, context: ExtensionContext) {
    console.log(process.env.NODE_ENV, process.env.VITE_WEBVIEW_DIST);
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
