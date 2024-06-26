import { useState } from 'react';
import { vscodeWebview } from '@tomjs/vscode-webview';
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import { vscode } from './utils/vscode';

import './App.css';

function App() {
  function onPostMessage() {
    vscodeWebview.postMessage('hello', 'Hey there partner! 🤠');
  }

  vscodeWebview.on('hello', data => {
    console.log('on message:', data);
  });

  const [message, setMessage] = useState('');
  const [state, setState] = useState('');

  const onSetState = () => {
    vscode.setState(state);
  };
  const onGetState = async () => {
    setState((await vscode.getState()) as string);
  };

  return (
    <main>
      <h1>Hello React!</h1>
      <VSCodeButton onClick={onPostMessage}>Test VSCode Message</VSCodeButton>
      <div>
        <VSCodeTextField value={message} onInput={e => setMessage(e.target.value)}>
          Please enter a message
        </VSCodeTextField>
        <div>Message is: {message}</div>
      </div>
      <div>
        <VSCodeTextField value={state} onInput={e => setState(e.target.value)}>
          Please enter a state
        </VSCodeTextField>
        <div>State is: {state}</div>
        <div>
          <VSCodeButton onClick={onSetState}>setState</VSCodeButton>
          <VSCodeButton style={{ marginLeft: '8px' }} onClick={onGetState}>
            getState
          </VSCodeButton>
        </div>
      </div>
    </main>
  );
}

export default App;
