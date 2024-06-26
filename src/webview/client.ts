if (window.top === window.self) {
  // @ts-ignore
  return;
}

const TAG = '[@tomjs:vscode:client] ';

patchAcquireVsCodeApi();

function onDomReady(callback) {
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    callback();
  } else {
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
    Object.keys(body.dataset).forEach(key => {
      document.body.dataset[key] = body.dataset[key];
    });

    const defaultStyles = document.createElement('style');
    defaultStyles.id = '_defaultStyles';
    defaultStyles.textContent = style;
    document.head.appendChild(defaultStyles);
  });
}

const GET_STATE_TYPE = '[vscode:client]:getState';
const SET_STATE_TYPE = '[vscode:client]:setState';
const POST_MESSAGE_TYPE = '[vscode:client]:postMessage';

function patchAcquireVsCodeApi() {
  class AcquireVsCodeApi {
    postMessage(message: any) {
      console.log(TAG, 'mock acquireVsCodeApi.postMessage:', message);
      window.parent.postMessage({ type: POST_MESSAGE_TYPE, data: message }, '*');
    }
    getState() {
      console.log(TAG, 'mock acquireVsCodeApi.getState');
      return new Promise((resolve, reject) => {
        function post() {
          window.parent.postMessage({ type: GET_STATE_TYPE }, '*');
        }

        const timeoutId = setTimeout(() => {
          window.removeEventListener('message', receive);
          reject(new Error('Timeout'));
        }, 2000);

        function receive(e: MessageEvent<any>) {
          console.log(e);
          if (!e.origin.startsWith('vscode-webview://') || e.data?.type !== GET_STATE_TYPE) {
            return;
          }

          window.removeEventListener('message', receive);
          clearTimeout(timeoutId);

          resolve(e.data?.data);
        }

        window.addEventListener('message', receive);
        post();
      });
    }
    setState(newState: any) {
      console.log(TAG, 'mock acquireVsCodeApi.setState:', newState);
      window.parent.postMessage({ type: SET_STATE_TYPE, data: newState }, '*');
      return newState;
    }
  }

  console.log(TAG, 'patch acquireVsCodeApi');
  let api;
  // @ts-ignore
  window.acquireVsCodeApi = () => {
    if (!api) {
      api = new AcquireVsCodeApi();
      return api;
    } else {
      return api;
    }
  };
}

const INIT_TYPE = '[vscode:extension]:init';

window.addEventListener('message', e => {
  const { type, data } = e.data || {};
  if (!e.origin.startsWith('vscode-webview://') || type !== INIT_TYPE) {
    return;
  }

  patchInitData(data);
});
