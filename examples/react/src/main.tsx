// eslint-disable-next-line simple-import-sort/imports
import '@tomjs/vscode-extension-webview/client';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
