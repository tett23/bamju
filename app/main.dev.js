/* eslint global-require: 0 */
// @flow

import path from 'path';
import { ipcMain } from 'electron';

import {
  openPage,
  refreshTreeView,
  createFile,
} from './main/repository';

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

ipcMain.on('open-page', openPage);
ipcMain.on('refresh-tree-view', refreshTreeView);
ipcMain.on('create-file', async (e, arg: {repositoryName: string, itemPath: string}) => {
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

// require('./main/app');
// require('./main/window');
// require('./main/repository');
