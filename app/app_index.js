// @flow
/* eslint disable-line: 0, global-require:0 */

import React from 'react';
import { createStore, applyMiddleware, compose } from 'redux';
import { forwardToMain, replayActionRenderer } from 'electron-redux';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ipcRenderer } from 'electron';
import Root from './renderer/containers/Root';
import {
  appReducer,
  initialState,
} from './reducers/app_window';
import {
  type Window,
} from './actions/windows';
import {
  updateTab
} from './actions/browser';
import {
  openInputDialog,
  closeAllDialog,
} from './actions/modals';
import {
  updateBuffers,
  type BufferUpdate,
} from './actions/buffers';
import { addMessage } from './actions/messages';
import {
  type MetaDataID
} from './common/metadata';
import {
  type Buffer
} from './common/buffer';
import {
  type Message
} from './common/util';
import './app.global.css';

const init = Object.assign({}, initialState(), {
  global: ipcRenderer.sendSync('get-state'),
});

const store = createStore(
  appReducer,
  init,
  compose(applyMiddleware(forwardToMain))
);

replayActionRenderer(store);

const root = document.getElementById('root');
if (root != null) {
  render(
    <AppContainer>
      <Root store={store} />
    </AppContainer>,
    root
  );
}

ipcRenderer.on('initialize', (event, conf: Window) => {
  console.log('initialize', conf);
  ipcRenderer.sendSync('buffers');

  window.windowID = conf.id;
});

ipcRenderer.on('open-buffer', (event, [buf, contents]: [Buffer, string]) => {
  console.log('open-buffer', buf, contents);
  if (buf == null) {
    return;
  }

  store.dispatch(updateTab(store.getState().browser.tabs[0].id, buf.id, contents));
});

ipcRenderer.on('buffer-content-updated', (event, [metaDataID, content]: [MetaDataID, string]) => {
  console.log('buffer-content-updated', metaDataID, content);

  store.dispatch(updateTab(store.getState().browser.tabs[0].id, metaDataID, content));
});

ipcRenderer.on('update-buffers', (event, updates: BufferUpdate) => {
  console.log('update-buffers', updates);

  store.dispatch(updateBuffers(updates));
});

ipcRenderer.on('file-created', (event, updates: BufferUpdate) => {
  console.log('file-created', updates);

  store.dispatch(closeAllDialog());
  store.dispatch(updateBuffers(updates));
});

ipcRenderer.on('message', (_, message: Message) => {
  console.log('message', message);

  store.dispatch(addMessage(message));
});

window.wikiLinkOnClickAvailable = (repo: string, name: string) => {
  console.log('wikiLinkOnClickAvailable', repo, name);

  // store.dispatch(updateTab(store.getState().browser.tabs[0].id, buf.id, contents));
  // store.dispatch(updateTab({
  //   repositoryName: repo,
  //   itemName: name
  // }));
  ipcRenderer.send('open-page', { windowID: window.windowID, repositoryName: repo, itemName: name });
};

window.wikiLinkOnClickUnAvailable = (repo: string, formValue: string) => {
  console.log('wikiLinkOnClickUnAvailable', repo, formValue);
  store.dispatch(openInputDialog({
    label: 'new file',
    formValue,
    placeholder: 'input file name',
    onEnter: (itemPath) => {
      ipcRenderer.send('create-file', {
        repositoryName: repo,
        path: itemPath
      });
    }
  }));
};
