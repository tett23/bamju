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
} from './renderer/reducers/repositories';
import {
  initialModalsState,
} from './renderer/reducers/modals';
import {
  initialMessagesState,
} from './renderer/reducers/messages';
import {
  openBuffer,
  bufferContentUpdated,
} from './renderer/actions/tab';
import {
  openInputDialog,
  closeAllDialog,
} from './renderer/actions/modals';
import {
  reloadRepositories,
  updateBuffers,
  type BufferUpdate,
} from './renderer/actions/repositories';
import { addMessage } from './renderer/actions/messages';
import {
  type MetaDataID
} from './common/metadata';
import {
  type Buffer
} from './common/buffer';
import {
  type Message
} from './common/util';
import {
  type WindowConfig
} from './common/window';
import './app.global.css';

const store = createStore(
  appReducer,
  {
    browser: initialBrowserState(),
    repositories: initialRepositoriesState(),
    modals: initialModalsState(),
    messages: initialMessagesState()
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

  window.windowID = conf.id;

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

ipcRenderer.on('buffer-content-updated', (event, [metaDataID, content]: [MetaDataID, string]) => {
  console.log('buffer-content-updated', metaDataID, content);

  store.dispatch(bufferContentUpdated(metaDataID, content));
});

ipcRenderer.on('reload-buffers', (event, buffers: Buffer[]) => {
  console.log('reload-buffers', buffers);
  store.dispatch(reloadRepositories(buffers));
});

ipcRenderer.on('update-buffers', (event, updates: BufferUpdate) => {
  console.log('update-buffers', updates);

  store.dispatch(updateBuffers(updates));
});

ipcRenderer.on('file-created', (event, result: {success: boolean, message: string}) => {
  console.log('file-created', result);

  if (result.success) {
    store.dispatch(closeAllDialog());
  }
});

ipcRenderer.on('message', (_, message: Message) => {
  console.log('message', message);

  store.dispatch(addMessage(message));
});

window.wikiLinkOnClickAvailable = (repo: string, name: string) => {
  console.log('wikiLinkOnClickAvailable', repo, name);

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
