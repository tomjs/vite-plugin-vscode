import { useState } from 'react';
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import { vscode } from './utils/vscode';

import './App.css';

function App() {
  function onPostMessage() {
    vscode.postMessage({
      type: 'hello',
      data: 'Hey there partner! 🤠' + message,
    });
  }

  const [message, setMessage] = useState('');
  const [state, setState] = useState('');

  const onSetState = () => {
    vscode.setState(state);
  };
  const onGetState = () => {
    setState(vscode.getState() as string);
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
