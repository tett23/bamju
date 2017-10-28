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
import Root from './renderer/containers/Root';
import appReducer from './renderer/reducers';
import { openPageByBuffer } from './renderer/actions/tab';
import { refreshTreeView } from './renderer/actions/tree_view';
import './app.global.css';
import type { Buffer, Projects } from './common/project';

const initialState = getInitialStateRenderer();
console.log('initialState', initialState);

const store = createStore(
  appReducer,
  initialState,
  applyMiddleware(
    forwardToMain, // IMPORTANT! This goes first
  )
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

const { ipcRenderer } = require('electron');
// ipc.sendAsync('open-page');

ipcRenderer.on('open-page', (event, buf: Buffer) => {
  console.log('open-page', buf);

  store.dispatch(openPageByBuffer(buf));
});

ipcRenderer.on('refresh-tree-view', (event, tv: Projects) => {
  console.log('refresh-tree-view', tv);

  store.dispatch(refreshTreeView(tv));
});

ipcRenderer.send('open-main-page');
ipcRenderer.send('refresh-tree-view');
