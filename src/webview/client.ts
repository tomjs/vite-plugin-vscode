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

function setStateData(data) {
  localStorage.setItem('vscode.state', JSON.stringify(data));
}

function getStateData() {
  try {
    const v = localStorage.getItem('vscode.state');
    return v ? JSON.parse(v) : v;
  } catch (e) {}
  return;
}

// patch style and state
function patchInitData(data) {
  const { state, style, body, root } = data;

  setStateData(state);

  document.documentElement.style.cssText = root.cssText;
  document.body.className = body.className;
  Object.keys(body.dataset).forEach(key => {
    document.body.dataset[key] = body.dataset[key];
  });

  const defaultStyles = document.createElement('style');
  defaultStyles.id = '_defaultStyles';
  defaultStyles.textContent = style;
  document.head.appendChild(defaultStyles);
}

function patchAcquireVsCodeApi() {
  class AcquireVsCodeApi {
    postMessage(message) {
      console.log(TAG + ' acquireVsCodeApi.postMessage:', message);
      window.parent.postMessage({ type: '[vscode:client]:postMessage', data: message }, '*');
    }
    getState() {
      console.log(TAG + ' acquireVsCodeApi.getState');
      return getStateData();
    }
    setState(newState) {
      console.log(TAG + ' acquireVsCodeApi.setState:', newState);
      setStateData(newState);
      window.parent.postMessage({ type: '[vscode:client]:setSate', data: newState }, '*');
    }
  }

  console.log(TAG + 'patch acquireVsCodeApi');
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
const GET_STATE_TYPE = '[vscode:extension]:state';

window.addEventListener('message', e => {
  const { type, data } = e.data || {};

  if (!e.origin.startsWith('vscode-webview://') || ![INIT_TYPE, GET_STATE_TYPE].includes(type)) {
    return;
  }

  onDomReady(function () {
    if (type === INIT_TYPE) {
      patchInitData(data);
    } else if (type === GET_STATE_TYPE) {
      localStorage.setItem('vscode.state', JSON.stringify(data));
    }
  });
});
