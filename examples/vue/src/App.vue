<script setup lang="ts">
import { allComponents, provideVSCodeDesignSystem } from '@vscode/webview-ui-toolkit';
import { ref } from 'vue';
import { vscodeApi } from './utils';

provideVSCodeDesignSystem().register(allComponents);

console.log('--inject--', window.__FLAG1__, window.__FLAG2__);

const message = ref('');
const state = ref('');

function onSetState() {
  vscodeApi.setState(state.value);
}

function onGetState() {
  state.value = vscodeApi.getState() || '';
}

function onPostMessage() {
  vscodeApi.postMessage({
    type: 'hello',
    data: `💬: ${message.value || 'Empty'}`,
  });

  setTimeout(() => {
    vscodeApi.post('hello3', `⛅: ${message.value || 'Empty'}`);
  }, 100);
}

const receive = ref('');
function onPostAndReceive() {
  vscodeApi.postAndReceive('hello2', `😀: ${message.value || 'Empty'}`).then((data: any) => {
    console.log('data', data);
    receive.value = data;
  });
}

vscodeApi.on('hello3', (data: any) => {
  console.log('watch [hello3]: ', data);
});
</script>

<template>
  <main>
    <h1>Hello Vue!</h1>
    <vscode-button @click="onPostMessage">
      Post Message
    </vscode-button>
    <div style="margin-top: 8px">
      <vscode-button @click="onPostAndReceive">
        Post Message And Receive
      </vscode-button>
      <span v-if="receive" style="margin-left: 8px">{{ receive }}</span>
    </div>
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
        <vscode-button @click="onSetState">
          setState
        </vscode-button>
        <vscode-button style="margin-left: 8px" @click="onGetState">
          getState
        </vscode-button>
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
