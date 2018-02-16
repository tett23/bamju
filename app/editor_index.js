// @flow

import React from 'react';
import { createStore, applyMiddleware, compose } from 'redux';
import { electronEnhancer } from 'redux-electron-store';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ipcRenderer } from 'electron';
import EditorRoot from './renderer/containers/EditorRoot';
import {
  appReducer,
} from './reducers/editor_combined';
import { openBuffer } from './actions/editor';
import { addMessage } from './actions/messages';
import {
  type Buffer
} from './common/buffer';
import {
  type Message
} from './common/util';
import './app.global.css';

const store = createStore(
  appReducer,
  ipcRenderer.sendSync('get-state'),
  compose(
    applyMiddleware(),
    electronEnhancer({
      dispatchProxy: a => {
        return store.dispatch(a);
      },
    })
  )
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
