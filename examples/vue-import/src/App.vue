<script setup lang="ts">
import { onMounted, ref } from 'vue';
import * as PIXI from 'pixi.js';
import { allComponents, provideVSCodeDesignSystem } from '@vscode/webview-ui-toolkit';
import { vscode } from './utils';

provideVSCodeDesignSystem().register(allComponents);

function onPostMessage() {
  vscode.postMessage({
    command: 'hello',
    text: 'Hey there partner! 🤠',
  });
}

const message = ref('');
const state = ref('');

const onSetState = () => {
  vscode.setState(state.value);
};

const onGetState = () => {
  state.value = vscode.getState() as string;
};

onMounted(async () => {
  const app = new PIXI.Application();

  await app.init({
    background: '#1099bb',
    resizeTo: window,
  });

  document.body.appendChild(app.canvas);
});
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
