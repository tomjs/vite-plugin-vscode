<script setup lang="ts">
import { ref } from 'vue';
import { allComponents, provideVSCodeDesignSystem } from '@vscode/webview-ui-toolkit';
import { vscode } from './utils';

provideVSCodeDesignSystem().register(allComponents);

function onPostMessage() {
  vscode.postMessage({
    command: 'hello',
    text: 'Hello World! 🤠',
  });
}

const message = ref('');
</script>

<template>
  <main>
    <h1>Hello Vue!</h1>
    <vscode-button @click="onPostMessage">Test VSCode Message</vscode-button>
    <div>
      <vscode-text-field :value="message" @input="e => (message = e.target.value)">
        Please enter a message
      </vscode-text-field>
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
