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
} from './actions/modals';
import {
  parseInternalPath
} from './actions/parser';
import {
  createFile,
} from './actions/repositories';
import {
  type MetaDataID,
  internalPath,
} from './common/metadata';
import {
  windowMetaMiddleware
} from './middlewares/window_meta';
import './app.global.css';

const init = Object.assign({}, initialState(), {
  global: ipcRenderer.sendSync('get-state'),
});

const store = createStore(
  appReducer,
  init,
  // $FlowFixMe
  compose(applyMiddleware(
    windowMetaMiddleware,
    forwardToMain
  ))
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

  window.windowID = conf.id;
});

ipcRenderer.on('buffer-content-updated', (event, [metaDataID, content]: [MetaDataID, string]) => {
  console.log('buffer-content-updated', metaDataID, content);

  store.dispatch(updateTab(store.getState().browser.tabs[0].id, metaDataID, content));
});

window.wikiLinkOnClickAvailable = (repo: string, name: string) => {
  console.log('wikiLinkOnClickAvailable', repo, name);

  const tabID = store.getState().browser.tabs[0].id;

  store.dispatch(parseInternalPath(tabID, internalPath(repo, name)));
};

window.wikiLinkOnClickUnAvailable = (repo: string, formValue: string) => {
  console.log('wikiLinkOnClickUnAvailable', repo, formValue);
  store.dispatch(openInputDialog({
    label: 'new file',
    formValue,
    placeholder: 'input file name',
    onEnter: (itemPath) => {
      store.dispatch(createFile(repo, itemPath));
    }
  }));
};
