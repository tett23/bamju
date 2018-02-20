/* eslint global-require: 0, flowtype/no-weak-types: 0 */
// @flow

import path from 'path';
import { ipcMain } from 'electron';
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { electronEnhancer } from 'redux-electron-store';
import {
  appReducer,
  initialState,
} from './reducers/app_window';
import {
  setStore,
} from './main/event_dispatcher';

import {
  openBuffer,
  openBySystemEditor,
  buffers,
  createFile,
  closeItem,
  openItem,
} from './main/repository';

import {
  getInstance,
} from './common/repository_manager';
import {
  Repository,
} from './common/repository';
import {
  type MetaDataID,
} from './common/metadata';
import {
  type Buffer,
} from './common/buffer';
import {
  getInstance as getConfigInstance
} from './common/bamju_config';
import {
  type Message,
  isSimilarMessage,
} from './common/util';

import {
  repositoriesMiddleware,
} from './middlewares/repositories';
import {
  windowsMiddleware,
} from './middlewares/windows';

const store = createStore(
  appReducer,
  initialState(),
  compose(
    applyMiddleware(
      thunk,
      repositoriesMiddleware,
      windowsMiddleware,
    ),
    electronEnhancer({
      dispatchProxy: a => store.dispatch(a),
    })
  )
);

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

function updateConfig() {
  const state = store.getState();

  // getConfigInstance().update(state);
}

ipcMain.on('get-state', (e) => {
  const state = store.getState();

  e.returnValue = state;
});

ipcMain.on('open-page', async (e, req) => {
  console.log('open-page', req);
  const benchID = `Project.openPage benchmark ${req.repositoryName} ${req.itemName}`;
  console.time(benchID);
  const result = await openBuffer(req);
  console.timeEnd(benchID);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.sender.send('open-buffer', result);
  e.returnValue = result;
});

ipcMain.on('open-by-system-editor', async (e, absolutePath: string) => {
  console.log('open-by-system-editor', absolutePath);
  const result = openBySystemEditor(absolutePath);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.returnValue = true;
});

ipcMain.on('buffers', async (e) => {
  console.log('buffers');
  const result = await buffers();
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  const ret = Object.keys(result).reduce((r, k) => r.concat(result[k]), []);

  e.sender.send('reload-buffers', ret);
  e.returnValue = ret;
});

// TODO: windowの更新
ipcMain.on('create-file', async (e, arg: {repositoryName: string, path: string}) => {
  console.log('create-file', arg);
  const result:Buffer | Message = await createFile(arg);
  if (result == null || isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  if (result.id == null) {
    return;
  }

  const buffer:Buffer = (result: any);

  const openPageResult = await openBuffer({ repositoryName: buffer.repositoryName, itemName: buffer.path });
  if (!isSimilarMessage(openPageResult)) {
    e.sender.send('open-buffer', openPageResult);
  }

  const repo = getInstance().find(buffer.repositoryName);
  if (repo == null) {
    e.returnValue = null;
    return;
  }

  let tmp = buffer;
  const parents = [];
  while (tmp.parentID != null) {
    const parent = repo.getItemByID(tmp.parentID);
    if (parent == null) {
      break;
    }

    parents.push(parent);
    tmp = parent;
  }

  const ret = {
    additons: [result],
    changes: parents,
  };

  e.sender.send('file-created', ret);
  e.returnValue = ret;
});

ipcMain.on('close-item', async (e, metaDataID: MetaDataID) => {
  console.log('close-item', metaDataID);
  const result = await closeItem(metaDataID);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  const ret = {
    changes: [result]
  };

  e.sender.send('update-buffers', ret);
  e.returnValue = ret;
});

// TODO: loadをchainさせて非同期でupdate-buffersを発行？
ipcMain.on('open-item', async (e, metaDataID: MetaDataID) => {
  console.log('open-item', metaDataID);

  const metaData = getInstance().getItemByID(metaDataID);
  if (metaData == null) {
    return;
  }

  const result = await openItem(metaDataID);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  const repositories = getInstance().toBuffers();
  const ret = Object.keys(repositories).reduce((r, k) => r.concat(repositories[k]), []);
  console.log('ret', ret);

  e.sender.send('reload-buffers', ret);
  e.returnValue = ret;
});

require('./main/app');
require('./main/window');
// require('./main/repository');
