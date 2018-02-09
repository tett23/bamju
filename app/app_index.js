// @flow
/* eslint disable-line: 0, global-require:0 */

import React from 'react';
import { createStore } from 'redux';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ipcRenderer } from 'electron';
import Root from './renderer/containers/Root';
import {
  appReducer,
  initialBrowserState,
  initialTreeViewState,
  initialModalState,
} from './renderer/reducers/combined';
import {
  openPageByBuffer,
  bufferUpdated
} from './renderer/actions/tab';
import { closeDialog, openNewFileDialog, updateMessage } from './renderer/actions/modal';
import {
  refreshTreeView,
  updateBuffer,
} from './renderer/actions/tree_view';
import {
  type Buffer
} from './common/buffer';
import './app.global.css';

const { Window: WindowConfig } = require('./common/bamju_config');

const store = createStore(
  appReducer,
  {
    browser: initialBrowserState(),
    treeView: initialTreeViewState(),
    modal: initialModalState()
  },
);

const root = document.getElementById('root');
if (root != null) {
  render(
    <AppContainer>
      <Root store={store} />
    </AppContainer>,
    root
  );
}

ipcRenderer.on('initialize', (event, conf: WindowConfig) => {
  (async () => {
    const repositoryName :string = conf.tabs[0].buffer.repositoryName || '';
    const itemName:string = conf.tabs[0].buffer.path || '';

    ipcRenderer.sendSync('buffers');
    ipcRenderer.send('open-page', { repositoryName, itemName });
  })();
});

ipcRenderer.on('open-page', (event, [buf, contents]: [Buffer, string]) => {
  console.log('open-page', buf, contents);
  if (buf == null) {
    return;
  }

  store.dispatch(openPageByBuffer(buf, contents));
});

ipcRenderer.on('buffer-updated', (event, [buf, contents]: [Buffer, string]) => {
  console.log('buffer-updated', buf);
  store.dispatch(bufferUpdated(buf, contents));
});

ipcRenderer.on('update-buffers', (event, repositories: {[string]: Buffer[]}) => {
  console.log('update-buffers', repositories);

  store.dispatch(refreshTreeView(repositories));
});

ipcRenderer.on('update-buffer', (event, buffer: Buffer) => {
  console.log('update-buffer', buffer);

  store.dispatch(updateBuffer(buffer));
});

ipcRenderer.on('file-created', (event, result: {success: boolean, message: string}) => {
  console.log('file-created', result);

  if (result.success) {
    store.dispatch(closeDialog());
  } else {
    store.dispatch(updateMessage(result.message));
  }
});

window.wikiLinkOnClickAvailable = (repo: string, name: string) => {
  console.log('wikiLinkOnClickAvailable', repo, name);

  ipcRenderer.send('open-page', { windowID: window.windowID, repositoryName: repo, itemName: name });
};

window.wikiLinkOnClickUnAvailable = (repo: string, formValue: string) => {
  console.log('wikiLinkOnClickUnAvailable', repo, formValue);
  store.dispatch(openNewFileDialog(repo, formValue));
};
