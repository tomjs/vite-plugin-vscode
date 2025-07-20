import template from './template.html';

export interface WebviewHtmlOptions {
  /**
   * local server url
   */
  serverUrl: string;
}

/**
 *
 * @param options serverUrl string or object options
 */

export function getWebviewHtml(options: WebviewHtmlOptions) {
  const opts: WebviewHtmlOptions = {
    serverUrl: '',
  };

  Object.assign(opts, options);

  return (template as string).replace(/\{\{serverUrl\}\}/g, opts.serverUrl);
}

export default getWebviewHtml;
