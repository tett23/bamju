// @flow

import React from 'react';
import { createStore } from 'redux';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ipcRenderer } from 'electron';
import EditorRoot from './renderer/containers/EditorRoot';
import {
  appReducer,
  initialState,
} from './renderer/reducers/editor_combined';
import { openBuffer } from './renderer/actions/editor';
import { addMessage } from './renderer/actions/messages';
import {
  type Buffer
} from './common/buffer';
import {
  type Message
} from './common/util';
import './app.global.css';

const store = createStore(
  appReducer,
  initialState(),
);

const root = document.getElementById('root');
if (root != null) {
  render(
    <AppContainer>
      <EditorRoot store={store} />
    </AppContainer>,
    root
  );
}

ipcRenderer.on('initialize', (event, [buffer, content]: [Buffer, string]) => {
  console.log('initialize', buffer, content);
  store.dispatch(openBuffer(buffer, content));
});

ipcRenderer.on('send-buffer-information', (_) => {
  console.log('send-buffer-information');
  const state = store.getState();

  ipcRenderer.send('save-buffer', [state.editor.buffer.id, state.editor.content]);
});

ipcRenderer.on('message', (_, message: Message) => {
  console.log('message', message);

  store.dispatch(addMessage(message));
});
