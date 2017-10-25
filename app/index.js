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
import { openPageByBodyString } from './renderer/actions/tab';
import './app.global.css';

const initialState = getInitialStateRenderer();

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
  });
}

const { ipcRenderer } = require('electron');
// ipc.sendAsync('open-page');

ipcRenderer.on('open-page', (event, arg: string) => {
  console.log('open-page', arg);

  store.dispatch(openPageByBodyString(arg));
});

ipcRenderer.send('open-main-page', '', () => {
  console.log('hogehoge');
});
