// @flow

import { ipcMain } from 'electron';
import opn from 'opn';
import path from '../common/path';
import {
  RepositoryManager,
  getInstance,
} from '../common/repository_manager';
import {
  resolveInternalPath,
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';
import {
  Config,
  Window as WindowConfig,
  findWindowConfig,
  replaceWindowConfig
} from '../common/bamju_config';
import {
  MessageTypeSucceeded,
  MessageTypeFailed,
} from '../common/util';

ipcMain.on('open-page', async (e, { repositoryName, itemName }) => {
  const repo = getInstance().find(repositoryName);
  if (repo == null) {
    const mes = {
      type: MessageTypeFailed,
      message: '',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const metaData = repo.detect(itemName);
  if (metaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: '',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const content = await metaData.getContent();
  const ret = [metaData, content];

  e.sender.send('open-page', ret);
  e.returnValue = ret;
});

ipcMain.on('refresh-tree-view', async (e) => {
  const ret = getInstance().toBuffers();

  e.sender.send('refresh-tree-view', ret);
  e.returnValue = ret;
});

ipcMain.on('open-by-system-editor', async (e, absolutePath: string) => {
  opn(absolutePath);
});

ipcMain.on('add-project', async (e, { absolutePath }) => {
  const repositoryName = path.basename(absolutePath);
  const [repository, message] = await getInstance().addRepository({
    repositoryName,
    absolutePath,
  }, []);
  if (repository == null || message !== MessageTypeSucceeded) {
    e.sender.send('message', message);
    e.returnValue = null;
    return;
  }

  const ret = getInstance().toBuffers();

  e.sender.send('refresh-tree-view', ret);
  e.returnValue = ret;
});

ipcMain.on('remove-project', async (e, { absolutePath }) => {
  const repositoryName = path.basename(absolutePath);
  getInstance().removeRepository(repositoryName);

  const ret = getInstance().toBuffers();

  e.sender.send('refresh-tree-view', ret);
  e.returnValue = ret;
});

ipcMain.on('close-tree-view-item', async (e, { repositoryName, itemPath }) => {
  const repo = getInstance().find(repositoryName);
  if (repo == null) {
    const mes = {
      type: MessageTypeFailed,
      message: 'close-tree-view-item error',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const metaData = repo.closeItem(itemPath);
  if (metaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: 'close-tree-view-item error',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const ret = {
    repositoryName,
    metaData: metaData.toBuffer()
  };

  e.sender.send('refresh-tree-view-item', ret);
  e.returnValue = ret;
});

ipcMain.on('open-tree-view-item', async (e, { repositoryName, itemPath }) => {
  const repo = getInstance().find(repositoryName);
  if (repo == null) {
    const mes = {
      type: MessageTypeFailed,
      message: 'open-tree-view-item error',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const metaData = await repo.openItem(itemPath);
  if (metaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: 'open-tree-view-item error',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const ret = {
    repositoryName,
    metaData: metaData.toBuffer()
  };

  e.sender.send('refresh-tree-view-item', ret);
  e.returnValue = ret;
});

ipcMain.on('create-file', async (e, { repositoryName, itemPath }: { repositoryName: string, itemPath: string}) => {
  const info = resolveInternalPath(itemPath);
  info.repositoryName = info.repositoryName || repositoryName;

  const repo = getInstance().find(repositoryName);
  if (repo == null) {
    const mes = {
      type: MessageTypeFailed,
      message: 'close-tree-view-item error',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const [metaData, message] = await repo.addFile(info.path, '');
  if (metaData == null || message.type !== MessageTypeSucceeded) {
    const mes = {
      type: MessageTypeFailed,
      message: message.message,
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const content = await metaData.getContent();
  e.sender.send('open-page', [metaData, content]);

  await metaData.open();

  e.sender.send('refresh-tree-view', repo.toBuffers());

  e.sender.send('file-created', metaData);
  e.returnValue = metaData;
});
