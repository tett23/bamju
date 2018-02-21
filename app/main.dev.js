/* eslint global-require: 0, flowtype/no-weak-types: 0 */
// @flow

import fs from 'fs';
import path from 'path';
import { ipcMain } from 'electron';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { forwardToRenderer, replayActionMain } from 'electron-redux';
import opn from 'opn';
import {
  appReducer,
  initialState,
} from './reducers/main';
import {
  setStore,
} from './main/event_dispatcher';

import {
  getInstance as getConfigInstance
} from './common/bamju_config';
import {
  MessageTypeError,
} from './common/util';

const store = createStore(
  appReducer,
  initialState(),
  // $FlowFixMe
  compose(applyMiddleware(
    thunk,
    require('./middlewares/repositories').repositoriesMiddleware,
    require('./middlewares/windows').windowsMiddleware,
    require('./middlewares/parser').parserMiddleware,
    require('./middlewares/repositories_tree_view').repositoriesTreeViewMiddleware,
    forwardToRenderer
  ))
);

replayActionMain(store);

setStore(store);
store.subscribe(updateConfig);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  // $FlowFixMe
  require('module').globalPaths.push(p); // eslint-disable-line
}

function updateConfig() {
  const state = store.getState();

  console.log('updateConfig', JSON.stringify(state.windows, null, 2));
  getConfigInstance().updateByState(state);
}

ipcMain.on('get-state', (e) => {
  const state = store.getState();

  e.returnValue = state.global;
});

ipcMain.on('open-by-system-editor', async (e, absolutePath: string) => {
  console.log('open-by-system-editor', absolutePath);

  try {
    fs.statSync(absolutePath);
  } catch (err) {
    const message = {
      type: MessageTypeError,
      message: `open-by-system-editor stat error: ${err.message}. absolutePath=${absolutePath}`
    };
    e.sender.send('message', message);
    e.returnValue = message;
    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    opn(absolutePath);
  }

  e.returnValue = true;
});

require('./main/app');
require('./main/window');
