if (window.top === window.self) {
  throw new Error('[vscode:client]: must run in vscode webview');
}

const TAG = '[@tomjs:vscode:client] ';

patchAcquireVsCodeApi();

function onDomReady(callback) {
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    callback();
  }
  else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

// patch style and state
function patchInitData(data) {
  onDomReady(() => {
    console.log(TAG, 'patch client style');
    const { style, body, root } = data;

    document.documentElement.style.cssText = root.cssText;
    document.body.className = body.className;
    Object.keys(body.dataset).forEach((key) => {
      document.body.dataset[key] = body.dataset[key];
    });

    const defaultStyles = document.createElement('style');
    defaultStyles.id = '_defaultStyles';
    defaultStyles.textContent = style;
    document.head.appendChild(defaultStyles);
  });
}

const POST_MESSAGE_TYPE = '[vscode:client]:postMessage';
function patchAcquireVsCodeApi() {
  class AcquireVsCodeApi {
    postMessage(message: any) {
      console.log(TAG, 'mock acquireVsCodeApi.postMessage:', message);
      window.parent.postMessage({ type: POST_MESSAGE_TYPE, data: message }, '*');
    }

    getState() {
      console.log(TAG, 'mock acquireVsCodeApi.getState');
      const state = sessionStorage.getItem('vscodeState');
      return state ? JSON.parse(state) : undefined;
    }

    setState(newState: any) {
      console.log(TAG, 'mock acquireVsCodeApi.setState:', newState);
      sessionStorage.setItem('vscodeState', JSON.stringify(newState));
      return newState;
    }
  }

  console.log(TAG, 'patch acquireVsCodeApi');
  let api;
  window.acquireVsCodeApi = () => {
    if (!api) {
      api = new AcquireVsCodeApi();
      return api;
    }
    else {
      return api;
    }
  };
}

const INIT_TYPE = '[vscode:extension]:init';
window.addEventListener('message', (e) => {
  const { type, data } = e.data || {};
  if (!e.origin.startsWith('vscode-webview://') || type !== INIT_TYPE) {
    return;
  }

  patchInitData(data);
});

const KEYBOARD_EVENT_TYPE = '[vscode:client]:commands';
const isMac = navigator.userAgent.includes('Macintosh');
document.addEventListener('keydown', (e) => {
  console.log(e);
  const { metaKey, shiftKey, ctrlKey, altKey, key } = e;
  if (key === 'F1') {
    window.parent.postMessage({ type: KEYBOARD_EVENT_TYPE, data: 'F1' }, '*');
  }
  else if (isMac && metaKey && !altKey && !ctrlKey) {
    if (shiftKey) {
      if (key === 'z') {
        document.execCommand('redo');
      }
    }
    else if (key === 'a') {
      document.execCommand('selectAll');
    }
    else if (key === 'c') {
      document.execCommand('copy');
    }
    else if (key === 'v') {
      document.execCommand('paste');
    }
    else if (key === 'x') {
      document.execCommand('cut');
    }
    else if (key === 'z') {
      document.execCommand('undo');
    }
  }
});
