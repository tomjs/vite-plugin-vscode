import type { Disposable, ExtensionContext, WebviewPanel } from 'vscode';
import { ViewColumn, window } from 'vscode';
import { WebviewHelper } from './helper';

export class MainPanel2 {
  public static currentPanel: MainPanel2 | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  private constructor(panel: WebviewPanel, context: ExtensionContext) {
    this._panel = panel;

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = WebviewHelper.setupHtml2(this._panel.webview, context);

    WebviewHelper.setupWebviewHooks(this._panel.webview, this._disposables);
  }

  public static render(context: ExtensionContext) {
    if (MainPanel2.currentPanel) {
      MainPanel2.currentPanel._panel.reveal(ViewColumn.One);
    }
    else {
      const panel = window.createWebviewPanel('showPage2', 'Hello Page2', ViewColumn.One, {
        enableScripts: true,
      });

      MainPanel2.currentPanel = new MainPanel2(panel, context);
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    MainPanel2.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
