<script setup lang="ts">
import { ref } from 'vue';
import { vscodeWebview } from '@tomjs/vscode-webview';
import { allComponents, provideVSCodeDesignSystem } from '@vscode/webview-ui-toolkit';
import { vscode } from './utils';

provideVSCodeDesignSystem().register(allComponents);

function onPostMessage() {
  vscodeWebview.postMessage('hello', 'Hey there partner! 🤠');
}

vscodeWebview.on('hello', data => {
  console.log('on message:', data);
});

const message = ref('');
const state = ref('');

const onSetState = () => {
  vscode.setState(state.value);
};

const onGetState = async () => {
  state.value = (await vscode.getState()) as string;
};
</script>

<template>
  <main>
    <h1>Hello Vue!</h1>
    <vscode-button @click="onPostMessage">Test VSCode Message</vscode-button>
    <div>
      <vscode-text-field :value="message" @input="e => (message = e.target.value)">
        Please enter a message
      </vscode-text-field>
      <div>Message is: {{ message }}</div>
    </div>
    <div>
      <vscode-text-field :value="state" @input="e => (state = e.target.value)">
        Please enter a state
      </vscode-text-field>
      <div>State is: {{ state }}</div>
      <div>
        <vscode-button @click="onSetState">setState</vscode-button>
        <vscode-button style="margin-left: 8px" @click="onGetState">getState</vscode-button>
      </div>
    </div>
  </main>
</template>

<style>
main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  height: 100%;
}
</style>
