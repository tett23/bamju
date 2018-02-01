// @flow
/* eslint disable-line: 0, global-require:0 */

import React from 'react';
import { createStore, applyMiddleware } from 'redux';
import {
  forwardToMain,
  replayActionRenderer,
  getInitialStateRenderer,
} from 'electron-redux';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ipcRenderer } from 'electron';
import Root from './renderer/containers/Root';
import { appReducer } from './renderer/reducers/index';
import { openPageByBuffer } from './renderer/actions/tab';
import { refreshTreeView, refreshTreeViewItem } from './renderer/actions/tree_view';
import type { BufferItem } from './common/project';
import './app.global.css';
// import * as Project from './common/project';

const Project = require('./common/project');
const { Window: WindowConfig } = require('./common/bamju_config');

const initialState = getInitialStateRenderer();
console.log('initialState', initialState);

const store = createStore(
  appReducer,
  initialState,
  applyMiddleware(forwardToMain)
  // IMPORTANT! This goes first
);

replayActionRenderer(store);

const root = document.getElementById('root');
if (root !== null && root !== undefined) {
  render(
    <AppContainer>
      <Root store={store} />
    </AppContainer>,
    root
  );
}

if (module.hot.accept !== null && module.hot.accept !== undefined) {
  if (root !== null && root !== undefined) {
    module.hot.accept('./renderer/containers/Root', () => {
      const NextRoot = require('./renderer/containers/Root');

      render(
        <AppContainer>
          <NextRoot store={store} />
        </AppContainer>,
        root
      );
    });
  }
}

ipcRenderer.on('initialize', (event, conf: WindowConfig) => {
  (async () => {
    await Project.Manager.init();

    window.windowID = conf.id;

    const projectName:string = conf.tabs[0].buffer.projectName || '';
    const itemName:string = conf.tabs[0].buffer.path || '';

    ipcRenderer.sendSync('refresh-tree-view');
    ipcRenderer.send('open-page', { windowID: window.windowID, projectName, itemName });
  })();
});

ipcRenderer.on('open-page', (event, buf: ?Project.Buffer) => {
  console.log('open-page', buf);
  if (buf === undefined || buf === null) {
    return;
  }

  store.dispatch(openPageByBuffer(buf));
});

ipcRenderer.on('refresh-tree-view', (event, tv: Array<BufferItem>) => {
  console.log('refresh-tree-view', tv);

  store.dispatch(refreshTreeView(tv));
});

ipcRenderer.on('refresh-tree-view-item', (event, { projectName, path, items }: {projectName: string, path: string, items: Array<BufferItem>}) => {
  console.log('refresh-tree-view-item', projectName, path, items);

  store.dispatch(refreshTreeViewItem(projectName, path, items));
});

window.wikiLinkOnClickAvailable = (repo, name) => {
  console.log('wikiLinkOnClickAvailable', repo, name);

  ipcRenderer.send('open-page', { windowID: window.windowID, projectName: repo, itemName: name });
};

window.wikiLinkOnClickUnAvailable = (repo, name) => {
  console.log('wikiLinkOnClickUnAvailable', repo, name);
};
