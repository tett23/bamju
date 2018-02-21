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
} from './reducers/editor_window';
import { openBuffer } from './actions/editor';
import {
  type Buffer
} from './common/buffer';
import './app.global.css';

const store = createStore(
  appReducer,
  initialState()
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
