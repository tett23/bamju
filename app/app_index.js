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
} from './renderer/reducers/combined';
import {
  initialBrowserState,
} from './renderer/reducers/browser';
import {
  initialRepositoriesState,
  type RepositoriesState,
} from './renderer/reducers/repositories';
import {
  initialModalState,
} from './renderer/reducers/modal';
import {
  openBuffer,
  bufferUpdated
} from './renderer/actions/tab';
import { closeDialog, openNewFileDialog, updateMessage } from './renderer/actions/modal';
import {
  reloadRepositories,
  updateBuffers,
  addBuffers,
  removeBuffers,
} from './renderer/actions/repositories';
import {
  type Buffer
} from './common/buffer';
import {
  type WindowConfig
} from './common/window';
import './app.global.css';

const store = createStore(
  appReducer,
  {
    browser: initialBrowserState(),
    repositories: initialRepositoriesState(),
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
  console.log('initialize', conf);
  ipcRenderer.sendSync('buffers');

  const tab = conf.tabs[0];
  if (tab != null) {
    ipcRenderer.send('open-page', { repositoryName: tab.buffer.repositoryName, itemName: tab.buffer.path });
  }
});

ipcRenderer.on('open-buffer', (event, [buf, contents]: [Buffer, string]) => {
  console.log('open-buffer', buf, contents);
  if (buf == null) {
    return;
  }

  store.dispatch(openBuffer(buf, contents));
});

ipcRenderer.on('buffer-updated', (event, [buffer, content]: [Buffer, string]) => {
  console.log('buffer-updated', buffer, content);
  if (buffer == null) {
    return;
  }

  store.dispatch(bufferUpdated(buffer, content));
});

ipcRenderer.on('reload-repositories', (event, repositories: RepositoriesState) => {
  console.log('reload-repositories', repositories);
  store.dispatch(reloadRepositories(repositories));
});

ipcRenderer.on('update-buffers', (event, buffers: Buffer[]) => {
  console.log('update-buffers', buffers);

  store.dispatch(updateBuffers(buffers));
});

ipcRenderer.on('add-buffers', (event, buffers: Buffer[]) => {
  console.log('add-buffers', buffers);

  store.dispatch(addBuffers(buffers));
});

ipcRenderer.on('remove-buffers', (event, buffers: Buffer[]) => {
  console.log('remove-buffers', buffers);

  store.dispatch(removeBuffers(buffers));
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
