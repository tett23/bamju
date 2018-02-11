/* eslint global-require: 0, flowtype/no-weak-types: 0 */
// @flow

import path from 'path';
import { ipcMain } from 'electron';

import {
  openBuffer,
  buffers,
  addRepository,
  removeRepository,
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

ipcMain.on('open-page', async (e, req) => {
  console.log('open-page', req);
  const result = await openBuffer(req);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.sender.send('open-buffer', result);
  e.returnValue = result;
});

ipcMain.on('buffers', async (e) => {
  console.log('buffers');
  const result = await buffers();
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.sender.send('reload-repositories', result);
  e.returnValue = result;
});

// TODO: add-repository, remove-repository時のconfig更新
ipcMain.on('add-repository', async (e, arg: {absolutePath: string}) => {
  console.log('add-repository', arg);
  const result = await addRepository(arg.absolutePath);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  const repository:Repository = (result: any);
  await getConfigInstance().addRepository(repository.toConfig());

  await repository.load();

  const buffersResult = await buffers();
  if (isSimilarMessage(buffersResult)) {
    e.sender.send('message', buffersResult);
    e.returnValue = result;
    return;
  }

  e.sender.send('reload-repositories', buffersResult);
  e.returnValue = result;
});

ipcMain.on('remove-repository', async (e, arg: {absolutePath: string}) => {
  console.log('remove-repository', arg);
  const result = await removeRepository(arg.absolutePath);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  const buffersResult = await buffers();
  if (isSimilarMessage(buffersResult)) {
    e.sender.send('message', buffersResult);
    e.returnValue = result;
    return;
  }

  const repository:Repository = (result: any);
  await getConfigInstance().removeRepository(repository.name, repository.absolutePath);

  e.sender.send('reload-repositories', buffersResult);
  e.returnValue = result;
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
  const updated = [buffer];
  while (tmp.parentID != null) {
    const parent = repo.getItemByID(tmp.parentID);
    if (parent == null) {
      break;
    }

    updated.push(parent);
    tmp = parent;
  }
  e.sender.send('update-buffers', updated);

  e.sender.send('file-created', buffer);
  e.returnValue = buffer;
});

ipcMain.on('close-item', async (e, metaDataID: MetaDataID) => {
  console.log('close-item', metaDataID);
  const result = await closeItem(metaDataID);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.sender.send('update-buffers', [result]);
  e.returnValue = result;
});


ipcMain.on('open-item', async (e, metaDataID: MetaDataID) => {
  console.log('open-item', metaDataID);
  const result = await openItem(metaDataID);
  if (isSimilarMessage(result)) {
    e.sender.send('message', result);
    e.returnValue = result;
    return;
  }

  e.sender.send('update-buffers', [result]);
  e.returnValue = result;
});

require('./main/app');
// require('./main/window');
// require('./main/repository');
