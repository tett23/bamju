// @flow
/* eslint disable-line: 0, global-require:0 */

import React from 'react';
import { createStore, applyMiddleware, compose } from 'redux';
import { replayActionRenderer } from 'electron-redux';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ipcRenderer } from 'electron';
import Root from './renderer/containers/Root';
import {
  appReducer,
  initialState,
} from './reducers/app_window';
import {
  initialBrowserState,
} from './reducers/browser';
import {
  initialRepositoriesTreeViewState,
} from './reducers/repositories_tree_view';
import {
  type Window,
} from './reducers/windows';
import {
  windowInitialized,
} from './actions/windows';
import {
  initializeBrowser,
} from './actions/browser';
import {
  initializeRepositoriesTreeView,
} from './actions/repositories_tree_view';
import {
  filterWindowIDMiddleware,
  broadcastMainMiddleware,
} from './middlewares/window_meta';
import {
  setStore
} from './renderer/contextmenu';
import './app.global.css';

const init = Object.assign({}, initialState(), {
  global: ipcRenderer.sendSync('get-state'),
});

const store = createStore(
  appReducer,
  init,
  // $FlowFixMe
  compose(applyMiddleware(
    filterWindowIDMiddleware,
    broadcastMainMiddleware,
  ))
);

window.store = store;

replayActionRenderer(store);
setStore(store);

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

  window.windowID = conf.id;

  store.dispatch(initializeBrowser(conf.browser || initialBrowserState(), {
    scope: 'local'
  }));
  store.dispatch(initializeRepositoriesTreeView(conf.repositoriesTreeView || initialRepositoriesTreeViewState(), {
    scope: 'local'
  }));

  store.dispatch(windowInitialized(conf.id));
});
