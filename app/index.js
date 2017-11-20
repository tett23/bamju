// @flow

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
import { refreshTreeView } from './renderer/actions/tree_view';
import './app.global.css';
import * as Project from './common/project';

const initialState = getInitialStateRenderer();
console.log('initialState', initialState);

const store = createStore(
  appReducer,
  initialState,
  applyMiddleware(forwardToMain)
  // IMPORTANT! This goes first
);

replayActionRenderer(store);

store.dispatch({ type: 'INITIALIZE_APP' });

render(
  <AppContainer>
    <Root store={store} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./renderer/containers/Root', () => {
    const NextRoot = require('./renderer/containers/Root'); // eslint-disable-line global-require

    store.dispatch({ type: 'INITIALIZE_APP' });

    render(
      <AppContainer>
        <NextRoot store={store} />
      </AppContainer>,
      document.getElementById('root')
    );

    ipcRenderer.send('open-main-page');
    ipcRenderer.send('refresh-tree-view');
  });
}

// ipc.sendAsync('open-page');

ipcRenderer.on('open-page', (event, buf: Project.Buffer) => {
  console.log('open-page', buf);

  store.dispatch(openPageByBuffer(buf));
});

ipcRenderer.on('refresh-tree-view', (event, tv) => {
  console.log('refresh-tree-view', tv);

  // なんで送られたきた値を使わないで直接Managerに触れるみたいな治安の悪い状態になっているかというと、
  // ipcがネイティブの実装のため、classのインスタンスを送ると単なるObjectになって、型の検証に失敗するため
  (async () => {
    const projects:Project.Projects = await Project.Manager.loadProjects();
    console.log(projects);
    store.dispatch(refreshTreeView(projects));
  })();
});

ipcRenderer.send('open-main-page');
ipcRenderer.send('refresh-tree-view');
