/* eslint global-require: 0 */
// @flow

import path from 'path';
import { ipcMain } from 'electron';

import {
  openPage,
  buffers,
  createFile,
  closeItem,
  openItem,
} from './main/repository';

import {
  type Buffer,
} from './common/buffer';
import {
  isSimilarMessage,
} from './common/util';


if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

ipcMain.on('open-page', async (e, req) => {
  const result = await openPage(req);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.sender.send('open-page', result);
  e.returnValue = result;
});

ipcMain.on('buffers', async (e) => {
  const result = await buffers();
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.sender.send('update-buffers', result);
  e.returnValue = result;
});

// TODO: add-repository, remove-repository時のconfig更新

ipcMain.on('create-file', async (e, arg: {repositoryName: string, path: string}) => {
  const result = await createFile(arg);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.sender.send('open-page', result);
  e.sender.send('refresh-tree-view', result);

  e.sender.send('file-created', result);
  e.returnValue = result;
});

ipcMain.on('close-item', async (e, buf: Buffer) => {
  const result = await closeItem(buf);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.sender.send('update-buffer', result);
  e.returnValue = result;
});


ipcMain.on('open-item', async (e, buf: Buffer) => {
  const result = await openItem(buf);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.sender.send('update-buffer', result);
  e.returnValue = result;
});

require('./main/app');
// require('./main/window');
// require('./main/repository');
