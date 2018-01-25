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
import appReducer from './renderer/reducers';
import { openPageByBuffer } from './renderer/actions/tab';
import { refreshTreeView, refreshTreeViewItem } from './renderer/actions/tree_view';
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

ipcRenderer.on('refresh-tree-view', (event, tv) => {
  console.log('refresh-tree-view', tv);

  // なんで送られたきた値を使わないで直接Managerに触れるみたいな治安の悪い状態になっているかというと、
  // ipcがネイティブの実装のため、classのインスタンスを送ると単なるObjectになって、型の検証に失敗するため
  (async () => {
    await Project.Manager.loadProjects();
    const projects:Project.Projects = Project.Manager.projects();
    store.dispatch(refreshTreeView(projects));
  })();
});

ipcRenderer.on('refresh-tree-view-item', (event, { projectName, path, items }) => {
  console.log('refresh-tree-view-item', projectName, path, items);

  // なんで送られたきた値を使わないで直接Managerに触れるみたいな治安の悪い状態になっているかというと、
  // ipcがネイティブの実装のため、classのインスタンスを送ると単なるObjectになって、型の検証に失敗するため
  (async () => {
    await Project.Manager.loadProjects();
    const update = Project.Manager.detect(projectName, path);
    if (update == null) {
      return;
    }

    store.dispatch(refreshTreeViewItem(projectName, path, update));
  })();
});

window.wikiLinkOnClickAvailable = (repo, name) => {
  console.log('wikiLinkOnClickAvailable', repo, name);

  ipcRenderer.send('open-page', { windowID: window.windowID, projectName: repo, itemName: name });
};

window.wikiLinkOnClickUnAvailable = (repo, name) => {
  console.log('wikiLinkOnClickUnAvailable', repo, name);
};
