// @flow
/* eslint disable-line: 0, global-require:0 */

import React from 'react';
import { createStore } from 'redux';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ipcRenderer } from 'electron';
import Root from './renderer/containers/Root';
import { appReducer } from './renderer/reducers/combined';
import {
  openPageByBuffer,
  bufferUpdated
} from './renderer/actions/tab';
import { closeDialog, openNewFileDialog, updateMessage } from './renderer/actions/modal';
import { refreshTreeView, openTreeViewItem } from './renderer/actions/tree_view';
import {
  type Buffer
} from './common/buffer';
import './app.global.css';

const Project = require('./common/project');
const { Window: WindowConfig } = require('./common/bamju_config');

const store = createStore(
  appReducer,
  undefined,
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
    const projectName:string = conf.tabs[0].buffer.projectName || '';
    const itemName:string = conf.tabs[0].buffer.path || '';

    ipcRenderer.sendSync('buffers');
    ipcRenderer.send('open-page', { projectName, itemName });
  })();
});

ipcRenderer.on('open-page', (event, buf: ?Buffer) => {
  console.log('open-page', buf);
  if (buf === undefined || buf === null) {
    return;
  }

  store.dispatch(openPageByBuffer(buf));
});

ipcRenderer.on('buffer-updated', (event, buf: Buffer) => {
  console.log('buffer-updated', buf);
  store.dispatch(bufferUpdated(buf));
});

ipcRenderer.on('update-buffers', (event, tv: Buffer[]) => {
  console.log('refresh-tree-view', tv);

  store.dispatch(refreshTreeView(tv));
});

ipcRenderer.on('update-buffer', (event, { projectName, path: itemPath, item }: {projectName: string, path: string, item: Buffer}) => {
  console.log('update-buffer', projectName, itemPath, item);

  store.dispatch(openTreeViewItem(projectName, itemPath, item));
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

  ipcRenderer.send('open-page', { windowID: window.windowID, projectName: repo, itemName: name });
};

window.wikiLinkOnClickUnAvailable = (repo: string, formValue: string) => {
  console.log('wikiLinkOnClickUnAvailable', repo, formValue);
  store.dispatch(openNewFileDialog(repo, formValue));
};
