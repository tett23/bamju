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
  getInstance,
} from './common/repository_manager';
// import {
//   getInstance as getConfigInstance
// } from './common/bamju_config';
import {
  MessageTypeError,
} from './common/util';

console.log(require('./middlewares/repositories'));

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
// store.subscribe(updateConfig);

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

// function updateConfig() {
//   const state = store.getState();
//
//   // getConfigInstance().update(state);
// }

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

ipcMain.on('buffers', async (e) => {
  console.log('buffers');
  const ret = getInstance().toBuffers();

  e.sender.send('reload-buffers', ret);
  e.returnValue = ret;
});

// TODO: windowの更新
// ipcMain.on('create-file', async (e, arg: {repositoryName: string, path: string}) => {
//   console.log('create-file', arg);
//   const result:Buffer | Message = await createFile(arg);
//   if (result == null || isSimilarMessage(result)) {
//     e.sender.send('message', result);
//     e.returnValue = result;
//     return;
//   }
//
//   if (result.id == null) {
//     return;
//   }
//
//   const buffer:Buffer = (result: any);
//
//   const openPageResult = await openBuffer({ repositoryName: buffer.repositoryName, itemName: buffer.path });
//   if (!isSimilarMessage(openPageResult)) {
//     e.sender.send('open-buffer', openPageResult);
//   }
//
//   const repo = getInstance().find(buffer.repositoryName);
//   if (repo == null) {
//     e.returnValue = null;
//     return;
//   }
//
//   let tmp = buffer;
//   const parents = [];
//   while (tmp.parentID != null) {
//     const parent = repo.getItemByID(tmp.parentID);
//     if (parent == null) {
//       break;
//     }
//
//     parents.push(parent);
//     tmp = parent;
//   }
//
//   const ret = {
//     additons: [result],
//     changes: parents,
//   };
//
//   e.sender.send('file-created', ret);
//   e.returnValue = ret;
// });


require('./main/app');
require('./main/window');
// require('./main/repository');
