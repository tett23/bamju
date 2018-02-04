// @flow

import React from 'react';
import { createStore } from 'redux';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ipcRenderer } from 'electron';
import EditorRoot from './renderer/containers/EditorRoot';
import editorReducer from './renderer/reducers/editor_combined';
import { openBuffer } from './renderer/actions/editor';
import {
  type Buffer
} from './common/project';
import './app.global.css';

const store = createStore(
  editorReducer,
  undefined,
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

ipcRenderer.on('initialize', (event, buffer: Buffer) => {
  store.dispatch(openBuffer(buffer));
});

ipcRenderer.on('send-buffer-information', (_) => {
  const state = store.getState();

  ipcRenderer.send('save-buffer', state.editor.buffer);
});
