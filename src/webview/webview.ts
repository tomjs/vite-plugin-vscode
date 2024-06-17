import template from './template.html';

export interface WebviewHtmlDevOptions {
  /**
   * local server url
   */
  serverUrl: string;
}

/**
 *
 * @param options serverUrl string or object options
 */

export function getHtml(options: string | WebviewHtmlDevOptions) {
  const opts: WebviewHtmlDevOptions = {
    serverUrl: '',
  };

  if (typeof options === 'string') {
    opts.serverUrl = options;
  } else {
    Object.assign(opts, options);
  }

  return (template as string).replace(new RegExp('{{serverUrl}}', 'g'), opts.serverUrl);
}

export default getHtml;
